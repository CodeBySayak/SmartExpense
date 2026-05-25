import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { fireConfetti } from "../utils/confetti";

export default function Goals() {
  const { user } = useAuth();

  // Load goals from localStorage
  const [goals, setGoals] = useState(() => {
    if (!user?.id) return [];
    const saved = localStorage.getItem(`goals_${user.id}`);
    if (saved) return JSON.parse(saved);
    return [];
  });

  // Persist goals
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`goals_${user.id}`, JSON.stringify(goals));
    }
  }, [goals, user?.id]);

  // Form states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [savedAmount, setSavedAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("Medium"); // High, Medium, Low

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedGoalIdx, setSelectedGoalIdx] = useState(null);
  const [depositAmount, setDepositAmount] = useState("");

  const [filterPriority, setFilterPriority] = useState("all");
  const [expandedGoal, setExpandedGoal] = useState(null);

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!name || !target) return;

    const parsedTarget = parseFloat(target) || 0;
    const parsedSaved = parseFloat(savedAmount) || 0;

    const newGoal = {
      id: Date.now().toString(),
      name: name.trim(),
      target: parsedTarget,
      saved: parsedSaved,
      deadline: deadline || "No Deadline",
      priority,
      createdAt: new Date().toISOString(),
      contributions: parsedSaved > 0 ? [{ id: Date.now().toString(), date: new Date().toISOString().split("T")[0], amount: parsedSaved }] : []
    };

    setGoals([...goals, newGoal]);

    if (parsedSaved >= parsedTarget && parsedTarget > 0) {
      fireConfetti();
    }

    // Reset Form
    setName("");
    setTarget("");
    setSavedAmount("");
    setDeadline("");
    setPriority("Medium");
    setIsAddModalOpen(false);
  };

  const handleOpenDepositModal = (idx) => {
    setSelectedGoalIdx(idx);
    setDepositAmount("");
    setIsDepositModalOpen(true);
  };

  const handleLogDeposit = (e) => {
    e.preventDefault();
    if (selectedGoalIdx === null || !depositAmount) return;

    const deposit = parseFloat(depositAmount) || 0;
    const updated = goals.map((goal, idx) => {
      if (idx === selectedGoalIdx) {
        const nextSaved = goal.saved + deposit;
        const newContribution = {
          id: Date.now().toString(),
          date: new Date().toISOString().split("T")[0],
          amount: deposit
        };
        const prevMilestones = {
          q1: goal.saved >= goal.target * 0.25,
          q2: goal.saved >= goal.target * 0.5,
          q3: goal.saved >= goal.target * 0.75,
          q4: goal.saved >= goal.target
        };
        const nextMilestones = {
          q1: nextSaved >= goal.target * 0.25,
          q2: nextSaved >= goal.target * 0.5,
          q3: nextSaved >= goal.target * 0.75,
          q4: nextSaved >= goal.target
        };

        // Fire confetti on milestone breakthroughs
        if (
          (!prevMilestones.q1 && nextMilestones.q1) ||
          (!prevMilestones.q2 && nextMilestones.q2) ||
          (!prevMilestones.q3 && nextMilestones.q3) ||
          (!prevMilestones.q4 && nextMilestones.q4)
        ) {
          fireConfetti();
        }

        return {
          ...goal,
          saved: nextSaved,
          contributions: [...(goal.contributions || []), newContribution]
        };
      }
      return goal;
    });

    setGoals(updated);
    setIsDepositModalOpen(false);
    setSelectedGoalIdx(null);
  };

  const handleDeleteGoal = (idx) => {
    setGoals(goals.filter((_, i) => i !== idx));
  };

  // Calculations
  const getCalculations = (goal) => {
    const now = new Date();
    const end = new Date(goal.deadline);
    if (isNaN(end.getTime())) return { daysLeft: null, monthlyNeeded: null };
    
    const diffTime = end - now;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Compute months remaining
    const monthsLeft = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
    const needed = goal.target - goal.saved;
    
    let monthlyNeeded = 0;
    if (needed > 0) {
      monthlyNeeded = monthsLeft > 0 ? needed / monthsLeft : needed;
    }
    
    return { 
      daysLeft: daysLeft > 0 ? daysLeft : 0, 
      monthlyNeeded: monthlyNeeded > 0 ? monthlyNeeded : 0 
    };
  };

  const filteredGoals = goals.filter(g => {
    if (filterPriority === "all") return true;
    return g.priority === filterPriority;
  });

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Goals</h1>
          <p className="text-slate-400 text-sm mt-1">Design long-term targets, track deposit records, and celebrate milestones.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="self-start py-2.5 px-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm transition duration-200 shadow-md shadow-indigo-650/20 active:scale-[0.98]"
        >
          + Create Savings Goal
        </button>
      </div>

      {/* Priority Filter */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Priority Filter</label>
          <div className="flex bg-slate-950/40 border border-slate-850 p-1 rounded-xl">
            {["all", "High", "Medium", "Low"].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition capitalize ${
                  filterPriority === p 
                    ? "bg-violet-600 text-white shadow" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {p === "all" ? "All Priorities" : p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Goals List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredGoals.length === 0 ? (
          <p className="col-span-2 text-slate-500 text-sm text-center py-12">No active savings targets defined.</p>
        ) : (
          filteredGoals.map((goal, idx) => {
            const pct = goal.target > 0 ? Math.min((goal.saved / goal.target) * 100, 100) : 0;
            const { daysLeft, monthlyNeeded } = getCalculations(goal);
            const isExpanded = expandedGoal === goal.id;

            return (
              <div key={goal.id} className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 flex flex-col justify-between hover:border-slate-700 transition duration-300">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-bold text-white">{goal.name}</h2>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase mt-1.5 border ${
                        goal.priority === "High" 
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                          : goal.priority === "Medium"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}>
                        {goal.priority} Priority
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenDepositModal(idx)}
                        className="p-2 bg-slate-950/60 border border-slate-850 hover:border-slate-800 text-xs font-bold text-emerald-400 rounded-xl transition"
                        title="Add Contribution"
                      >
                        💵 Deposit
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(idx)}
                        className="text-slate-600 hover:text-red-400 transition p-2"
                        title="Remove goal"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Calculations */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-950/20 p-3 rounded-xl border border-slate-850 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Days Countdown</span>
                      <strong className="text-white text-sm">{daysLeft !== null ? `${daysLeft} days` : "Indefinite"}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Needed Monthly</span>
                      <strong className="text-white text-sm">{monthlyNeeded !== null ? `$${monthlyNeeded.toFixed(0)}/mo` : "-"}</strong>
                    </div>
                  </div>

                  {/* Milestones checklist indicator */}
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-bold text-slate-550 block">Goal Milestones reached</span>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[25, 50, 75, 100].map(m => (
                        <div 
                          key={m} 
                          className={`py-1 rounded border text-[9px] font-bold ${
                            pct >= m 
                              ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/40" 
                              : "bg-slate-950/30 text-slate-550 border-slate-850"
                          }`}
                        >
                          {m}%
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Progress bars */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Progress</span>
                      <span>{pct.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-850">
                      <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Saved: ${goal.saved.toLocaleString()}</span>
                      <span>Target: ${goal.target.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Contribution History Log */}
                <div className="border-t border-slate-850 pt-4">
                  <button
                    onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                    className="text-[10px] uppercase font-bold text-slate-500 hover:text-white transition focus:outline-none"
                  >
                    {isExpanded ? "▼ Hide Contribution Log" : "▶ View Contribution Log"}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 bg-slate-950/30 border border-slate-850 rounded-xl p-3 max-h-[120px] overflow-y-auto space-y-1.5 text-[10px]">
                      {(!goal.contributions || goal.contributions.length === 0) ? (
                        <p className="text-slate-650 text-[9px] italic">No deposit logs recorded.</p>
                      ) : (
                        goal.contributions.map((c, i) => (
                          <div key={c.id || i} className="flex justify-between items-center text-slate-350">
                            <span>{c.date} — Deposit Contribution</span>
                            <strong className="text-emerald-400">+${c.amount.toFixed(2)}</strong>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Savings Goal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-in zoom-in duration-155">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">New Savings Target</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white transition">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddGoal} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Target Name</label>
                <input
                  type="text"
                  placeholder="e.g. Europe Trip, Car Downpayment"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Target Goal ($)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Initial Saved ($)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1000 (optional)"
                    value={savedAmount}
                    onChange={(e) => setSavedAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Goal Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Target Deadline</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition duration-150 mt-2 shadow-lg shadow-indigo-500/20"
              >
                Launch Savings Goal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Log Contribution (Deposit) Modal */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xs w-full overflow-hidden shadow-2xl animate-in zoom-in duration-155">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-base font-bold text-white">Log Contribution</h2>
              <button onClick={() => { setIsDepositModalOpen(false); setSelectedGoalIdx(null); }} className="text-slate-400 hover:text-white transition">
                ✕
              </button>
            </div>

            <form onSubmit={handleLogDeposit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Deposit Amount ($)</label>
                <input
                  type="number"
                  placeholder="e.g. 250"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-bold"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition duration-150 mt-1 shadow-lg shadow-indigo-500/20"
              >
                Confirm Deposit
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
