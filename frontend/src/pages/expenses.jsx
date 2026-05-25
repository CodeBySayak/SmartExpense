import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";

const RATES = {
  USD: { symbol: "$", rate: 1.0 },
  EUR: { symbol: "€", rate: 0.92 },
  INR: { symbol: "₹", rate: 83.2 },
  GBP: { symbol: "£", rate: 0.79 }
};

export default function Expenses() {
  const { user } = useAuth();

  // Load category budgets
  const [expenseCategories, setExpenseCategories] = useState(() => {
    if (!user?.id) return [];
    const saved = localStorage.getItem(`expenses_${user.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Load all transactions to extract matching entries per category
  const [transactions] = useState(() => {
    if (!user?.id) return [];
    const saved = localStorage.getItem(`transactions_${user.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Sync back to localStorage
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`expenses_${user.id}`, JSON.stringify(expenseCategories));
    }
  }, [expenseCategories, user?.id]);

  // Form & Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  // Forms
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [spent, setSpent] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [catColor, setCatColor] = useState("bg-violet-600");

  // Filters & Search states
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, over, nearing, under
  const [expandedCategory, setExpandedCategory] = useState(null);

  const colorOptions = [
    "bg-violet-600",
    "bg-indigo-600",
    "bg-blue-600",
    "bg-pink-600",
    "bg-teal-600",
    "bg-emerald-600",
    "bg-orange-600",
    "bg-red-600",
    "bg-fuchsia-600"
  ];

  // Derive category spent details from actual logged transactions on-the-fly
  const derivedCategories = expenseCategories.map(cat => {
    const catSpent = transactions
      .filter(t => t.type === "expense" && t.category === cat.name)
      .reduce((sum, t) => sum + t.amount, 0);
    return { ...cat, spent: catSpent };
  });

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!name || !budget) return;

    const rate = RATES[currency].rate;
    const parsedBudget = (parseFloat(budget) || 0) / rate;
    const parsedSpent = (parseFloat(spent) || 0) / rate;

    const newCategory = {
      name: name.trim(),
      budget: parsedBudget,
      spent: parsedSpent,
      color: catColor
    };

    setExpenseCategories([...expenseCategories, newCategory]);

    // Reset Form
    setName("");
    setBudget("");
    setSpent("");
    setCurrency("USD");
    setCatColor("bg-violet-600");
    setIsAddModalOpen(false);
  };

  const handleEditExpense = (e) => {
    e.preventDefault();
    if (editingIndex === null) return;

    const rate = RATES[currency].rate;
    const parsedBudget = (parseFloat(budget) || 0) / rate;
    const parsedSpent = (parseFloat(spent) || 0) / rate;

    const updated = expenseCategories.map((cat, idx) => {
      if (idx === editingIndex) {
        return {
          ...cat,
          name: name.trim(),
          budget: parsedBudget,
          spent: parsedSpent,
          color: catColor
        };
      }
      return cat;
    });

    setExpenseCategories(updated);
    setIsEditModalOpen(false);
    setEditingIndex(null);
  };

  const handleOpenEditModal = (index) => {
    const cat = expenseCategories[index];
    setEditingIndex(index);
    setName(cat.name);
    setBudget(cat.budget.toString());
    setSpent(cat.spent.toString());
    setCatColor(cat.color);
    setIsEditModalOpen(true);
  };

  const handleDeleteCategory = (indexToDelete) => {
    setExpenseCategories(expenseCategories.filter((_, idx) => idx !== indexToDelete));
  };

  // Calculations
  const totalBudget = derivedCategories.reduce((acc, cat) => acc + cat.budget, 0);
  const totalSpent = derivedCategories.reduce((acc, cat) => acc + cat.spent, 0);
  const totalSpentPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Search and filter logic
  const filteredCategories = derivedCategories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(search.toLowerCase());
    const isOver = cat.spent >= cat.budget;
    const isNearing = !isOver && cat.spent >= cat.budget * 0.8;
    const isUnder = cat.spent < cat.budget * 0.8;

    if (filterStatus === "over") return matchesSearch && isOver;
    if (filterStatus === "nearing") return matchesSearch && isNearing;
    if (filterStatus === "under") return matchesSearch && isUnder;
    return matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Expenses</h1>
          <p className="text-slate-400 text-sm mt-1">Audit categories, view donut allocations, and review transaction ledgers.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="self-start py-2.5 px-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm transition duration-200 shadow-md shadow-indigo-650/20 active:scale-[0.98]"
        >
          + Add Expense Category
        </button>
      </div>

      {/* Interactive Charts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Donut Allocation */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Allocation Share</h2>

          {derivedCategories.length === 0 ? (
            <p className="text-slate-500 text-xs text-center py-10">No allocation data to display.</p>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-around gap-6">
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* SVG Donut */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="72" cy="72" r="55" className="stroke-slate-950" strokeWidth="12" fill="none" />
                  {/* Simplistic visual rings representation overlay */}
                  <circle
                    cx="72"
                    cy="72"
                    r="55"
                    className="stroke-violet-600 transition-all duration-1000"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray="345.5"
                    strokeDashoffset={345.5 - (345.5 * totalSpentPercentage) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-extrabold text-white">{totalSpentPercentage}%</span>
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest">Spent</span>
                </div>
              </div>

              <div className="space-y-2 flex-1 max-w-[200px]">
                {derivedCategories.slice(0, 4).map((cat, i) => {
                  const pct = totalSpent > 0 ? (cat.spent / totalSpent) * 100 : 0;
                  return (
                    <div key={i} className="flex justify-between items-center text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${cat.color}`}></span>
                        <span className="text-slate-400 font-semibold truncate max-w-[90px]">{cat.name}</span>
                      </div>
                      <span className="font-bold text-white">{pct.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Budget vs Spent Bars */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Planned vs Actual</h2>

          {derivedCategories.length === 0 ? (
            <p className="text-slate-500 text-xs text-center py-10">No spending data.</p>
          ) : (
            <div className="space-y-3">
              {derivedCategories.slice(0, 3).map((cat, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span className="font-semibold">{cat.name}</span>
                    <span>${cat.spent.toFixed(0)} / ${cat.budget.toFixed(0)}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-slate-850">
                    <div className={`h-full rounded-full ${cat.color}`} style={{ width: `${Math.min((cat.spent / cat.budget) * 100, 100)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Categories */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Search Category</label>
            <input
              type="text"
              placeholder="Groceries, Dining..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/40 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="w-full md:w-48 space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Status Condition</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-950/40 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
            >
              <option value="all">All Budgets</option>
              <option value="over">Over Budget</option>
              <option value="nearing">Nearing Cap (80%+)</option>
              <option value="under">Safe Zone (&lt;80%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Categories Ledger List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white">Budgets Log</h2>

          {filteredCategories.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">No categories found matching criteria.</p>
          ) : (
            <div className="space-y-6">
              {filteredCategories.map((cat, idx) => {
                const percentage = cat.budget > 0 ? Math.min((cat.spent / cat.budget) * 100, 100) : 0;
                const isOverBudget = cat.spent >= cat.budget;
                const isNearingCap = !isOverBudget && cat.spent >= cat.budget * 0.8;

                // Extract transactions for this category
                const catTxs = transactions.filter(t => t.type === "expense" && t.category === cat.name);
                const isExpanded = expandedCategory === cat.name;

                return (
                  <div key={idx} className="bg-slate-950/20 border border-slate-850/60 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <div
                        className="flex items-center gap-2 cursor-pointer select-none"
                        onClick={() => setExpandedCategory(isExpanded ? null : cat.name)}
                      >
                        <span className={`w-3 h-3 rounded-full ${cat.color}`}></span>
                        <span className="text-sm font-semibold text-white hover:underline">{cat.name}</span>
                        {isOverBudget && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-bold uppercase animate-pulse">Over</span>
                        )}
                        {isNearingCap && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold uppercase animate-pulse">Near Cap</span>
                        )}
                        <span className="text-[10px] text-slate-500">({catTxs.length} txs)</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">
                          <strong>${cat.spent.toLocaleString()}</strong> of ${cat.budget.toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleOpenEditModal(idx)}
                          className="text-slate-500 hover:text-white transition"
                          title="Edit budget"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(idx)}
                          className="text-slate-550 hover:text-red-400 transition"
                          title="Delete category"
                        >
                          ❌
                        </button>
                      </div>
                    </div>

                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isOverBudget ? "bg-rose-500" : isNearingCap ? "bg-amber-550" : cat.color}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>

                    {/* Expandable Transaction details */}
                    {isExpanded && (
                      <div className="mt-4 pt-3 border-t border-slate-900 space-y-2 bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                        <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Category Ledger</h4>
                        {catTxs.length === 0 ? (
                          <p className="text-slate-600 text-[10px] italic">No transaction records logged. Head to transactions tab to log entries.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {catTxs.map(tx => (
                              <div key={tx.id} className="flex justify-between items-center text-[11px] text-slate-350">
                                <span>{tx.date} — {tx.description}</span>
                                <strong className="text-white">${tx.amount.toFixed(2)}</strong>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dynamic insights side panel */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Budget Insights</h2>
            <div className="p-4 rounded-xl bg-violet-650 bg-violet-600/10 border border-violet-500/20 text-slate-300 text-xs leading-relaxed space-y-3">
              <p className="font-semibold text-white">💡 Pro Tip:</p>
              <p>
                You have spent <strong className="text-white">{totalSpentPercentage}%</strong> of your total budget this month.
                {totalSpentPercentage > 85 ? (
                  <span className="text-rose-400"> Alert: You have exceeded or are close to exceeding your budget! Consider scaling back non-essential expenditures immediately.</span>
                ) : (
                  <span> You are currently in a healthy spending range. Keep monitoring to stay on track with your saving goals.</span>
                )}
              </p>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-slate-800/60">
            <div className="flex justify-between items-center text-sm font-semibold mb-2">
              <span className="text-slate-400">Total Budget:</span>
              <span className="text-white text-md font-bold">${totalBudget.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-slate-400">Total Spent:</span>
              <span className="text-white text-lg font-bold">${totalSpent.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in duration-155">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Add Category</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white transition">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Shopping, Rent"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Budget Limit ($)</label>
                  <input
                    type="number"
                    placeholder="500"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Theme Color</label>
                  <select
                    value={catColor}
                    onChange={(e) => setCatColor(e.target.value)}
                    className="w-full bg-slate-955 bg-slate-950 border border-slate-855 border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    {colorOptions.map((c, i) => (
                      <option key={i} value={c} className="bg-slate-900">{c.replace("bg-", "").replace("-600", "")}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition duration-150 mt-2 shadow-lg shadow-indigo-500/20"
              >
                Create Category
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in duration-155">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Edit Category</h2>
              <button onClick={() => { setIsEditModalOpen(false); setEditingIndex(null); }} className="text-slate-400 hover:text-white transition">
                ✕
              </button>
            </div>

            <form onSubmit={handleEditExpense} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Category Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-955 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Budget Limit ($)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Theme Color</label>
                  <select
                    value={catColor}
                    onChange={(e) => setCatColor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    {colorOptions.map((c, i) => (
                      <option key={i} value={c} className="bg-slate-900">{c.replace("bg-", "").replace("-600", "")}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-violet-650 from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition duration-150 mt-2 shadow-lg"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}