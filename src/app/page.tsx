"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Save, Trash2, Copy, Check, Sparkles, Wand2, Search, Download, Upload, 
  X, ChevronDown, ChevronUp, Lightbulb, Zap, Brain, MessageSquare, 
  Tag, Calendar, Archive, FileText, Sparkles as Stars, ArrowRight
} from "lucide-react";

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

// Cartoon avatar component
function CartoonBrain({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      <circle cx="50" cy="50" r="45" fill="#8B5CF6" />
      <ellipse cx="35" cy="40" rx="12" ry="15" fill="white" opacity="0.9" />
      <ellipse cx="65" cy="40" rx="12" ry="15" fill="white" opacity="0.9" />
      <circle cx="35" cy="40" r="6" fill="#1E293B" />
      <circle cx="65" cy="40" r="6" fill="#1E293B" />
      <circle cx="37" cy="38" r="2" fill="white" />
      <circle cx="67" cy="38" r="2" fill="white" />
      <path d="M 35 60 Q 50 75 65 60" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 30 25 L 35 35" stroke="#FCD34D" strokeWidth="4" strokeLinecap="round" />
      <path d="M 70 25 L 65 35" stroke="#FCD34D" strokeWidth="4" strokeLinecap="round" />
      <circle cx="30" cy="22" r="4" fill="#FCD34D" />
      <circle cx="70" cy="22" r="4" fill="#FCD34D" />
    </svg>
  );
}

// Floating character
function FloatingCharacter() {
  return (
    <motion.div
      animate={{ 
        y: [0, -10, 0],
        rotate: [0, 5, -5, 0]
      }}
      transition={{ 
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="fixed bottom-10 right-10 w-24 h-24 z-0 pointer-events-none"
    >
      <CartoonBrain className="w-full h-full" />
    </motion.div>
  );
}

// Bouncing button wrapper
function BouncyButton({ children, onClick, className, disabled }: any) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={className}
    >
      {children}
    </motion.button>
  );
}

// Pop-up notification
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.8 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full shadow-lg z-50"
    >
      {message}
    </motion.div>
  );
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
  const [toast, setToast] = useState<string | null>(null);
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
    }, 1500);

    return () => clearTimeout(timer);
  }, [currentText]);

  const allTags = Array.from(new Set(dumps.flatMap(d => d.tags)));

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
    setToast("Saved! 🎉");
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
        setToast("AI Analysis complete! ✨");
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
    setToast("AI suggestions applied! 🚀");
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
    setToast("Dump loaded! 📝");
  };

  const deleteDump = (id: string) => {
    setDumps(dumps.filter(d => d.id !== id));
    localStorage.setItem("brain-dumps", JSON.stringify(dumps.filter(d => d.id !== id)));
    setToast("Dump deleted 🗑️");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setToast("Copied to clipboard! 📋");
  };

  const exportData = () => {
    const data = JSON.stringify(dumps, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "brain-dump-backup.json";
    a.click();
    setToast("Exported! 💾");
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
            setToast("Imported! 📥");
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
      setToast("All cleared! 🧹");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Animated background bubbles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100, 
              y: Math.random() * 100 + 100 
            }}
            animate={{ 
              y: [null, -200],
              x: [null, Math.random() * 100 - 50]
            }}
            transition={{ 
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
            className="absolute w-20 h-20 rounded-full bg-white/5"
            style={{
              left: `${Math.random() * 100}%`,
              width: `${30 + Math.random() * 50}px`,
              height: `${30 + Math.random() * 50}px`,
            }}
          />
        ))}
      </div>

      <FloatingCharacter />

      <AnimatePresence>
        {toast && (
          <Toast message={toast} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>

      <main className="relative z-10 min-h-screen p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16"
              >
                <CartoonBrain className="w-full h-full" />
              </motion.div>
              <div>
                <h1 className="text-4xl font-black text-white drop-shadow-lg">
                  Brain Dump
                </h1>
                <p className="text-purple-200">Just type. Let AI help sort it out! ✨</p>
              </div>
            </div>
          </motion.header>

          {/* Main Editor */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-3xl p-6 mb-6 shadow-2xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="text-purple-300" size={20} />
              <span className="text-purple-200 font-medium">Your thoughts</span>
            </div>
            
            <textarea
              ref={textareaRef}
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              placeholder="Start typing everything in your head...

Ideas 💡
Tasks 📝
Worries 😰
Notes 📌
Reminders ⏰
#tags

Use #hashtags to auto-categorize!"
              className="w-full h-72 bg-white/5 border-2 border-white/10 rounded-2xl p-6 text-base resize-none focus:outline-none focus:border-purple-400 focus:bg-white/10 text-white placeholder:text-white/40 leading-relaxed transition-all"
            />
            
            <motion.div 
              className="flex flex-wrap items-center justify-between gap-3 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex gap-2">
                <BouncyButton
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-2 text-white"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </BouncyButton>
                
                <BouncyButton
                  onClick={saveDump}
                  disabled={!currentText.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-300 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center gap-2 text-green-900 font-bold"
                >
                  <Save size={18} />
                  <span>{saved ? "Saved!" : "Save"}</span>
                </BouncyButton>
              </div>
              
              <BouncyButton
                onClick={analyzeWithAI}
                disabled={!currentText.trim() || isAnalyzing}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 hover:from-purple-400 hover:via-pink-400 hover:to-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center gap-2 text-white font-bold shadow-lg"
              >
                <motion.div
                  animate={isAnalyzing ? { rotate: 360 } : {}}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles size={18} />
                </motion.div>
                <span>{isAnalyzing ? "Analyzing..." : "AI Organize"}</span>
                <Wand2 size={18} />
              </BouncyButton>
            </motion.div>

            {/* AI Results */}
            <AnimatePresence>
              {showAIResults && aiResults && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 p-6 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-yellow-500/20 border-2 border-purple-400/30 rounded-2xl"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Stars className="text-yellow-400" size={24} />
                    </motion.div>
                    <span className="font-bold text-white">AI Magic ✨</span>
                  </div>
                  
                  {aiResults.summary && (
                    <motion.div 
                      className="mb-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <p className="text-sm text-purple-200 mb-1">Summary</p>
                      <p className="text-white bg-white/10 rounded-xl p-3">{aiResults.summary}</p>
                    </motion.div>
                  )}
                  
                  {aiResults.actionItems.length > 0 && (
                    <motion.div 
                      className="mb-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <p className="text-sm text-purple-200 mb-1">Action Items</p>
                      <ul className="space-y-2">
                        {aiResults.actionItems.map((item, i) => (
                          <motion.li 
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * i }}
                            className="flex items-center gap-2 text-white bg-white/10 rounded-xl p-3"
                          >
                            <span className="text-yellow-400">⚡</span>
                            {item}
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                  
                  {aiResults.tags.length > 0 && (
                    <motion.div 
                      className="mb-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <p className="text-sm text-purple-200 mb-1">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {aiResults.tags.map((tag, i) => (
                          <motion.span 
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.05 * i }}
                            className="px-3 py-1 bg-pink-500/30 border border-pink-400/50 rounded-full text-white text-sm"
                          >
                            #{tag}
                          </motion.span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  
                  <BouncyButton
                    onClick={applyAISuggestions}
                    className="mt-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 rounded-xl text-white font-bold"
                  >
                    Apply Magic ✨
                  </BouncyButton>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Search and Filters */}
          {dumps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl p-4 mb-6"
            >
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search your dumps..."
                    className="w-full bg-white/10 border-2 border-white/10 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-purple-400 text-white placeholder:text-white/40"
                  />
                </div>
                {allTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {allTags.slice(0, 8).map(tag => (
                      <BouncyButton
                        key={tag}
                        onClick={() => setSelectedTags(
                          selectedTags.includes(tag) 
                            ? selectedTags.filter(t => t !== tag)
                            : [...selectedTags, tag]
                        )}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          selectedTags.includes(tag)
                            ? "bg-yellow-400 text-yellow-900 font-bold"
                            : "bg-white/10 hover:bg-white/20 text-white"
                        }`}
                      >
                        #{tag}
                      </BouncyButton>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Stats */}
          <motion.div 
            className="grid grid-cols-3 gap-4 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {[
              { label: "Dumps", value: dumps.length, icon: Archive, color: "from-purple-500 to-pink-500" },
              { label: "Tags", value: allTags.length, icon: Tag, color: "from-pink-500 to-yellow-500" },
              { label: "Actions", value: dumps.reduce((acc, d) => acc + (d.actionItems?.length || 0), 0), icon: Zap, color: "from-yellow-500 to-green-500" }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * i }}
                className="bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl p-4 text-center"
              >
                <stat.icon className="mx-auto mb-2 text-white" size={24} />
                <p className={`text-3xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </p>
                <p className="text-white/60 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            className="flex justify-center gap-4 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <BouncyButton
              onClick={exportData}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-2 text-white"
            >
              <Download size={18} />
              Export
            </BouncyButton>
            <BouncyButton
              onClick={importData}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-2 text-white"
            >
              <Upload size={18} />
              Import
            </BouncyButton>
            <BouncyButton
              onClick={clearAll}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl flex items-center gap-2 text-red-300"
            >
              <Trash2 size={18} />
              Clear All
            </BouncyButton>
          </motion.div>

          {/* Previous Dumps */}
          <AnimatePresence>
            {filteredDumps.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <FileText className="text-purple-300" />
                  Previous Dumps
                </h2>
                <div className="space-y-4">
                  {filteredDumps.map((dump, index) => (
                    <motion.div
                      key={dump.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl overflow-hidden"
                    >
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/10 transition-colors"
                        onClick={() => setExpandedDump(expandedDump === dump.id ? null : dump.id)}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <Calendar className="text-purple-300" size={16} />
                            <p className="font-medium text-white">
                              {new Date(dump.createdAt).toLocaleDateString("en", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric"
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {dump.tags.length > 0 && (
                              <div className="flex gap-1">
                                {dump.tags.slice(0, 3).map((tag, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-pink-500/30 rounded-full text-xs text-pink-200">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            {dump.actionItems && dump.actionItems.length > 0 && (
                              <span className="flex items-center gap-1 text-xs text-yellow-300">
                                <Lightbulb size={12} />
                                {dump.actionItems.length}
                              </span>
                            )}
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: expandedDump === dump.id ? 180 : 0 }}
                        >
                          <ChevronDown className="text-white/60" size={20} />
                        </motion.div>
                      </div>
                      
                      <AnimatePresence>
                        {expandedDump === dump.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-white/10"
                          >
                            <div className="p-4">
                              <p className="text-white/80 whitespace-pre-wrap mb-4">{dump.content}</p>
                              
                              {dump.summary && (
                                <div className="mb-3 p-3 bg-purple-500/20 rounded-xl">
                                  <p className="text-xs text-purple-300 mb-1">Summary</p>
                                  <p className="text-white text-sm">{dump.summary}</p>
                                </div>
                              )}
                              
                              {dump.actionItems && dump.actionItems.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs text-yellow-300 mb-1">Action Items</p>
                                  <ul className="text-sm space-y-1">
                                    {dump.actionItems.map((item, i) => (
                                      <li key={i} className="flex items-start gap-2 text-white">
                                        <span className="text-yellow-400">→</span>
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              <div className="flex gap-2 mt-4">
                                <BouncyButton
                                  onClick={() => loadDump(dump)}
                                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm text-white"
                                >
                                  Load
                                </BouncyButton>
                                <BouncyButton
                                  onClick={() => deleteDump(dump.id)}
                                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl text-sm text-red-300"
                                >
                                  Delete
                                </BouncyButton>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
