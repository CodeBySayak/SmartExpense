import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { fireConfetti } from "../utils/confetti";

const getUniqueId = () => {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
};

export default function Groups() {
  const { user, formatVal } = useAuth();

  // Load groups from localStorage
  const [groups, setGroups] = useState(() => {
    if (!user?.id) return [];
    const saved = localStorage.getItem(`groups_${user.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Sync back to localStorage
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`groups_${user.id}`, JSON.stringify(groups));
    }
  }, [groups, user?.id]);

  // Selected Group State
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || "");
  const selectedGroup = groups.find(g => g.id === selectedGroupId) || null;

  // Active Tab View State
  const [activeTab, setActiveTab] = useState("overview"); // overview, addExpense, ledger, members

  // Group Form states
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupType, setNewGroupType] = useState("Household");
  const [newGroupMembers, setNewGroupMembers] = useState(""); // Comma separated

  // Expense Form states
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmt, setExpenseAmt] = useState("");
  const [expensePaidBy, setExpensePaidBy] = useState("You");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [splitMethod, setSplitMethod] = useState("equal"); // equal, custom, percent
  const [customShares, setCustomShares] = useState({}); // { name: val }

  // Settle Up Form states
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [settleFrom, setSettleFrom] = useState("");
  const [settleTo, setSettleTo] = useState("");
  const [settleAmt, setSettleAmt] = useState("");

  // Helper to change active shared space and reset dependent forms cleanly
  const selectGroup = (groupId) => {
    setSelectedGroupId(groupId);
    setExpensePaidBy("You");
    setCustomShares({});
  };

  const groupTypeIcons = {
    Household: "🏠",
    Travel: "✈️",
    Event: "🎉",
    Partner: "💖",
    Other: "💼"
  };

  // Group Handlers
  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!newGroupName) return;

    const memberArray = newGroupMembers
      .split(",")
      .map(m => m.trim())
      .filter(m => m.length > 0);

    // Always include "You" in members if not already entered
    if (!memberArray.includes("You")) {
      memberArray.unshift("You");
    }

    const newGroup = {
      id: getUniqueId(),
      name: newGroupName.trim(),
      type: newGroupType,
      icon: groupTypeIcons[newGroupType] || "💼",
      members: memberArray,
      expenses: []
    };

    const updatedGroups = [...groups, newGroup];
    setGroups(updatedGroups);
    selectGroup(newGroup.id);
    setActiveTab("overview");

    // Reset Form
    setNewGroupName("");
    setNewGroupType("Household");
    setNewGroupMembers("");
    setIsAddGroupOpen(false);
    fireConfetti();
  };

  const handleDeleteGroup = (groupId) => {
    const updated = groups.filter(g => g.id !== groupId);
    setGroups(updated);
    if (selectedGroupId === groupId && updated.length > 0) {
      selectGroup(updated[0].id);
    } else if (updated.length === 0) {
      selectGroup("");
    }
  };

  // Expense Handlers
  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!expenseDesc || !expenseAmt || !selectedGroup) return;

    const totalAmt = parseFloat(expenseAmt) || 0;
    if (totalAmt <= 0) return;

    let splitWith = [...selectedGroup.members];
    let customAmounts = {};

    if (splitMethod === "custom") {
      let sum = 0;
      selectedGroup.members.forEach(m => {
        const val = parseFloat(customShares[m]) || 0;
        customAmounts[m] = val;
        sum += val;
      });
      // Verification check
      if (Math.abs(sum - totalAmt) > 0.05) {
        alert(`Error: Split amounts must sum exactly to Total Amount (${formatVal(totalAmt)})`);
        return;
      }
    } else if (splitMethod === "percent") {
      let pctSum = 0;
      selectedGroup.members.forEach(m => {
        const pct = parseFloat(customShares[m]) || 0;
        pctSum += pct;
        customAmounts[m] = (pct / 100) * totalAmt;
      });
      if (Math.abs(pctSum - 100) > 0.1) {
        alert("Error: Split percentages must sum exactly to 100%");
        return;
      }
    }

    const newExpense = {
      id: getUniqueId(),
      description: expenseDesc.trim(),
      amount: totalAmt,
      paidBy: expensePaidBy,
      date: expenseDate,
      splitMethod,
      customAmounts: splitMethod !== "equal" ? customAmounts : null,
      splitWith
    };

    const updatedGroups = groups.map(g => {
      if (g.id === selectedGroup.id) {
        return {
          ...g,
          expenses: [newExpense, ...g.expenses]
        };
      }
      return g;
    });

    setGroups(updatedGroups);
    setExpenseDesc("");
    setExpenseAmt("");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setActiveTab("overview");
  };

  const handleDeleteExpense = (expenseId) => {
    const updated = groups.map(g => {
      if (g.id === selectedGroup.id) {
        return {
          ...g,
          expenses: g.expenses.filter(exp => exp.id !== expenseId)
        };
      }
      return g;
    });
    setGroups(updated);
  };

  // Debt Calculations & Network-Flow solver
  const computeGroupBalances = (group) => {
    if (!group) return { balances: {}, totalSpent: 0 };
    const balances = {};
    group.members.forEach(m => { balances[m] = 0; });
    let totalSpent = 0;

    group.expenses.forEach(exp => {
      const paidBy = exp.paidBy;
      const amount = exp.amount;
      
      if (exp.splitMethod === "equal" || !exp.customAmounts) {
        const splitWith = exp.splitWith || group.members;
        const share = amount / splitWith.length;
        splitWith.forEach(m => {
          if (balances[m] !== undefined) balances[m] -= share;
        });
      } else {
        // Custom or percent split with specific amounts
        group.members.forEach(m => {
          const share = exp.customAmounts[m] || 0;
          if (balances[m] !== undefined) balances[m] -= share;
        });
      }

      if (balances[paidBy] !== undefined) {
        balances[paidBy] += amount;
      }
      totalSpent += amount;
    });

    return { balances, totalSpent };
  };

  const solveOptimizedSettlements = (members, expenses) => {
    const { balances } = computeGroupBalances({ members, expenses });
    
    // Separate into Debtors and Creditors
    const debtors = [];
    const creditors = [];

    Object.keys(balances).forEach(m => {
      const bal = balances[m];
      if (bal < -0.01) {
        debtors.push({ name: m, amount: -bal });
      } else if (bal > 0.01) {
        creditors.push({ name: m, amount: bal });
      }
    });

    const settlements = [];

    // Sort to prioritize largest transaction simplifications
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];

      const minAmount = Math.min(debtor.amount, creditor.amount);

      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: minAmount
      });

      debtor.amount -= minAmount;
      creditor.amount -= minAmount;

      if (debtor.amount < 0.01) dIdx++;
      if (creditor.amount < 0.01) cIdx++;
    }

    return settlements;
  };

  // Settle Up Handler
  const handleSettleUpSubmit = (e) => {
    e.preventDefault();
    if (!settleFrom || !settleTo || !settleAmt || !selectedGroup) return;

    const amount = parseFloat(settleAmt) || 0;
    if (amount <= 0) return;

    // Log settlement as a special payment from SettleFrom to SettleTo
    const newExpense = {
      id: getUniqueId(),
      description: `🤝 Settlement: ${settleFrom} paid ${settleTo}`,
      amount: amount,
      paidBy: settleFrom,
      date: new Date().toISOString().split("T")[0],
      splitMethod: "custom",
      customAmounts: {
        [settleFrom]: 0,
        [settleTo]: amount
      },
      splitWith: [settleTo]
    };

    const updatedGroups = groups.map(g => {
      if (g.id === selectedGroup.id) {
        return {
          ...g,
          expenses: [newExpense, ...g.expenses]
        };
      }
      return g;
    });

    setGroups(updatedGroups);
    setSettleFrom("");
    setSettleTo("");
    setSettleAmt("");
    setIsSettleOpen(false);
    fireConfetti();
  };

  // Add members dynamically to existing group
  const [newGroupMemberInput, setNewGroupMemberInput] = useState("");
  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newGroupMemberInput || !selectedGroup) return;

    const trimmed = newGroupMemberInput.trim();
    if (selectedGroup.members.includes(trimmed)) {
      alert("Member already in this group!");
      return;
    }

    const updatedGroups = groups.map(g => {
      if (g.id === selectedGroup.id) {
        return {
          ...g,
          members: [...g.members, trimmed]
        };
      }
      return g;
    });

    setGroups(updatedGroups);
    setNewGroupMemberInput("");
  };

  const activeCalculations = selectedGroup ? computeGroupBalances(selectedGroup) : { balances: {}, totalSpent: 0 };
  const userBalance = activeCalculations.balances["You"] || 0;
  const optimizedSettlements = selectedGroup ? solveOptimizedSettlements(selectedGroup.members, selectedGroup.expenses) : [];

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Shared Spaces</h1>
          <p className="text-slate-400 text-sm mt-1">Split house expenses, coordinate trips, and simplify debts with roommates and family.</p>
        </div>
        <button
          onClick={() => setIsAddGroupOpen(true)}
          className="self-start py-2.5 px-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm transition duration-200 shadow-md shadow-indigo-650/20 active:scale-[0.98]"
        >
          + Create Shared Space
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: Spaces List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 mb-4">Your Active Groups</h2>
            {groups.length === 0 ? (
              <p className="text-slate-500 text-xs italic">No shared spaces created yet.</p>
            ) : (
              <div className="space-y-2">
                {groups.map((group) => {
                  const isActive = group.id === selectedGroupId;
                  const groupBalances = computeGroupBalances(group);
                  const netBal = groupBalances.balances["You"] || 0;

                  return (
                    <div
                      key={group.id}
                      onClick={() => {
                        selectGroup(group.id);
                        setActiveTab("overview");
                      }}
                      className={`p-3.5 rounded-xl border transition duration-200 cursor-pointer flex items-center justify-between group ${
                        isActive
                          ? "bg-violet-600/15 border-violet-500/40 text-white shadow-md shadow-violet-500/5"
                          : "bg-slate-950/25 border-slate-850/60 text-slate-400 hover:bg-slate-850/30 hover:border-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="text-lg bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/40 shrink-0">{group.icon}</span>
                        <div className="overflow-hidden">
                          <h3 className="font-bold text-xs truncate text-white">{group.name}</h3>
                          <span className="text-[9px] text-slate-500">{group.members.length} members</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {netBal > 0.05 ? (
                          <span className="text-[10px] font-extrabold text-emerald-400">+{formatVal(netBal)}</span>
                        ) : netBal < -0.05 ? (
                          <span className="text-[10px] font-extrabold text-rose-400">{formatVal(netBal)}</span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500">Settle</span>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(group.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition text-[9px] text-slate-500 hover:text-red-400 ml-2"
                          title="Delete space"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Shared Ledger Details */}
        <div className="lg:col-span-3">
          {!selectedGroup ? (
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-12 text-center shadow-xl">
              <svg className="w-12 h-12 text-slate-650 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h2 className="text-lg font-bold text-white mb-2">No Active Space Selected</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">Create a shared tracking space to log dinners, utility splits, or joint travel balances with friends.</p>
              <button
                onClick={() => setIsAddGroupOpen(true)}
                className="py-2 px-4 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs transition duration-150 shadow-lg shadow-indigo-600/25"
              >
                + Create Shared Space
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Tabs Navigation */}
              <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-2.5 shadow-xl flex gap-1.5 overflow-x-auto">
                {[
                  { id: "overview", label: "📊 Balance Overview" },
                  { id: "addExpense", label: "💵 Log Shared Bill" },
                  { id: "ledger", label: "📋 Group Ledger" },
                  { id: "members", label: "👥 Members List" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      activeTab === tab.id
                        ? "bg-violet-600 text-white shadow-md shadow-violet-650/20"
                        : "text-slate-400 hover:text-white hover:bg-slate-850/45"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB CONTENT: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  
                  {/* Balance Widget Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Group Ledger Flow</span>
                      <strong className="text-white text-xl font-extrabold">{formatVal(activeCalculations.totalSpent)}</strong>
                      <span className="text-[9px] text-slate-500 block mt-1">Total expenses recorded</span>
                    </div>

                    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Your Net Balance</span>
                      <strong className={`text-xl font-extrabold ${userBalance > 0.05 ? "text-emerald-400" : userBalance < -0.05 ? "text-rose-400" : "text-white"}`}>
                        {userBalance > 0.05 ? "+" : ""}{formatVal(userBalance)}
                      </strong>
                      <span className="text-[9px] text-slate-500 block mt-1">
                        {userBalance > 0.05 ? "You are owed money" : userBalance < -0.05 ? "You owe money to others" : "Your debts are cleared"}
                      </span>
                    </div>

                    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-center">
                      <button
                        onClick={() => {
                          setSettleFrom(userBalance < 0 ? "You" : "");
                          setSettleTo(userBalance > 0 ? "You" : "");
                          setSettleAmt(Math.abs(userBalance).toFixed(2));
                          setIsSettleOpen(true);
                        }}
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl text-xs transition duration-150 shadow-md shadow-emerald-600/10 active:scale-[0.98]"
                      >
                        🤝 Quick Settle Up
                      </button>
                    </div>
                  </div>

                  {/* Settlements Optimization Solver Section */}
                  <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <span>🚀 Optimized Settlement Paths</span>
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">Minimized network path splits to resolve all debts in the fewest payouts.</p>
                      </div>

                      <button
                        onClick={() => {
                          fireConfetti();
                        }}
                        className="py-1 px-3 bg-slate-950/85 hover:bg-slate-900 border border-slate-800/80 rounded-lg text-[10px] text-violet-400 hover:text-white transition font-bold"
                      >
                        ⚡ Re-optimize Flow
                      </button>
                    </div>

                    {optimizedSettlements.length === 0 ? (
                      <p className="text-slate-500 text-xs italic py-6 text-center">Perfect harmony! All member debts are simplified to $0.00.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {optimizedSettlements.map((settle, i) => (
                          <div
                            key={i}
                            className="p-3.5 bg-slate-950/30 border border-slate-850 rounded-xl flex justify-between items-center hover:border-slate-800 transition duration-150"
                          >
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-semibold text-slate-300">{settle.from}</span>
                              <span className="text-[10px] text-slate-500 font-medium">pays</span>
                              <span className="font-semibold text-white">{settle.to}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <strong className="text-xs text-violet-400 font-extrabold">{formatVal(settle.amount)}</strong>
                              <button
                                onClick={() => {
                                  setSettleFrom(settle.from);
                                  setSettleTo(settle.to);
                                  setSettleAmt(settle.amount.toFixed(2));
                                  setIsSettleOpen(true);
                                }}
                                className="px-2 py-1 bg-violet-600/10 hover:bg-violet-650 hover:bg-violet-600 hover:text-white border border-violet-500/20 text-violet-300 font-semibold rounded text-[9px] transition"
                              >
                                Settle
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Balances detailed list */}
                  <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 mb-4">Detailed Balance Sheet</h3>
                    <div className="space-y-3">
                      {selectedGroup.members.map((member) => {
                        const bal = activeCalculations.balances[member] || 0;
                        return (
                          <div key={member} className="flex justify-between items-center p-3 rounded-xl bg-slate-950/20 border border-slate-850/40 text-xs">
                            <span className="font-semibold text-slate-200">{member}</span>
                            {bal > 0.05 ? (
                              <span className="font-bold text-emerald-400">owed {formatVal(bal)}</span>
                            ) : bal < -0.05 ? (
                              <span className="font-bold text-rose-400">owes {formatVal(Math.abs(bal))}</span>
                            ) : (
                              <span className="font-semibold text-slate-500">Settle ($0.00)</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: LOG BILL */}
              {activeTab === "addExpense" && (
                <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800/60 pb-3 mb-6">Log Shared Bill</h3>
                  
                  <form onSubmit={handleAddExpense} className="space-y-5">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400">Description</label>
                        <input
                          type="text"
                          placeholder="e.g. WiFi Router, Grocery, Taxi ride"
                          value={expenseDesc}
                          onChange={(e) => setExpenseDesc(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-medium"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-slate-400">Total Bill Amount ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={expenseAmt}
                          onChange={(e) => setExpenseAmt(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400">Who Paid?</label>
                        <select
                          value={expensePaidBy}
                          onChange={(e) => setExpensePaidBy(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-semibold"
                        >
                          {selectedGroup.members.map(m => (
                            <option key={m} value={m} className="bg-slate-900">{m}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-slate-400">Bill Date</label>
                        <input
                          type="date"
                          value={expenseDate}
                          onChange={(e) => setExpenseDate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-slate-400">Split Breakdown</label>
                        <select
                          value={splitMethod}
                          onChange={(e) => setSplitMethod(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                        >
                          <option value="equal">Split Equally</option>
                          <option value="custom">Split Custom Share ($)</option>
                          <option value="percent">Split Percentage (%)</option>
                        </select>
                      </div>
                    </div>

                    {/* Custom Split Breakdown Fields */}
                    {splitMethod !== "equal" && (
                      <div className="bg-slate-950/30 p-4 border border-slate-850 rounded-2xl space-y-4">
                        <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Assign Shares Dynamically</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {selectedGroup.members.map(member => (
                            <div key={member} className="space-y-1">
                              <label className="text-[10px] text-slate-400 block truncate">{member}</label>
                              <input
                                type="number"
                                step="0.01"
                                placeholder={splitMethod === "custom" ? "$0.00" : "0%"}
                                value={customShares[member] || ""}
                                onChange={(e) => {
                                  setCustomShares({
                                    ...customShares,
                                    [member]: e.target.value
                                  });
                                }}
                                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 font-semibold"
                                required
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition duration-150 shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
                    >
                      Record Shared Expense
                    </button>
                  </form>
                </div>
              )}

              {/* TAB CONTENT: LEDGER */}
              {activeTab === "ledger" && (
                <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 mb-4">Space Activity Log</h3>
                  
                  {selectedGroup.expenses.length === 0 ? (
                    <p className="text-slate-500 text-xs italic py-10 text-center">Empty ledger. No shared expenses have been recorded for this space.</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedGroup.expenses.map((exp) => (
                        <div
                          key={exp.id}
                          className="p-4 rounded-xl bg-slate-950/40 border border-slate-850/40 hover:border-slate-800 transition duration-150 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-violet-600/10 border border-violet-550/20 flex items-center justify-center font-bold text-violet-400 text-sm">
                              $
                            </div>
                            <div>
                              <p className="font-semibold text-white">{exp.description}</p>
                              <p className="text-[10px] text-slate-550 mt-0.5">
                                Paid by <strong className="text-slate-400">{exp.paidBy}</strong> • {exp.date}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="font-extrabold text-white text-sm">{formatVal(exp.amount)}</span>
                            <button
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="text-slate-600 hover:text-red-400 p-1 transition"
                              title="Delete entry"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: MEMBERS */}
              {activeTab === "members" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Members List */}
                  <div className="md:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-500">Active Room Members</h3>
                    <div className="divide-y divide-slate-850/60">
                      {selectedGroup.members.map((member) => (
                        <div key={member} className="flex justify-between items-center py-3 text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-violet-600/25 border border-violet-500/30 flex items-center justify-center font-semibold text-violet-300 uppercase shadow-inner text-[10px]">
                              {member[0]}
                            </div>
                            <span className="font-semibold text-white">{member}</span>
                          </div>
                          {member === "You" && <span className="text-[9px] font-bold text-slate-550 uppercase bg-slate-950/80 px-2 py-0.5 rounded border border-slate-850">Creator</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add Member form */}
                  <div className="md:col-span-1 bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-500">Invite Room Member</h3>
                    <form onSubmit={handleAddMember} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 block">Name</label>
                        <input
                          type="text"
                          placeholder="e.g. John Doe, Sarah"
                          value={newGroupMemberInput}
                          onChange={(e) => setNewGroupMemberInput(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-medium"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition duration-150 shadow-md shadow-indigo-600/10 active:scale-[0.98]"
                      >
                        + Invite Member
                      </button>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

      </div>

      {/* CREATE SPACE MODAL */}
      {isAddGroupOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-in zoom-in duration-155">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Create Shared Space</h2>
              <button onClick={() => setIsAddGroupOpen(false)} className="text-slate-400 hover:text-white transition">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. Switzerland Trip, Flat roommates"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Space Type</label>
                <select
                  value={newGroupType}
                  onChange={(e) => setNewGroupType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-semibold"
                >
                  <option value="Household">Household 🏠</option>
                  <option value="Travel">Travel ✈️</option>
                  <option value="Event">Event 🎉</option>
                  <option value="Partner">Partner 💖</option>
                  <option value="Other">Other 💼</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Initial Members (comma-separated)</label>
                <textarea
                  placeholder="Alice, Bob, Charlie (excluding 'You')"
                  value={newGroupMembers}
                  onChange={(e) => setNewGroupMembers(e.target.value)}
                  rows="2"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 resize-none font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition duration-150 mt-2 shadow-lg shadow-indigo-500/20"
              >
                Launch Group Ledger
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SETTLE UP MODAL */}
      {isSettleOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xs w-full overflow-hidden shadow-2xl animate-in zoom-in duration-155">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-base font-bold text-white">Record Settle Payment</h2>
              <button onClick={() => setIsSettleOpen(false)} className="text-slate-400 hover:text-white transition">
                ✕
              </button>
            </div>

            <form onSubmit={handleSettleUpSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Payer</label>
                  <select
                    value={settleFrom}
                    onChange={(e) => setSettleFrom(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    required
                  >
                    <option value="" disabled className="bg-slate-900">Select...</option>
                    {selectedGroup.members.map(m => (
                      <option key={m} value={m} className="bg-slate-900">{m}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Receiver</label>
                  <select
                    value={settleTo}
                    onChange={(e) => setSettleTo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    required
                  >
                    <option value="" disabled className="bg-slate-900">Select...</option>
                    {selectedGroup.members.map(m => (
                      <option key={m} value={m} className="bg-slate-900">{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Payment Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={settleAmt}
                  onChange={(e) => setSettleAmt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-extrabold text-center text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl text-xs transition duration-150 mt-1 shadow-lg active:scale-[0.98]"
              >
                Confirm Settle
              </button>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
