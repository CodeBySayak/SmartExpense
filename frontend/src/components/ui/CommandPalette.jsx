/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function CommandPalette({ isOpen, onClose, onThemeChange, onTriggerMockData, onTriggerScanner }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const commands = [
    { id: "nav-dash", category: "Navigation", title: "Go to Dashboard", icon: "📊", action: () => navigate("/dashboard") },
    { id: "nav-exp", category: "Navigation", title: "Go to Expenses", icon: "💸", action: () => navigate("/expenses") },
    { id: "nav-inc", category: "Navigation", title: "Go to Income", icon: "💰", action: () => navigate("/income") },
    { id: "nav-anal", category: "Navigation", title: "Go to Analytics", icon: "📈", action: () => navigate("/analytics") },
    { id: "nav-goal", category: "Navigation", title: "Go to Goals", icon: "🎯", action: () => navigate("/goals") },
    
    { id: "theme-mid", category: "Themes", title: "Switch to Midnight Theme (Default)", icon: "🌌", action: () => onThemeChange("midnight") },
    { id: "theme-sun", category: "Themes", title: "Switch to Sunset Glow", icon: "🌇", action: () => onThemeChange("sunset") },
    { id: "theme-eme", category: "Themes", title: "Switch to Emerald Forest", icon: "🌲", action: () => onThemeChange("emerald") },
    { id: "theme-nor", category: "Themes", title: "Switch to Nordic Frost", icon: "❄️", action: () => onThemeChange("nordic") },
    
    { id: "cmd-scan", category: "Quick Actions", title: "Open AI Receipt Scanner Simulation", icon: "📸", action: () => { onClose(); onTriggerScanner && onTriggerScanner(); } },
    { id: "cmd-mock", category: "Developer", title: "Seed Demo Mock Data (Income & Expenses)", icon: "💾", action: () => { onClose(); onTriggerMockData && onTriggerMockData(); } },
  ];

  // Filter commands by search query
  const filtered = commands.filter(cmd =>
    cmd.title.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation inside palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
          onClose();
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-start justify-center pt-24 px-4">
      {/* Click outside closer overlay */}
      <div className="fixed inset-0" onClick={onClose}></div>

      {/* Palette Container */}
      <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative z-10 animate-in fade-in slide-in-from-top-4 duration-200">
        {/* Search Input bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search action (e.g. 'theme', 'goals')..."
            className="w-full bg-transparent border-none text-white text-sm focus:outline-none placeholder-slate-500"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950 text-slate-500 border border-slate-800 flex items-center gap-0.5">
            ESC
          </span>
        </div>

        {/* Action Results list */}
        <div className="max-h-[340px] overflow-y-auto p-2.5 space-y-1.5">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No actions found matching "{search}"
            </div>
          ) : (
            (() => {
              let currentCat = "";
              return filtered.map((cmd, index) => {
                const showCategoryHeader = cmd.category !== currentCat;
                currentCat = cmd.category;
                const isSelected = selectedIndex === index;

                return (
                  <div key={cmd.id}>
                    {showCategoryHeader && (
                      <div className="text-[9px] font-bold text-violet-400 uppercase tracking-wider px-3 py-1.5 mt-2">
                        {cmd.category}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        cmd.action();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                        isSelected
                          ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
                          : "text-slate-300 hover:bg-slate-800/40 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base">{cmd.icon}</span>
                        <span>{cmd.title}</span>
                      </div>
                      {isSelected && (
                        <span className="text-[9px] opacity-80 bg-slate-950/40 px-1.5 py-0.5 rounded">
                          ENTER
                        </span>
                      )}
                    </button>
                  </div>
                );
              });
            })()
          )}
        </div>

        {/* Palette footer hint */}
        <div className="p-3 border-t border-slate-800/60 bg-slate-950/30 flex items-center justify-between text-[9px] text-slate-500 font-medium">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <div>Press Cmd+K to launch from anywhere</div>
        </div>
      </div>
    </div>
  );
}
