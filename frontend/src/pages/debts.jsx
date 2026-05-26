import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";

export default function Debts() {
  const { user } = useAuth();

  // Load debts state
  const [debts, setDebts] = useState(() => {
    if (!user?.id) return [];
    const saved = localStorage.getItem(`debts_${user.id}`);
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
      localStorage.setItem(`debts_${user.id}`, JSON.stringify(debts));
    }
  }, [debts, user?.id]);

  // Form & Simulator states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [apr, setApr] = useState("");
  const [minPayment, setMinPayment] = useState("");
  const [category, setCategory] = useState("Credit Card");

  const [extraPayment, setExtraPayment] = useState(250);

  const totalMonthlyIncome = income.reduce((acc, inc) => acc + inc.amount, 0) || 5000; // default to 5000 if none
  const totalDebtBalance = debts.reduce((acc, d) => acc + d.balance, 0);
  const totalMinPayment = debts.reduce((acc, d) => acc + d.minPayment, 0);

  // DTI calculation
  const dti = totalMonthlyIncome > 0 ? (totalMinPayment / totalMonthlyIncome) * 100 : 0;
  let dtiHealth = "Healthy";
  let dtiColor = "text-emerald-400";
  let dtiBg = "stroke-emerald-500";
  if (dti >= 50) {
    dtiHealth = "Critical";
    dtiColor = "text-rose-500";
    dtiBg = "stroke-rose-600";
  } else if (dti >= 36) {
    dtiHealth = "High";
    dtiColor = "text-orange-400";
    dtiBg = "stroke-orange-500";
  } else if (dti >= 20) {
    dtiHealth = "Moderate";
    dtiColor = "text-amber-400";
    dtiBg = "stroke-amber-500";
  }

  const handleAddDebt = (e) => {
    e.preventDefault();
    if (!name || !balance || !apr || !minPayment) return;

    const newDebt = {
      id: Date.now().toString(),
      name: name.trim(),
      balance: parseFloat(balance) || 0,
      apr: parseFloat(apr) || 0,
      minPayment: parseFloat(minPayment) || 0,
      category
    };

    setDebts([...debts, newDebt]);

    // Reset Form
    setName("");
    setBalance("");
    setApr("");
    setMinPayment("");
    setIsModalOpen(false);
  };

  const handleDeleteDebt = (id) => {
    setDebts(debts.filter(d => d.id !== id));
  };

  // Payoff calculations (Avalanche vs Snowball simulation)
  // Simple simulation representing months to pay off with the total budget (totalMinPayment + extraPayment)
  const simulatePayoff = (strategy) => {
    if (debts.length === 0) return { months: 0, interest: 0 };

    let sorted = [...debts];
    if (strategy === "avalanche") {
      // High APR first
      sorted.sort((a, b) => b.apr - a.apr);
    } else {
      // Smallest balance first
      sorted.sort((a, b) => a.balance - b.balance);
    }

    let balances = sorted.map(d => d.balance);
    let aprs = sorted.map(d => d.apr / 12 / 100); // monthly apr
    let mins = sorted.map(d => d.minPayment);

    let months = 0;
    let totalInterest = 0;
    let totalAvailFunds = totalMinPayment + parseFloat(extraPayment || 0);

    while (balances.some(b => b > 0) && months < 360) { // cap at 30 years
      months++;
      let extraCash = totalAvailFunds;

      // Apply minimums first and accumulate interest
      for (let i = 0; i < balances.length; i++) {
        if (balances[i] <= 0) continue;
        const interest = balances[i] * aprs[i];
        totalInterest += interest;
        balances[i] += interest;

        const pay = Math.min(balances[i], mins[i]);
        balances[i] -= pay;
        extraCash -= pay;
      }

      // Apply remaining extraCash to the target debt in the sorted order
      for (let i = 0; i < balances.length; i++) {
        if (balances[i] <= 0) continue;
        const pay = Math.min(balances[i], extraCash);
        balances[i] -= pay;
        extraCash -= pay;
        if (extraCash <= 0) break;
      }
    }

    return { months, interest: Math.round(totalInterest) };
  };

  const avalancheSim = simulatePayoff("avalanche");
  const snowballSim = simulatePayoff("snowball");

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Debt Tracker</h1>
          <p className="text-slate-400 text-sm mt-1">Simulate strategies to eliminate your outstanding liabilities faster.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="self-start py-2.5 px-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm transition duration-200 shadow-md shadow-indigo-600/20 active:scale-[0.98]"
        >
          + Add Debt
        </button>
      </div>

      {/* Debt Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Outstanding Debt</span>
          <span className="text-3xl font-extrabold text-white my-3">${totalDebtBalance.toLocaleString()}</span>
          <span className="text-[10px] text-slate-400">Sum of all liabilities</span>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Combined Monthly Minimum</span>
          <span className="text-3xl font-extrabold text-slate-300 my-3">${totalMinPayment.toLocaleString()}</span>
          <span className="text-[10px] text-slate-400">Total required monthly payouts</span>
        </div>

        {/* DTI Gauge Card */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
          <div className="flex flex-col justify-between h-full">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Debt-To-Income (DTI)</span>
            <span className={`text-2xl font-extrabold my-2 ${dtiColor}`}>{dti.toFixed(1)}%</span>
            <span className="text-[10px] text-slate-400">Status: <strong className={dtiColor}>{dtiHealth}</strong></span>
          </div>

          <div className="relative w-20 h-20">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="stroke-slate-800" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className={`${dtiBg} transition-all duration-1000`} strokeDasharray={`${dti}, 100`} strokeWidth="3" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Debt List */}
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white">Liabilities & Accounts</h2>
          
          {debts.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">No debts logged. You are debt free!</p>
          ) : (
            <div className="space-y-4">
              {debts.map(d => (
                <div key={d.id} className="bg-slate-950/20 border border-slate-850/60 p-4 rounded-xl flex justify-between items-center hover:border-slate-800 transition">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-white">{d.name}</span>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 text-[9px] font-bold">{d.category}</span>
                      <span className="text-[10px] text-slate-500">{d.apr}% APR</span>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-6">
                    <div>
                      <span className="block text-sm font-extrabold text-white">${d.balance.toLocaleString()}</span>
                      <span className="block text-[9px] text-slate-500">Min: ${d.minPayment}/mo</span>
                    </div>
                    <button
                      onClick={() => handleDeleteDebt(d.id)}
                      className="text-slate-600 hover:text-red-400 transition"
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

        {/* Debt Calculator Simulator Card */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white">Strategy Simulator</h2>
          
          <div className="space-y-2">
            <label className="text-xs text-slate-400">Extra Monthly Allocation ($)</label>
            <input
              type="number"
              value={extraPayment}
              onChange={(e) => setExtraPayment(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-bold"
            />
            <span className="text-[10px] text-slate-500 block">Total monthly budget: ${(totalMinPayment + (parseFloat(extraPayment) || 0)).toLocaleString()}</span>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-800/80">
            {/* Avalanche results */}
            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-violet-400">❄️ Avalanche Method</span>
                <span className="block text-[9px] text-slate-500 mt-1">High Interest First</span>
              </div>
              <div className="text-right">
                <span className="block text-sm font-extrabold text-white">{avalancheSim.months} months</span>
                <span className="block text-[10px] text-emerald-400">${avalancheSim.interest.toLocaleString()} interest</span>
              </div>
            </div>

            {/* Snowball results */}
            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-indigo-400">⚡ Snowball Method</span>
                <span className="block text-[9px] text-slate-500 mt-1">Small Balance First</span>
              </div>
              <div className="text-right">
                <span className="block text-sm font-extrabold text-white">{snowballSim.months} months</span>
                <span className="block text-[10px] text-emerald-400">${snowballSim.interest.toLocaleString()} interest</span>
              </div>
            </div>

            <div className="bg-violet-950/10 border border-dashed border-violet-850 p-3.5 rounded-xl text-[10px] text-slate-400 leading-normal">
              💡 <strong>Avalanche</strong> minimizes interest payments, whereas <strong>Snowball</strong> builds psychological momentum by paying off small accounts quickly.
            </div>
          </div>
        </div>
      </div>

      {/* Manual Entry Debt Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-in zoom-in duration-150">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Add Account</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddDebt} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Account Name</label>
                <input
                  type="text"
                  placeholder="e.g. Chase Freedom Card"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Classification</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="Credit Card">Credit Card</option>
                    <option value="Student Loan">Student Loan</option>
                    <option value="Car Loan">Car Loan</option>
                    <option value="Mortgage">Mortgage</option>
                    <option value="Personal Loan">Personal Loan</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">APR Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 18.9"
                    value={apr}
                    onChange={(e) => setApr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Current Balance ($)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1500"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Minimum Payment ($)</label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    value={minPayment}
                    onChange={(e) => setMinPayment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition duration-150 mt-2 shadow-lg shadow-indigo-500/20"
              >
                Save Liability
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
