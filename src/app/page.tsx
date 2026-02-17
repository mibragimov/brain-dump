"use client";

import { useState, useEffect, useRef } from "react";
import { Save, Trash2, Copy, Check, Sparkles, Wand2, Search, Download, Upload, Tag, X, ChevronDown, ChevronUp, Lightbulb, Zap } from "lucide-react";

interface Dump {
  id: string;
  content: string;
  createdAt: string;
  tags: string[];
  summary?: string;
  actionItems?: string[];
}

interface AIResponse {
  summary: string;
  actionItems: string[];
  tags: string[];
}

export default function Home() {
  const [dumps, setDumps] = useState<Dump[]>([]);
  const [currentText, setCurrentText] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [expandedDump, setExpandedDump] = useState<string | null>(null);
  const [showAIResults, setShowAIResults] = useState(false);
  const [aiResults, setAiResults] = useState<AIResponse | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("brain-dumps");
    if (saved) setDumps(JSON.parse(saved));
    
    const current = localStorage.getItem("brain-dump-current");
    if (current) setCurrentText(current);
  }, []);

  // Auto-save current text
  useEffect(() => {
    localStorage.setItem("brain-dump-current", currentText);
    setSaved(false);
    
    const timer = setTimeout(() => {
      setSaved(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [currentText]);

  // Get all unique tags
  const allTags = Array.from(new Set(dumps.flatMap(d => d.tags)));

  // Filter dumps
  const filteredDumps = dumps.filter(dump => {
    const matchesSearch = dump.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dump.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(t => dump.tags.includes(t));
    return matchesSearch && matchesTags;
  });

  const saveDump = () => {
    if (!currentText.trim()) return;
    const today = new Date().toISOString().split("T")[0];
    const newDump: Dump = {
      id: today,
      content: currentText,
      createdAt: new Date().toISOString(),
      tags: extractTags(currentText),
    };
    
    const existingIndex = dumps.findIndex(d => d.id === today);
    if (existingIndex >= 0) {
      const updated = [...dumps];
      updated[existingIndex] = newDump;
      setDumps(updated);
    } else {
      setDumps([newDump, ...dumps]);
    }
    localStorage.setItem("brain-dumps", JSON.stringify(dumps));
    setSaved(true);
  };

  const extractTags = (text: string): string[] => {
    const tagMatches = text.match(/#\w+/g);
    if (tagMatches) {
      return tagMatches.map(t => t.replace('#', ''));
    }
    return [];
  };

  const analyzeWithAI = async () => {
    if (!currentText.trim()) return;
    
    setIsAnalyzing(true);
    setShowAIResults(false);
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: currentText })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAiResults(data);
        setShowAIResults(true);
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyAISuggestions = () => {
    if (!aiResults) return;
    
    const today = new Date().toISOString().split("T")[0];
    const newDump: Dump = {
      id: today,
      content: currentText,
      createdAt: new Date().toISOString(),
      tags: [...new Set([...extractTags(currentText), ...aiResults.tags])],
      summary: aiResults.summary,
      actionItems: aiResults.actionItems,
    };
    
    const existingIndex = dumps.findIndex(d => d.id === today);
    if (existingIndex >= 0) {
      const updated = [...dumps];
      updated[existingIndex] = newDump;
      setDumps(updated);
    } else {
      setDumps([newDump, ...dumps]);
    }
    localStorage.setItem("brain-dumps", JSON.stringify(dumps));
    setSaved(true);
    setShowAIResults(false);
    setAiResults(null);
  };

  const loadDump = (dump: Dump) => {
    setCurrentText(dump.content);
    if (dump.summary || dump.actionItems) {
      setAiResults({ 
        summary: dump.summary || '', 
        actionItems: dump.actionItems || [],
        tags: dump.tags 
      });
      setShowAIResults(true);
    }
  };

  const deleteDump = (id: string) => {
    setDumps(dumps.filter(d => d.id !== id));
    localStorage.setItem("brain-dumps", JSON.stringify(dumps.filter(d => d.id !== id)));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportData = () => {
    const data = JSON.stringify(dumps, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "brain-dump-backup.json";
    a.click();
  };

  const importData = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            setDumps(data);
            localStorage.setItem("brain-dumps", JSON.stringify(data));
          } catch (err) {
            alert("Invalid JSON file");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const clearAll = () => {
    if (confirm("Clear all dumps? This cannot be undone.")) {
      setDumps([]);
      setCurrentText("");
      localStorage.removeItem("brain-dumps");
      localStorage.removeItem("brain-dump-current");
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Brain Dump</h1>
            <p className="text-slate-400">Just type. Don't think. Let AI help organize.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportData} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg" title="Export">
              <Download size={18} />
            </button>
            <button onClick={importData} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg" title="Import">
              <Upload size={18} />
            </button>
            <button onClick={clearAll} className="p-2 bg-slate-800 hover:bg-red-900/30 text-red-400 rounded-lg" title="Clear All">
              <Trash2 size={18} />
            </button>
          </div>
        </header>

        {/* Main Editor */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6">
          <textarea
            ref={textareaRef}
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            placeholder="Start typing everything in your head...

Ideas
Tasks
Worries
Notes
Reminders
Thoughts
#tags

Use #hashtags to auto-categorize"
            className="w-full h-64 bg-slate-900 border border-slate-700 rounded-lg p-4 text-base resize-none focus:outline-none focus:border-cyan-500 leading-relaxed"
          />
          
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center gap-2"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span className="text-sm">{copied ? "Copied!" : "Copy"}</span>
              </button>
              <button
                onClick={saveDump}
                disabled={!currentText.trim()}
                className="p-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-2 text-slate-900 font-medium"
              >
                <Save size={16} />
                <span className="text-sm">{saved ? "Saved" : "Save"}</span>
              </button>
            </div>
            
            <button
              onClick={analyzeWithAI}
              disabled={!currentText.trim() || isAnalyzing}
              className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-2 text-white font-medium"
            >
              <Sparkles size={16} />
              <span className="text-sm">{isAnalyzing ? "Analyzing..." : "AI Organize"}</span>
            </button>
          </div>

          {/* AI Results */}
          {showAIResults && aiResults && (
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Wand2 size={18} className="text-purple-400" />
                <span className="font-medium text-purple-400">AI Suggestions</span>
              </div>
              
              {aiResults.summary && (
                <div className="mb-3">
                  <p className="text-sm text-slate-400 mb-1">Summary</p>
                  <p className="text-sm">{aiResults.summary}</p>
                </div>
              )}
              
              {aiResults.actionItems.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm text-slate-400 mb-1">Action Items</p>
                  <ul className="text-sm space-y-1">
                    {aiResults.actionItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Zap size={14} className="text-yellow-400 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {aiResults.tags.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm text-slate-400 mb-1">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {aiResults.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-700 rounded-full text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <button
                onClick={applyAISuggestions}
                className="mt-2 px-4 py-2 bg-purple-500 hover:bg-purple-400 rounded-lg text-sm text-white font-medium"
              >
                Apply to Save
              </button>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        {dumps.length > 0 && (
          <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dumps..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-cyan-500"
                />
              </div>
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {allTags.slice(0, 8).map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTags(
                        selectedTags.includes(tag) 
                          ? selectedTags.filter(t => t !== tag)
                          : [...selectedTags, tag]
                      )}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedTags.includes(tag)
                          ? "bg-cyan-500 text-slate-900"
                          : "bg-slate-700 hover:bg-slate-600"
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-cyan-400">{dumps.length}</p>
            <p className="text-sm text-slate-400">Total Dumps</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">{allTags.length}</p>
            <p className="text-sm text-slate-400">Tags</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-pink-400">
              {dumps.reduce((acc, d) => acc + (d.actionItems?.length || 0), 0)}
            </p>
            <p className="text-sm text-slate-400">Action Items</p>
          </div>
        </div>

        {/* Previous Dumps */}
        {filteredDumps.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Previous Dumps</h2>
            <div className="space-y-3">
              {filteredDumps.map((dump) => (
                <div
                  key={dump.id}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden"
                >
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-700/30"
                    onClick={() => setExpandedDump(expandedDump === dump.id ? null : dump.id)}
                  >
                    <div>
                      <p className="font-medium">
                        {new Date(dump.createdAt).toLocaleDateString("en", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {dump.tags.length > 0 && (
                          <div className="flex gap-1">
                            {dump.tags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="px-2 py-0.5 bg-slate-700 rounded-full text-xs">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {dump.actionItems && dump.actionItems.length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-yellow-400">
                            <Lightbulb size={12} />
                            {dump.actionItems.length}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {expandedDump === dump.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                  
                  {expandedDump === dump.id && (
                    <div className="border-t border-slate-700 p-4">
                      <p className="text-sm text-slate-300 whitespace-pre-wrap mb-4">{dump.content}</p>
                      
                      {dump.summary && (
                        <div className="mb-3 p-3 bg-purple-500/10 rounded-lg">
                          <p className="text-xs text-purple-400 mb-1">Summary</p>
                          <p className="text-sm">{dump.summary}</p>
                        </div>
                      )}
                      
                      {dump.actionItems && dump.actionItems.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-slate-400 mb-1">Action Items</p>
                          <ul className="text-sm space-y-1">
                            {dump.actionItems.map((item, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-yellow-400">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => loadDump(dump)}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteDump(dump.id)}
                          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
