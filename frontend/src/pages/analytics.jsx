import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";

export default function Analytics() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState("This Month");
  const [sortBy, setSortBy] = useState("spent");
  const [sortOrder, setSortOrder] = useState("desc");

  // Load user data from localStorage
  const [incomeSources] = useState(() => {
    if (!user?.id) return [];
    const savedInc = localStorage.getItem(`income_${user.id}`);
    return savedInc ? JSON.parse(savedInc) : [];
  });
  const [expenseCategories] = useState(() => {
    if (!user?.id) return [];
    const savedExp = localStorage.getItem(`expenses_${user.id}`);
    return savedExp ? JSON.parse(savedExp) : [];
  });

  // Recalculate metrics
  const totalIncome = incomeSources.reduce((acc, source) => acc + source.amount, 0);
  const totalExpenses = expenseCategories.reduce((acc, cat) => acc + cat.spent, 0);
  const netSavings = totalIncome - totalExpenses;


  // 11. Sortable Category Breakdown Table logic
  const sortedCategories = [...expenseCategories].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    if (sortBy === "remaining") {
      valA = a.budget - a.spent;
      valB = b.budget - b.spent;
    } else if (sortBy === "pct") {
      valA = a.budget > 0 ? a.spent / a.budget : 0;
      valB = b.budget > 0 ? b.spent / b.budget : 0;
    }

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // 12. Cash Flow Waterfall Chart Calculations
  // Represent bar heights matching inflow vs outflow vs net flow
  const maxWaterfallVal = Math.max(totalIncome, totalExpenses, Math.abs(netSavings)) || 1;
  const incBarHeight = (totalIncome / maxWaterfallVal) * 100;
  const expBarHeight = (totalExpenses / maxWaterfallVal) * 100;
  const netBarHeight = (Math.abs(netSavings) / maxWaterfallVal) * 100;

  // 13. AI Financial Insights
  const [insightText, setInsightText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);

  const topOverspent = [...expenseCategories]
    .filter(c => c.spent > c.budget)
    .sort((a, b) => (b.spent - b.budget) - (a.spent - a.budget))[0];

  const savingsProjected = netSavings * 1.05;

  const fullInsight = `Based on your simulated weekly spending logs:
- ${topOverspent ? `⚠️ Warning: Your top overspent category is "${topOverspent.name}" ($${(topOverspent.spent - topOverspent.budget).toFixed(0)} over cap). Consider scaling back immediate non-essentials.` : "✅ Great job! None of your primary categories are currently over-budget."}
- 💡 Opportunity: Shifting $150 from Subscriptions to Savings would raise your savings rate by ${(150 / (totalIncome || 5000) * 100).toFixed(1)}%.
- 🔮 Projections: Maintaining current pace projects a month-end vault balance of $${savingsProjected.toLocaleString(undefined, { maximumFractionDigits: 0 })}.`;



  useEffect(() => {
    if (typingIndex < fullInsight.length) {
      const timeout = setTimeout(() => {
        setInsightText(prev => prev + fullInsight[typingIndex]);
        setTypingIndex(prev => prev + 1);
      }, 15);
      return () => clearTimeout(timeout);
    }
  }, [typingIndex, fullInsight]);

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Review waterfall flows, multi-category trends, and AI recommendations.</p>
        </div>

        <div className="flex bg-slate-900/40 border border-slate-850 p-1 rounded-xl">
          {["This Month", "Last 30 Days", "This Year"].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${timeframe === t
                  ? "bg-violet-605 bg-violet-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

        {/* Multi-line spending trend SVG chart */}
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Weekly Category Trends</h2>

          {expenseCategories.length === 0 ? (
            <p className="text-slate-500 text-xs text-center py-10">No categories found to display trends.</p>
          ) : (
            <div className="h-44 w-full relative pt-6 flex flex-col justify-between">
              {/* SVG multi-curves */}
              <svg className="absolute inset-0 w-full h-full">
                {/* Grid horizontal markers */}
                <line x1="0" y1="30" x2="100%" y2="30" stroke="#1e293b" strokeDasharray="3" />
                <line x1="0" y1="80" x2="100%" y2="80" stroke="#1e293b" strokeDasharray="3" />
                <line x1="0" y1="130" x2="100%" y2="130" stroke="#1e293b" strokeDasharray="3" />

                {/* Line 1 (Violet) */}
                <path d="M 10 120 Q 80 40 180 90 T 350 30" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" />
                {/* Line 2 (Teal) */}
                <path d="M 10 90 Q 90 120 190 50 T 350 110" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" />
                {/* Line 3 (Pink) */}
                <path d="M 10 140 Q 70 80 170 120 T 350 60" fill="none" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" />
              </svg>

              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[8px] text-slate-500 font-bold uppercase select-none">
                <span>Week 1</span>
                <span>Week 2</span>
                <span>Week 3</span>
                <span>Week 4</span>
              </div>
            </div>
          )}

          <div className="flex gap-4 text-[9px] font-bold text-slate-550 select-none">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-violet-500 rounded-full"></span> Top Spent</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-teal-500 rounded-full"></span> Utilities</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-pink-500 rounded-full"></span> Entertainment</span>
          </div>
        </div>

        {/* 12. Connected Waterfall Chart */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Waterfall Cashflows</h2>

          <div className="h-40 flex justify-around items-end gap-3 pt-6 relative select-none">
            {/* Grid line helper */}
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-850/50"></div>

            {/* Income Bar */}
            <div className="flex flex-col items-center gap-2 w-12 z-10">
              <span className="text-[10px] font-bold text-emerald-400">+${totalIncome.toFixed(0)}</span>
              <div
                className="w-full bg-emerald-500/80 rounded-t-lg transition-all duration-1000 shadow-md shadow-emerald-950/20"
                style={{ height: `${incBarHeight}px`, minHeight: "15px" }}
              ></div>
              <span className="text-[9px] font-bold text-slate-500 uppercase">Inflow</span>
            </div>

            {/* Expense Bar */}
            <div className="flex flex-col items-center gap-2 w-12 z-10">
              <span className="text-[10px] font-bold text-rose-450 text-rose-455 text-rose-400">-${totalExpenses.toFixed(0)}</span>
              <div
                className="w-full bg-rose-500/80 rounded-t-lg transition-all duration-1000 shadow-md shadow-rose-955/20 shadow-rose-950/20"
                style={{ height: `${expBarHeight}px`, minHeight: "15px" }}
              ></div>
              <span className="text-[9px] font-bold text-slate-500 uppercase">Outflow</span>
            </div>

            {/* Savings Bar */}
            <div className="flex flex-col items-center gap-2 w-12 z-10">
              <span className="text-[10px] font-bold text-violet-400">${netSavings.toFixed(0)}</span>
              <div
                className={`w-full ${netSavings >= 0 ? "bg-violet-500/80" : "bg-rose-800/80"} rounded-t-lg transition-all duration-1000 shadow-md`}
                style={{ height: `${netBarHeight}px`, minHeight: "15px" }}
              ></div>
              <span className="text-[9px] font-bold text-slate-500 uppercase">Savings</span>
            </div>
          </div>
        </div>
      </div>

      {/* 13. AI Financial Insights Panel */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">AI Recommendations</h2>
        <div className="bg-slate-950/50 border border-slate-850 p-4 rounded-xl min-h-[100px] flex items-start gap-3">
          <span className="text-xl">🤖</span>
          <p className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-line">{insightText}</p>
        </div>
      </div>

      {/* 11. Sortable Category Breakdown Table */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-base font-bold text-white">Category Breakdown Ledger</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-955/30 bg-slate-950/30 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-800/80">
                <th className="p-4 cursor-pointer hover:text-white" onClick={() => toggleSort("name")}>
                  Category {sortBy === "name" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th className="p-4 text-right cursor-pointer hover:text-white" onClick={() => toggleSort("budget")}>
                  Budget Limit {sortBy === "budget" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th className="p-4 text-right cursor-pointer hover:text-white" onClick={() => toggleSort("spent")}>
                  Actual Spent {sortBy === "spent" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th className="p-4 text-right cursor-pointer hover:text-white" onClick={() => toggleSort("remaining")}>
                  Remaining {sortBy === "remaining" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th className="p-4 text-right cursor-pointer hover:text-white" onClick={() => toggleSort("pct")}>
                  % Spent {sortBy === "pct" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60">
              {sortedCategories.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-10 text-slate-500">No category parameters logged yet.</td>
                </tr>
              ) : (
                sortedCategories.map((cat, i) => {
                  const remaining = cat.budget - cat.spent;
                  const pct = cat.budget > 0 ? (cat.spent / cat.budget) * 100 : 0;
                  const isOver = cat.spent >= cat.budget;
                  const isNear = !isOver && cat.spent >= cat.budget * 0.8;

                  return (
                    <tr key={i} className="hover:bg-slate-950/10 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`}></span>
                          <span className="font-semibold text-white">{cat.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right text-slate-300">${cat.budget.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="p-4 text-right font-semibold text-slate-100">${cat.spent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className={`p-4 text-right font-bold ${remaining >= 0 ? "text-emerald-400" : "text-rose-455 text-rose-500"}`}>
                        ${remaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right text-slate-400">{pct.toFixed(0)}%</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${isOver
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/25"
                            : isNear
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                          }`}>
                          {isOver ? "Over Spent" : isNear ? "Nearing Cap" : "Healthy"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}