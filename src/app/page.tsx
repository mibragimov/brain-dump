"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Brain,
  Search,
  Sparkles,
  Download,
  Upload,
  CheckSquare,
  Square,
  Plus,
  Trash2,
} from "lucide-react";
import { track, exportAnalytics } from "../lib/analytics";

type TaskStatus = "open" | "done";

interface TaskItem {
  id: string;
  label: string;
  status: TaskStatus;
  dueDate?: string | null;
  source: "ai" | "manual";
}

interface Dump {
  id: string;
  content: string;
  tags: string[];
  entities: string[];
  createdAt: string;
  updatedAt: string;
  aiSummary: string | null;
  aiActions: string[] | null;
  tasks: TaskItem[];
}

interface AIResponse {
  summary: string;
  actionItems: string[];
  tags: string[];
}

const STORAGE_DUMPS = "brain_dump_v2_dumps";
const STORAGE_DRAFT = "brain_dump_v2_draft";

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function parseHashtags(text: string): string[] {
  const tags = text.match(/(^|\s)#([a-zA-Z0-9_-]+)/g) || [];
  return Array.from(new Set(tags.map((t) => t.replace(/^\s*#/, "").toLowerCase())));
}

function parseEntities(text: string): string[] {
  // MVP-lite entity heuristic: capitalized words/phrases
  const matches = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g) || [];
  return Array.from(new Set(matches)).slice(0, 12);
}

function normalizeDump(raw: Partial<Dump>): Dump {
  return {
    id: raw.id || uid(),
    content: raw.content || "",
    tags: raw.tags || [],
    entities: raw.entities || [],
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
    aiSummary: raw.aiSummary ?? null,
    aiActions: raw.aiActions ?? null,
    tasks: (raw.tasks || []).map((t) => ({
      id: t.id || uid(),
      label: t.label || "",
      status: t.status === "done" ? "done" : "open",
      dueDate: t.dueDate ?? null,
      source: t.source === "manual" ? "manual" : "ai",
    })),
  };
}

function isToday(iso?: string | null) {
  if (!iso) return false;
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function isThisWeek(iso?: string | null) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return d >= monday && d <= sunday;
}

export default function Home() {
  const [dumps, setDumps] = useState<Dump[]>([]);
  const [draft, setDraft] = useState("");
  const [selectedDumpId, setSelectedDumpId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [entityFilter, setEntityFilter] = useState<string>("");
  const [taskWindow, setTaskWindow] = useState<"today" | "week" | "all">("today");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_DUMPS);
    const draftRaw = localStorage.getItem(STORAGE_DRAFT);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<Dump>[];
        setDumps(parsed.map(normalizeDump).sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)));
      } catch {
        setDumps([]);
      }
    }
    if (draftRaw) setDraft(draftRaw);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_DRAFT, draft);
    setSaveState("saving");
    const t = setTimeout(() => setSaveState("saved"), 400);
    return () => clearTimeout(t);
  }, [draft]);

  useEffect(() => {
    localStorage.setItem(STORAGE_DUMPS, JSON.stringify(dumps));
  }, [dumps]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void runAIOrganize();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, selectedDumpId, dumps]);

  const selectedDump = useMemo(
    () => dumps.find((d) => d.id === selectedDumpId) || null,
    [dumps, selectedDumpId]
  );

  const allTags = useMemo(() => Array.from(new Set(dumps.flatMap((d) => d.tags))), [dumps]);
  const allEntities = useMemo(() => Array.from(new Set(dumps.flatMap((d) => d.entities))), [dumps]);

  const visibleDumps = useMemo(() => {
    return dumps.filter((d) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        d.content.toLowerCase().includes(q) ||
        (d.aiSummary || "").toLowerCase().includes(q) ||
        d.tags.some((t) => t.includes(q)) ||
        d.entities.some((e) => e.toLowerCase().includes(q));

      const matchesTag = !tagFilter || d.tags.includes(tagFilter);
      const matchesEntity = !entityFilter || d.entities.includes(entityFilter);
      return matchesSearch && matchesTag && matchesEntity;
    });
  }, [dumps, search, tagFilter, entityFilter]);

  const aggregatedTasks = useMemo(() => {
    const rows: Array<{ dumpId: string; dumpCreatedAt: string; tags: string[]; entities: string[]; task: TaskItem }> = [];
    dumps.forEach((d) => {
      d.tasks.forEach((task) => {
        if (task.status !== "open") return;
        if (taskWindow === "today" && !isToday(task.dueDate)) return;
        if (taskWindow === "week" && !isThisWeek(task.dueDate)) return;
        if (tagFilter && !d.tags.includes(tagFilter)) return;
        if (entityFilter && !d.entities.includes(entityFilter)) return;
        rows.push({ dumpId: d.id, dumpCreatedAt: d.createdAt, tags: d.tags, entities: d.entities, task });
      });
    });
    return rows.sort((a, b) => +new Date(b.dumpCreatedAt) - +new Date(a.dumpCreatedAt));
  }, [dumps, taskWindow, tagFilter, entityFilter]);

  function upsertDump(update: Dump) {
    setDumps((prev) => {
      const idx = prev.findIndex((d) => d.id === update.id);
      if (idx === -1) return [update, ...prev];
      const cp = [...prev];
      cp[idx] = update;
      return cp.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
    });
  }

  function saveCurrentDump() {
    if (!draft.trim()) return;
    const now = new Date().toISOString();
    const tags = parseHashtags(draft);
    const entities = parseEntities(draft);

    if (selectedDump) {
      const next = normalizeDump({
        ...selectedDump,
        content: draft,
        tags: Array.from(new Set([...tags, ...selectedDump.tags])),
        entities: Array.from(new Set([...entities, ...selectedDump.entities])),
        updatedAt: now,
      });
      upsertDump(next);
      track("dump_saved", { kind: "update" });
      return;
    }

    const created = normalizeDump({
      id: uid(),
      content: draft,
      tags,
      entities,
      createdAt: now,
      updatedAt: now,
      tasks: [],
      aiSummary: null,
      aiActions: null,
    });
    upsertDump(created);
    setSelectedDumpId(created.id);
    track("dump_saved", { kind: "create" });
  }

  async function runAIOrganize() {
    if (!draft.trim()) return;
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft }),
      });

      if (!response.ok) throw new Error("AI analyze failed");
      const ai = (await response.json()) as AIResponse;

      const base = selectedDump
        ? selectedDump
        : normalizeDump({
            id: uid(),
            content: draft,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tags: parseHashtags(draft),
            entities: parseEntities(draft),
            tasks: [],
          });

      const aiTasks: TaskItem[] = (ai.actionItems || []).map((label) => ({
        id: uid(),
        label,
        status: "open",
        dueDate: null,
        source: "ai",
      }));

      const next = normalizeDump({
        ...base,
        content: draft,
        tags: Array.from(new Set([...(base.tags || []), ...parseHashtags(draft), ...(ai.tags || []).map((t) => t.toLowerCase())])),
        entities: Array.from(new Set([...(base.entities || []), ...parseEntities(draft)])), 
        aiSummary: ai.summary || null,
        aiActions: ai.actionItems || [],
        tasks: [...(base.tasks || []).filter((t) => t.source !== "ai"), ...aiTasks],
        updatedAt: new Date().toISOString(),
      });

      upsertDump(next);
      setSelectedDumpId(next.id);
      track("ai_organized", { actions: aiTasks.length, tags: next.tags.length });
    } catch (e) {
      console.error(e);
      alert("AI is temporarily unavailable. Your draft is still safe.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function openDump(id: string) {
    const d = dumps.find((x) => x.id === id);
    if (!d) return;
    setSelectedDumpId(d.id);
    setDraft(d.content);
  }

  function addManualTask() {
    if (!selectedDump) return;
    const label = prompt("Task text");
    if (!label?.trim()) return;
    const next = normalizeDump({
      ...selectedDump,
      tasks: [
        ...selectedDump.tasks,
        { id: uid(), label: label.trim(), status: "open", dueDate: null, source: "manual" },
      ],
      updatedAt: new Date().toISOString(),
    });
    upsertDump(next);
  }

  function toggleTask(dumpId: string, taskId: string) {
    const d = dumps.find((x) => x.id === dumpId);
    if (!d) return;
    const next = normalizeDump({
      ...d,
      tasks: d.tasks.map((t) =>
        t.id === taskId ? { ...t, status: t.status === "done" ? "open" : "done" } : t
      ),
      updatedAt: new Date().toISOString(),
    });
    upsertDump(next);
  }

  function removeTask(dumpId: string, taskId: string) {
    const d = dumps.find((x) => x.id === dumpId);
    if (!d) return;
    const next = normalizeDump({
      ...d,
      tasks: d.tasks.filter((t) => t.id !== taskId),
      updatedAt: new Date().toISOString(),
    });
    upsertDump(next);
  }

  function setTaskDueDate(dumpId: string, taskId: string, date: string) {
    const d = dumps.find((x) => x.id === dumpId);
    if (!d) return;
    const next = normalizeDump({
      ...d,
      tasks: d.tasks.map((t) => (t.id === taskId ? { ...t, dueDate: date || null } : t)),
      updatedAt: new Date().toISOString(),
    });
    upsertDump(next);
  }

  function exportJson() {
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      dumps,
      analytics: JSON.parse(exportAnalytics()),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brain-dump-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    track("export_json", { dumps: dumps.length });
  }

  function importJson() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      const text = await f.text();
      try {
        const parsed = JSON.parse(text) as Partial<Dump>[] | { dumps?: Partial<Dump>[] };
        const rows = Array.isArray(parsed) ? parsed : parsed.dumps || [];
        const incoming = rows.map(normalizeDump);
        setDumps((prev) => {
          const map = new Map<string, Dump>();
          prev.forEach((d) => map.set(d.id, d));
          incoming.forEach((d) => {
            const existing = map.get(d.id);
            if (!existing) {
              map.set(d.id, d);
              return;
            }
            // Conflict handling: keep latest updatedAt
            map.set(
              d.id,
              new Date(d.updatedAt) > new Date(existing.updatedAt) ? d : existing
            );
          });
          return Array.from(map.values()).sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
        });
        track("import_json", { imported: incoming.length });
      } catch {
        alert("Invalid JSON file");
      }
    };
    input.click();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-7xl p-4 md:p-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Brain className="text-violet-300" />
            <div>
              <h1 className="text-2xl font-semibold">Brain Dump + AI</h1>
              <p className="text-sm text-slate-400">Zero-friction capture. AI-organized summaries and actions.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={exportJson} className="rounded-md border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">
              <Download className="mr-1 inline h-4 w-4" /> Export
            </button>
            <button onClick={importJson} className="rounded-md border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">
              <Upload className="mr-1 inline h-4 w-4" /> Import
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 lg:col-span-7">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-300">Capture</h2>
              <span className="text-xs text-slate-400">{saveState === "saving" ? "Saving…" : "Saved"}</span>
            </div>
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="What's on your mind?"
              className="h-72 w-full rounded-lg border border-slate-800 bg-slate-950 p-4 outline-none ring-violet-500 focus:ring-1"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={saveCurrentDump} className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-900 hover:bg-white">
                Save dump
              </button>
              <button
                onClick={() => void runAIOrganize()}
                disabled={isAnalyzing || !draft.trim()}
                className="rounded-md bg-violet-500 px-3 py-2 text-sm text-white hover:bg-violet-400 disabled:opacity-60"
              >
                <Sparkles className="mr-1 inline h-4 w-4" /> {isAnalyzing ? "Organizing…" : "AI Organize"}
              </button>
              <span className="self-center text-xs text-slate-500">Shortcut: Cmd/Ctrl + Enter</span>
            </div>

            {selectedDump && (
              <div className="mt-4 rounded-lg border border-slate-800 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium">Tasks for selected dump</h3>
                  <button onClick={addManualTask} className="text-xs text-violet-300 hover:text-violet-200">
                    <Plus className="mr-1 inline h-3 w-3" /> Add task
                  </button>
                </div>
                {selectedDump.tasks.length === 0 ? (
                  <p className="text-sm text-slate-500">No tasks yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {selectedDump.tasks.map((task) => (
                      <li key={task.id} className="rounded-md border border-slate-800 bg-slate-950 p-2">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            onClick={() => toggleTask(selectedDump.id, task.id)}
                            className="mt-0.5 text-slate-300 hover:text-white"
                            aria-label="Toggle task"
                          >
                            {task.status === "done" ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                          </button>
                          <div className="flex-1">
                            <p className={task.status === "done" ? "text-slate-500 line-through" : "text-slate-200"}>{task.label}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <input
                                type="date"
                                value={task.dueDate ? task.dueDate.slice(0, 10) : ""}
                                onChange={(e) => setTaskDueDate(selectedDump.id, task.id, e.target.value)}
                                className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
                              />
                              <span className="text-xs text-slate-500">{task.source}</span>
                            </div>
                          </div>
                          <button onClick={() => removeTask(selectedDump.id, task.id)} className="text-slate-500 hover:text-red-400">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 lg:col-span-5">
            <h2 className="mb-3 text-sm font-medium text-slate-300">Today / This week actions</h2>
            <div className="mb-3 flex flex-wrap gap-2 text-sm">
              {([
                ["today", "Today"],
                ["week", "This week"],
                ["all", "All"],
              ] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => {
                    setTaskWindow(k);
                    track("task_window_changed", { window: k });
                  }}
                  className={`rounded px-2 py-1 ${taskWindow === k ? "bg-violet-500 text-white" : "bg-slate-800"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mb-3 grid gap-2 md:grid-cols-2">
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm"
              >
                <option value="">All tags</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>#{t}</option>
                ))}
              </select>
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm"
              >
                <option value="">All entities</option>
                {allEntities.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>

            <div className="max-h-80 space-y-2 overflow-auto">
              {aggregatedTasks.length === 0 ? (
                <p className="text-sm text-slate-500">No open tasks in this view.</p>
              ) : (
                aggregatedTasks.map((row) => (
                  <button
                    key={`${row.dumpId}-${row.task.id}`}
                    onClick={() => openDump(row.dumpId)}
                    className="w-full rounded-md border border-slate-800 bg-slate-950 p-2 text-left hover:border-violet-500"
                  >
                    <p className="text-sm text-slate-100">{row.task.label}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(row.dumpCreatedAt).toLocaleDateString()} {row.task.dueDate ? `• due ${row.task.dueDate.slice(0, 10)}` : ""}
                    </p>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 lg:col-span-12">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-slate-300">History</h2>
              <div className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search content, summary, tags, entities"
                  className="w-full rounded border border-slate-700 bg-slate-950 py-2 pl-8 pr-2 text-sm"
                />
              </div>
            </div>

            <div className="max-h-96 space-y-2 overflow-auto">
              {visibleDumps.length === 0 ? (
                <p className="text-sm text-slate-500">No dumps yet.</p>
              ) : (
                visibleDumps.map((d) => (
                  <article key={d.id} className="rounded-md border border-slate-800 bg-slate-950 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <button onClick={() => openDump(d.id)} className="text-sm font-medium hover:text-violet-300">
                        {new Date(d.createdAt).toLocaleString()}
                      </button>
                      <span className="text-xs text-slate-500">{d.tasks.filter((t) => t.status === "open").length} open</span>
                    </div>
                    <p className="line-clamp-2 text-sm text-slate-300">{d.content}</p>
                    {d.aiSummary && <p className="mt-2 line-clamp-2 text-xs text-violet-200">{d.aiSummary}</p>}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {d.tags.map((t) => (
                        <button key={t} onClick={() => setTagFilter(t)} className="rounded bg-slate-800 px-2 py-0.5 text-xs">#{t}</button>
                      ))}
                      {d.entities.map((e) => (
                        <button key={e} onClick={() => setEntityFilter(e)} className="rounded bg-slate-800 px-2 py-0.5 text-xs">{e}</button>
                      ))}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
