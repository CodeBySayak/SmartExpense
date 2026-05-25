import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";

export default function Income() {
  const { user } = useAuth();

  // Load user income sources
  const [incomeSources, setIncomeSources] = useState(() => {
    if (!user?.id) return [];
    const saved = localStorage.getItem(`income_${user.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Load expenses to calculate Income vs Expenses metrics
  const [expenses] = useState(() => {
    if (!user?.id) return [];
    const saved = localStorage.getItem(`expenses_${user.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`income_${user.id}`, JSON.stringify(incomeSources));
    }
  }, [incomeSources, user?.id]);

  // Form & Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  // Forms states
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [category, setCategory] = useState("Salary");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Filters
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const categoryTags = ["Salary", "Freelance", "Investment", "Gift", "Rental", "Other"];

  const handleAddIncome = (e) => {
    e.preventDefault();
    if (!name || !amount) return;

    const parsedAmount = parseFloat(amount) || 0;
    const newInc = {
      id: Date.now().toString(),
      name: name.trim(),
      amount: parsedAmount,
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      isRecurring,
      category,
      rawDate: date
    };

    setIncomeSources([newInc, ...incomeSources]);

    // Also sync to global transaction ledger if exists
    if (user?.id) {
      const savedTx = localStorage.getItem(`transactions_${user.id}`);
      const txs = savedTx ? JSON.parse(savedTx) : [];
      const newTx = {
        id: `tx-inc-${Date.now()}`,
        date,
        description: name.trim(),
        amount: parsedAmount,
        type: "income",
        category,
        method: "Bank Transfer",
        notes: isRecurring ? "Recurring income source" : ""
      };
      localStorage.setItem(`transactions_${user.id}`, JSON.stringify([newTx, ...txs]));
    }

    // Reset Form
    setName("");
    setAmount("");
    setIsRecurring(false);
    setCategory("Salary");
    setIsAddModalOpen(false);
  };

  const handleEditIncome = (e) => {
    e.preventDefault();
    if (editingIndex === null) return;

    const parsedAmount = parseFloat(amount) || 0;
    const updated = incomeSources.map((item, idx) => {
      if (idx === editingIndex) {
        return {
          ...item,
          name: name.trim(),
          amount: parsedAmount,
          date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          isRecurring,
          category,
          rawDate: date
        };
      }
      return item;
    });

    setIncomeSources(updated);
    setIsEditModalOpen(false);
    setEditingIndex(null);
  };

  const handleOpenEditModal = (idx) => {
    const inc = incomeSources[idx];
    setEditingIndex(idx);
    setName(inc.name);
    setAmount(inc.amount.toString());
    setIsRecurring(inc.isRecurring);
    setCategory(inc.category || "Salary");
    setDate(inc.rawDate || new Date().toISOString().split("T")[0]);
    setIsEditModalOpen(true);
  };

  const handleDeleteIncome = (idx) => {
    setIncomeSources(incomeSources.filter((_, i) => i !== idx));
  };

  // Calculations
  const totalIncome = incomeSources.reduce((sum, item) => sum + item.amount, 0);
  const totalSpent = expenses.reduce((sum, item) => sum + item.spent, 0);
  const netCashFlow = totalIncome - totalSpent;
  const savingsRate = totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : 0;

  // Filter incomes
  const filteredIncomes = incomeSources.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Income</h1>
          <p className="text-slate-400 text-sm mt-1">Audit cash inflows, analyze growth curves, and check savings ratios.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="self-start py-2.5 px-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm transition duration-200 shadow-md shadow-indigo-650/20 active:scale-[0.98]"
        >
          + Add Income
        </button>
      </div>

      {/* Overview Cards & Comparison Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

        {/* Income vs Expenses Card */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Cash Flow Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-950/20 p-3 rounded-xl border border-slate-850">
              <span className="text-xs text-slate-450 text-slate-400">Total Inflow</span>
              <span className="text-sm font-bold text-emerald-400">${totalIncome.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center bg-slate-950/20 p-3 rounded-xl border border-slate-850">
              <span className="text-xs text-slate-400">Total Outflow</span>
              <span className="text-sm font-bold text-rose-450 text-rose-400">${totalSpent.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center bg-slate-950/20 p-3 rounded-xl border border-slate-850">
              <span className="text-xs text-slate-400">Net Flow</span>
              <span className={`text-sm font-bold ${netCashFlow >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                ${netCashFlow.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center bg-slate-950/20 p-3 rounded-xl border border-slate-850">
              <span className="text-xs text-slate-400">Savings Rate</span>
              <span className="text-sm font-bold text-indigo-400">{savingsRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Growth Trend Chart (SVG) */}
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Income Growth Curve</h2>

            {incomeSources.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-10">No income data to map.</p>
            ) : (
              <div className="h-32 w-full flex items-end relative pt-4">
                {/* SVG Curve Line */}
                <svg className="absolute inset-0 w-full h-full">
                  <path
                    d="M 10 90 Q 80 30 180 70 T 320 20"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 10 90 Q 80 30 180 70 T 320 20 L 320 110 L 10 110 Z"
                    fill="url(#grad)"
                    className="opacity-20"
                  />
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Growth Labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[9px] text-slate-500 font-bold uppercase select-none">
                  <span>Q1</span>
                  <span>Q2</span>
                  <span>Q3</span>
                  <span>Q4</span>
                </div>
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-400 italic pt-3 border-t border-slate-800/80">
            📊 Interactive lines representing combined recurring and one-off salary streams.
          </div>
        </div>
      </div>

      {/* Filters and Search Panel */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Search Stream</label>
            <input
              type="text"
              placeholder="e.g. Gig, Salary..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/40 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="w-full md:w-48 space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Category Tag</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-slate-950/40 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
            >
              <option value="all">All Channels</option>
              {categoryTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Income Records List */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/30 text-slate-550 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-800/80">
                <th className="p-4">Date</th>
                <th className="p-4">Source / Description</th>
                <th className="p-4">Category</th>
                <th className="p-4">Type</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60">
              {filteredIncomes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-10 text-slate-500">No income records mapped.</td>
                </tr>
              ) : (
                filteredIncomes.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-955/10 hover:bg-slate-950/10 transition">
                    <td className="p-4 text-slate-450 text-slate-400 whitespace-nowrap">{item.date}</td>
                    <td className="p-4 font-bold text-white">{item.name}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 text-[10px] font-bold">
                        {item.category || "Salary"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-semibold ${item.isRecurring ? "text-violet-400" : "text-slate-400"}`}>
                        {item.isRecurring ? "🔄 Recurring" : "⚡ One-off"}
                      </span>
                    </td>
                    <td className="p-4 text-right font-extrabold text-sm text-emerald-400">
                      +${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-center flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleOpenEditModal(idx)}
                        className="text-slate-500 hover:text-white transition"
                        title="Edit Entry"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteIncome(idx)}
                        className="text-slate-500 hover:text-red-400 transition"
                        title="Remove Entry"
                      >
                        ❌
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-955/80 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-in zoom-in duration-155">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Add Income Stream</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white transition">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddIncome} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Gig consultation payment"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-955 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Category Tag</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-955 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    {categoryTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Date Received</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-955 bg-slate-950 border border-slate-855 border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="flex items-center gap-2 mt-4 select-none">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-850 text-violet-600 focus:ring-violet-500"
                  />
                  <label htmlFor="isRecurring" className="text-xs text-slate-350 cursor-pointer">Recurring Stream</label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition duration-150 mt-2 shadow-lg shadow-indigo-500/20"
              >
                Log Inflow
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-in zoom-in duration-155">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Edit Income</h2>
              <button onClick={() => { setIsEditModalOpen(false); setEditingIndex(null); }} className="text-slate-400 hover:text-white transition">
                ✕
              </button>
            </div>

            <form onSubmit={handleEditIncome} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Description</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Category Tag</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    {categoryTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Date Received</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="flex items-center gap-2 mt-4 select-none">
                  <input
                    type="checkbox"
                    id="isRecurringEdit"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-850 text-violet-600 focus:ring-violet-500"
                  />
                  <label htmlFor="isRecurringEdit" className="text-xs text-slate-350 cursor-pointer">Recurring Stream</label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition duration-150 mt-2 shadow-lg"
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