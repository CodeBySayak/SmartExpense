import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";

export default function Budgets() {
  const { user } = useAuth();
  
  // Persisted state
  const [overallLimit, setOverallLimit] = useState(() => {
    if (!user?.id) return 2500;
    const saved = localStorage.getItem(`overall_budget_${user.id}`);
    return saved ? parseFloat(saved) : 2500;
  });

  const [rules, setRules] = useState(() => {
    if (!user?.id) return [];
    const saved = localStorage.getItem(`budget_rules_${user.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [expenses] = useState(() => {
    if (!user?.id) return [];
    const saved = localStorage.getItem(`expenses_${user.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Save changes
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`overall_budget_${user.id}`, overallLimit.toString());
    }
  }, [overallLimit, user?.id]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`budget_rules_${user.id}`, JSON.stringify(rules));
    }
  }, [rules, user?.id]);

  // Form states
  const [tempLimit, setTempLimit] = useState(overallLimit);
  const [isEditingLimit, setIsEditingLimit] = useState(false);

  // New rule state
  const [ruleType, setRuleType] = useState("alert");
  const [ruleCategory, setRuleCategory] = useState(expenses[0]?.name || "Groceries");
  const [ruleThreshold, setRuleThreshold] = useState("");
  const [ruleKeyword, setRuleKeyword] = useState("");

  const totalSpent = expenses.reduce((acc, cat) => acc + cat.spent, 0);
  const percentSpent = overallLimit > 0 ? Math.min((totalSpent / overallLimit) * 100, 100) : 0;
  const remainingBudget = overallLimit - totalSpent;

  const handleSaveLimit = () => {
    setOverallLimit(parseFloat(tempLimit) || 0);
    setIsEditingLimit(false);
  };

  const handleAddRule = (e) => {
    e.preventDefault();
    const newRule = {
      id: Date.now().toString(),
      type: ruleType,
      active: true,
      ...(ruleType === "alert" 
        ? { category: ruleCategory, threshold: parseFloat(ruleThreshold) || 0 }
        : { keyword: ruleKeyword.trim(), category: ruleCategory }
      )
    };
    setRules([...rules, newRule]);
    // Reset inputs
    setRuleThreshold("");
    setRuleKeyword("");
  };

  const toggleRule = (id) => {
    setRules(rules.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const deleteRule = (id) => {
    setRules(rules.filter(r => r.id !== id));
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Budgets</h1>
        <p className="text-slate-400 text-sm mt-1">Design your financial boundaries and automate transactions classification.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Monthly Budget Planner Card */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Monthly Planner</h2>
              {!isEditingLimit ? (
                <button 
                  onClick={() => { setTempLimit(overallLimit); setIsEditingLimit(true); }}
                  className="text-xs text-violet-400 hover:text-violet-300 font-semibold"
                >
                  Edit Cap
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleSaveLimit} className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold">Save</button>
                  <button onClick={() => setIsEditingLimit(false)} className="text-xs text-rose-400 hover:text-rose-300 font-semibold">Cancel</button>
                </div>
              )}
            </div>

            {/* Gauge Ring */}
            <div className="flex justify-center my-6 relative">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle cx="80" cy="80" r="70" className="stroke-slate-800" strokeWidth="8" fill="transparent" />
                <circle 
                  cx="80" 
                  cy="80" 
                  r="70" 
                  className="stroke-violet-600 transition-all duration-1000 ease-out" 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray="439.8"
                  strokeDashoffset={439.8 - (439.8 * percentSpent) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold text-white">{Math.round(percentSpent)}%</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Spent</span>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                <span className="text-xs text-slate-400">Total Limit</span>
                {isEditingLimit ? (
                  <input
                    type="number"
                    value={tempLimit}
                    onChange={(e) => setTempLimit(e.target.value)}
                    className="w-24 bg-slate-900 border border-slate-850 rounded px-2 py-1 text-right text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                ) : (
                  <span className="text-sm font-bold text-white">${overallLimit.toLocaleString()}</span>
                )}
              </div>

              <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                <span className="text-xs text-slate-400">Spent to Date</span>
                <span className="text-sm font-bold text-rose-400">${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                <span className="text-xs text-slate-400">Remaining</span>
                <span className={`text-sm font-bold ${remainingBudget >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                  ${remainingBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Budget vs Actual Variance Card */}
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-6">Budget vs Actual Variance</h2>
          
          {expenses.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">No categories found. Seed demo data or add categories in Expenses.</p>
          ) : (
            <div className="space-y-5">
              {expenses.map((cat, idx) => {
                const variance = cat.budget - cat.spent;
                const pct = cat.budget > 0 ? (cat.spent / cat.budget) * 100 : 0;
                
                return (
                  <div key={idx} className="bg-slate-950/20 border border-slate-850/60 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${cat.color}`}></span>
                        <span className="text-sm font-semibold text-white">{cat.name}</span>
                      </div>
                      <span className={`text-xs font-bold ${variance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {variance >= 0 ? `+ $${variance.toFixed(0)} under` : `- $${Math.abs(variance).toFixed(0)} over`}
                      </span>
                    </div>

                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? "bg-rose-500" : pct >= 80 ? "bg-amber-500" : "bg-violet-500"}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>Planned: ${cat.budget.toLocaleString()}</span>
                      <span>Spent: ${cat.spent.toLocaleString()}</span>
                      <span>{pct.toFixed(0)}% used</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Rules Engine & Auto-Categorization */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl mt-8">
        <h2 className="text-lg font-bold text-white mb-6">Automation Rules Engine</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Rule Form */}
          <form onSubmit={handleAddRule} className="space-y-4 bg-slate-950/30 p-5 rounded-xl border border-slate-850 h-fit">
            <h3 className="text-sm font-bold text-white">Create Automation Rule</h3>
            
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Rule Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRuleType("alert")}
                  className={`py-2 rounded-lg text-xs font-semibold border transition ${
                    ruleType === "alert" 
                      ? "bg-violet-600 border-violet-500 text-white" 
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  Limit Alert
                </button>
                <button
                  type="button"
                  onClick={() => setRuleType("categorize")}
                  className={`py-2 rounded-lg text-xs font-semibold border transition ${
                    ruleType === "categorize" 
                      ? "bg-violet-600 border-violet-500 text-white" 
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  Auto-Categorize
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400">Target Category</label>
              <select
                value={ruleCategory}
                onChange={(e) => setRuleCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
              >
                {expenses.length > 0 ? (
                  expenses.map((cat, i) => <option key={i} value={cat.name}>{cat.name}</option>)
                ) : (
                  <>
                    <option value="Groceries">Groceries</option>
                    <option value="Organic Dining Out">Organic Dining Out</option>
                    <option value="Fast Transport & Gas">Fast Transport & Gas</option>
                  </>
                )}
              </select>
            </div>

            {ruleType === "alert" ? (
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Alert Threshold ($)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={ruleThreshold}
                  onChange={(e) => setRuleThreshold(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  required
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Merchant Contains Keyword</label>
                <input
                  type="text"
                  placeholder="e.g. Uber, Netflix, Starbucks"
                  value={ruleKeyword}
                  onChange={(e) => setRuleKeyword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs transition duration-150"
            >
              Add Rule
            </button>
          </form>

          {/* Rules List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-white">Active Automation Filters</h3>
            
            {rules.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-10">No active rules defined.</p>
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div key={rule.id} className="flex justify-between items-center bg-slate-950/20 border border-slate-850/60 p-4 rounded-xl">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          rule.type === "alert" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                        }`}>
                          {rule.type === "alert" ? "Limit Warning" : "Categorize"}
                        </span>
                        <span className="text-xs font-semibold text-slate-300">
                          {rule.type === "alert" 
                            ? `Alert when ${rule.category} exceeds $${rule.threshold}`
                            : `Map transactions with keyword "${rule.keyword}" to ${rule.category}`
                          }
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={`w-9 h-5 rounded-full p-0.5 transition duration-200 focus:outline-none ${
                          rule.active ? "bg-violet-600 flex justify-end" : "bg-slate-800 flex justify-start"
                        }`}
                      >
                        <span className="w-4 h-4 bg-white rounded-full shadow-md"></span>
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="text-slate-500 hover:text-red-400 transition"
                      >
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
