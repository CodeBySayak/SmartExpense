import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";

export default function Transactions() {
  const { user } = useAuth();

  // Load state from localStorage
  const [transactions, setTransactions] = useState(() => {
    if (!user?.id) return [];
    const saved = localStorage.getItem(`transactions_${user.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState(() => {
    if (!user?.id) return [];
    const saved = localStorage.getItem(`expenses_${user.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Sync to localStorage
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`transactions_${user.id}`, JSON.stringify(transactions));
    }
  }, [transactions, user?.id]);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [method, setMethod] = useState("Credit Card");
  const [notes, setNotes] = useState("");

  // Filter states
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortField, setSortField] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");



  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!description || !amount) return;

    const parsedAmount = parseFloat(amount) || 0;
    const newTx = {
      id: Date.now().toString(),
      date,
      description: description.trim(),
      amount: parsedAmount,
      type,
      category,
      method,
      notes: notes.trim()
    };

    setTransactions([newTx, ...transactions]);

    // Update categories spent in localStorage if it is an expense
    if (type === "expense" && user?.id) {
      const updatedCategories = categories.map(cat => {
        if (cat.name === category) {
          return { ...cat, spent: cat.spent + parsedAmount };
        }
        return cat;
      });
      setCategories(updatedCategories);
      localStorage.setItem(`expenses_${user.id}`, JSON.stringify(updatedCategories));
    }

    // Sync to Income page if it is income
    if (type === "income" && user?.id) {
      const savedIncome = localStorage.getItem(`income_${user.id}`);
      const incomes = savedIncome ? JSON.parse(savedIncome) : [];
      const newInc = {
        name: description.trim(),
        amount: parsedAmount,
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        isRecurring: false,
        category
      };
      localStorage.setItem(`income_${user.id}`, JSON.stringify([...incomes, newInc]));
    }

    // Reset Form
    setDescription("");
    setAmount("");
    setNotes("");
    setIsModalOpen(false);
  };

  const handleDeleteTransaction = (id) => {
    const txToDelete = transactions.find(t => t.id === id);
    if (!txToDelete) return;

    setTransactions(transactions.filter(t => t.id !== id));

    // Deduct from category spent if it was an expense
    if (txToDelete.type === "expense" && user?.id) {
      const updatedCategories = categories.map(cat => {
        if (cat.name === txToDelete.category) {
          return { ...cat, spent: Math.max(0, cat.spent - txToDelete.amount) };
        }
        return cat;
      });
      setCategories(updatedCategories);
      localStorage.setItem(`expenses_${user.id}`, JSON.stringify(updatedCategories));
    }
  };

  // Filtered & Sorted Transactions
  const filteredTransactions = transactions
    .filter(tx => {
      const matchesSearch = tx.description.toLowerCase().includes(search.toLowerCase()) || 
                            tx.notes.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === "all" || tx.type === filterType;
      const matchesCategory = filterCategory === "all" || tx.category === filterCategory;
      return matchesSearch && matchesType && matchesCategory;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === "amount") {
        valA = parseFloat(valA);
        valB = parseFloat(valB);
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Transactions</h1>
          <p className="text-slate-400 text-sm mt-1">Search, audit, and log your complete income and expense ledger.</p>
        </div>
        <button
          onClick={() => {
            setDescription("");
            setAmount("");
            setType("expense");
            setCategory(categories[0]?.name || "Groceries");
            setMethod("Credit Card");
            setNotes("");
            setIsModalOpen(true);
          }}
          className="self-start py-2.5 px-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm transition duration-200 shadow-md shadow-indigo-600/20 active:scale-[0.98]"
        >
          + Add Transaction
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Search</label>
            <input
              type="text"
              placeholder="Starbucks, salary..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/40 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-slate-950/40 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
            >
              <option value="all">All Types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-slate-950/40 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
            >
              <option value="all">All Categories</option>
              {Array.from(new Set(transactions.map(t => t.category))).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Sort</label>
            <div className="flex gap-2">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="flex-1 bg-slate-950/40 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="description">Merchant</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-3 bg-slate-950/40 border border-slate-850 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white transition text-xs"
              >
                {sortOrder === "asc" ? "▲" : "▼"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Ledger Table */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/30 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-800/80">
                <th className="p-4">Date</th>
                <th className="p-4">Merchant / Description</th>
                <th className="p-4">Category</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4">Notes</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60 text-xs">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center p-10 text-slate-500">No transactions match the selected filters.</td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-950/10 transition duration-150">
                    <td className="p-4 text-slate-400 whitespace-nowrap">{tx.date}</td>
                    <td className="p-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-6 rounded-full ${tx.type === "expense" ? "bg-rose-500" : "bg-emerald-500"}`}></span>
                        {tx.description}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded bg-slate-950/50 text-slate-300 border border-slate-850">
                        {tx.category}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">{tx.method}</td>
                    <td className="p-4 text-slate-400 truncate max-w-xs" title={tx.notes}>{tx.notes || "-"}</td>
                    <td className={`p-4 text-right font-bold text-sm ${tx.type === "expense" ? "text-rose-400" : "text-emerald-400"}`}>
                      {tx.type === "expense" ? "-" : "+"}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="text-slate-500 hover:text-red-400 p-1.5 transition"
                        title="Delete Entry"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in duration-150">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Add Transaction</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Type</label>
                  <select
                    value={type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setType(newType);
                      if (newType === "expense") {
                        setCategory(categories[0]?.name || "Groceries");
                      } else {
                        setCategory("Salary");
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Merchant / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Whole Foods"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    {type === "expense" ? (
                      categories.length > 0 ? (
                        categories.map((cat, i) => <option key={i} value={cat.name}>{cat.name}</option>)
                      ) : (
                        <>
                          <option value="Groceries">Groceries</option>
                          <option value="Organic Dining Out">Organic Dining Out</option>
                          <option value="Fast Transport & Gas">Fast Transport & Gas</option>
                        </>
                      )
                    ) : (
                      <>
                        <option value="Salary">Salary</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Investment">Investment</option>
                        <option value="Gift">Gift</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Payment Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="PayPal">PayPal</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Notes (Optional)</label>
                <textarea
                  placeholder="Additional transaction context..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="2"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition duration-150 mt-2 shadow-lg shadow-indigo-500/20"
              >
                Log Transaction
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
