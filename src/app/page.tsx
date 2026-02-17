"use client";

import { useState, useEffect, useRef } from "react";
import { Save, Trash2, Copy, Check } from "lucide-react";

interface Dump {
  id: string;
  content: string;
  createdAt: string;
}

export default function Home() {
  const [dumps, setDumps] = useState<Dump[]>([]);
  const [currentText, setCurrentText] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("brain-dumps");
    if (saved) setDumps(JSON.parse(saved));
    
    const current = localStorage.getItem("brain-dump-current");
    if (current) setCurrentText(current);
  }, []);

  useEffect(() => {
    localStorage.setItem("brain-dump-current", currentText);
    setSaved(false);
    
    const timer = setTimeout(() => {
      setSaved(true);
      if (currentText.trim()) {
        const today = new Date().toISOString().split("T")[0];
        const existing = dumps.find(d => d.id === today);
        if (existing) {
          setDumps(dumps.map(d => 
            d.id === today ? { ...d, content: currentText } : d
          ));
        }
      }
      localStorage.setItem("brain-dumps", JSON.stringify(dumps));
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentText]);

  const saveDump = () => {
    if (!currentText.trim()) return;
    const today = new Date().toISOString().split("T")[0];
    const newDump: Dump = {
      id: today,
      content: currentText,
      createdAt: new Date().toISOString()
    };
    
    const existing = dumps.find(d => d.id === today);
    if (existing) {
      setDumps(dumps.map(d => d.id === today ? newDump : d));
    } else {
      setDumps([newDump, ...dumps]);
    }
    localStorage.setItem("brain-dumps", JSON.stringify(dumps));
    setSaved(true);
  };

  const loadDump = (dump: Dump) => {
    setCurrentText(dump.content);
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

  return (
    <main className="min-h-screen p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Brain Dump</h1>
          <p className="text-slate-400">Just type. Don't think. Don't organize.</p>
        </header>

        <div className="relative">
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
- Anything goes here
- No structure needed
- Don't organize, just dump"
            className="w-full h-96 bg-slate-800 border border-slate-700 rounded-xl p-6 text-lg resize-none focus:outline-none focus:border-cyan-500 leading-relaxed"
            autoFocus
          />
          
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              onClick={copyToClipboard}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
              title="Copy"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
            <button
              onClick={saveDump}
              className="p-2 bg-cyan-500 hover:bg-cyan-400 rounded-lg flex items-center gap-2 text-slate-900 font-medium"
            >
              <Save size={18} />
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>

        {dumps.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-4">Previous Dumps</h2>
            <div className="space-y-3">
              {dumps.map((dump) => (
                <div
                  key={dump.id}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <button
                      onClick={() => loadDump(dump)}
                      className="text-sm text-slate-400 hover:text-white"
                    >
                      {new Date(dump.createdAt).toLocaleDateString("en", {
                        weekday: "short",
                        month: "short",
                        day: "numeric"
                      })}
                    </button>
                    <button
                      onClick={() => deleteDump(dump.id)}
                      className="p-1 hover:bg-red-500/20 text-red-400 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-slate-300 line-clamp-2">
                    {dump.content.substring(0, 150)}...
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
