import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";

export default function Bills() {
  const { user } = useAuth();

  // Load subscriptions from localStorage
  const [bills, setBills] = useState(() => {
    if (!user?.id) return [];
    const saved = localStorage.getItem(`bills_${user.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [income] = useState(() => {
    if (!user?.id) return [];
    const saved = localStorage.getItem(`income_${user.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Sync to localStorage
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`bills_${user.id}`, JSON.stringify(bills));
    }
  }, [bills, user?.id]);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState(1);
  const [category, setCategory] = useState("Entertainment");

  const totalMonthlyIncome = income.reduce((acc, inc) => acc + inc.amount, 0) || 5000;
  const totalBillsMonthly = bills.reduce((acc, b) => acc + b.amount, 0);
  const annualProjections = totalBillsMonthly * 12;
  const subscriptionRatio = (totalBillsMonthly / totalMonthlyIncome) * 100;

  const handleAddBill = (e) => {
    e.preventDefault();
    if (!name || !amount || !dueDay) return;

    const newBill = {
      id: Date.now().toString(),
      name: name.trim(),
      amount: parseFloat(amount) || 0,
      dueDay: parseInt(dueDay) || 1,
      category,
      isPaid: false
    };

    setBills([...bills, newBill]);

    // Reset Form
    setName("");
    setAmount("");
    setDueDay(1);
    setIsModalOpen(false);
  };

  const handleDeleteBill = (id) => {
    setBills(bills.filter(b => b.id !== id));
  };

  const togglePaid = (id) => {
    setBills(bills.map(b => b.id === id ? { ...b, isPaid: !b.isPaid } : b));
  };

  // Build Calendar grid
  const daysInGrid = 31;
  const calendarCells = Array.from({ length: daysInGrid }, (_, idx) => {
    const dayNum = idx + 1;
    const dayBills = bills.filter(b => b.dueDay === dayNum);
    return { dayNum, bills: dayBills };
  });

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Bills & Subs</h1>
          <p className="text-slate-400 text-sm mt-1">Manage recurring bills, monthly subscriptions, and due calendar timelines.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="self-start py-2.5 px-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm transition duration-200 shadow-md shadow-indigo-600/20 active:scale-[0.98]"
        >
          + Add Subscription
        </button>
      </div>

      {/* Subscription Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Monthly Commitments</span>
          <span className="text-3xl font-extrabold text-white my-3">${totalBillsMonthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="text-[10px] text-slate-400">Total monthly recurring cost</span>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Annualized Projection</span>
          <span className="text-3xl font-extrabold text-slate-300 my-3">${annualProjections.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="text-[10px] text-slate-400">Total yearly projection</span>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Income Allocation</span>
          <span className="text-3xl font-extrabold text-indigo-400 my-3">{subscriptionRatio.toFixed(1)}%</span>
          <span className="text-[10px] text-slate-400">Ratio of net monthly income</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bills List Table */}
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white">Active Accounts</h2>

          {bills.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">No active subscriptions registered.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800 uppercase text-[9px] font-bold tracking-wider">
                    <th className="pb-3">Subscription</th>
                    <th className="pb-3">Due Date</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60">
                  {bills.map(b => (
                    <tr key={b.id} className="hover:bg-slate-950/10">
                      <td className="py-3 font-semibold text-white">{b.name}</td>
                      <td className="py-3 text-slate-400">Day {b.dueDay} of the month</td>
                      <td className="py-3 text-slate-400">{b.category}</td>
                      <td className="py-3 font-bold text-slate-200">${b.amount.toFixed(2)}</td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => togglePaid(b.id)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold border transition ${
                            b.isPaid 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}
                        >
                          {b.isPaid ? "Paid" : "Mark Paid"}
                        </button>
                      </td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => handleDeleteBill(b.id)}
                          className="text-slate-500 hover:text-red-400 p-1 transition"
                          title="Remove subscription"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Due Calendar View Card */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white">Due Date Calendar</h2>
          
          <div className="grid grid-cols-7 gap-2">
            {/* Calendar header days */}
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-bold text-slate-600 uppercase py-1">{d}</div>
            ))}

            {calendarCells.map(cell => (
              <div
                key={cell.dayNum}
                className={`aspect-square rounded-xl border flex flex-col items-center justify-between p-1.5 transition select-none ${
                  cell.bills.length > 0 
                    ? "bg-violet-950/20 border-violet-850 hover:bg-violet-900/20" 
                    : "bg-slate-950/20 border-slate-850 hover:border-slate-800"
                }`}
                title={cell.bills.map(b => `${b.name} ($${b.amount})`).join(", ")}
              >
                <span className="text-[10px] font-bold text-slate-400">{cell.dayNum}</span>
                {cell.bills.length > 0 && (
                  <div className="flex gap-0.5">
                    {cell.bills.map(b => (
                      <span 
                        key={b.id} 
                        className={`w-1.5 h-1.5 rounded-full ${b.isPaid ? "bg-emerald-400" : "bg-rose-500"}`}
                      ></span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold border-t border-slate-800/80 pt-3">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Unpaid Bills</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-450 bg-emerald-400"></span> Settled Bills</span>
          </div>
        </div>
      </div>

      {/* Manual Entry Subscription Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-in zoom-in duration-150">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Add Subscription</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddBill} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Service / Bill Name</label>
                <input
                  type="text"
                  placeholder="e.g. Netflix, Rent, AWS"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Monthly Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 14.99"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Due Day (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="e.g. 15"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="Entertainment">Entertainment</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Housing">Housing</option>
                  <option value="Health & Fitness">Health & Fitness</option>
                  <option value="Software/SaaS">Software/SaaS</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition duration-150 mt-2 shadow-lg shadow-indigo-500/20"
              >
                Log Subscription
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
