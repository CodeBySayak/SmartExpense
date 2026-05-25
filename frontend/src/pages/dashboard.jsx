import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { useAnimatedCounter } from "../hooks/useAnimatedCounter";
import TypewriterInsight from "../components/ui/TypewriterInsight";

const CURRENCIES = {
  USD: { symbol: "$", rate: 1.0, label: "USD ($)" },
  EUR: { symbol: "€", rate: 0.92, label: "EUR (€)" },
  INR: { symbol: "₹", rate: 83.2, label: "INR (₹)" },
  GBP: { symbol: "£", rate: 0.79, label: "GBP (£)" }
};

const SIMULATED_RECEIPTS = [
  { merchant: "Starbucks Coffee", amount: 14.50, category: "Food & Drinks", date: "May 25, 2026" },
  { merchant: "Whole Foods", amount: 132.80, category: "Groceries", date: "May 24, 2026" },
  { merchant: "AWS Cloud Services", amount: 342.00, category: "Subscriptions", date: "May 23, 2026" },
  { merchant: "Chevron Gas Station", amount: 58.00, category: "Transport", date: "May 22, 2026" }
];

export default function Dashboard() {
  const { user } = useAuth();
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [currency, setCurrency] = useState("USD");

  // AI Receipt Scanner States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  // Load real user-specific data from localStorage
  const [incomeSources] = useState(() => {
    if (!user?.id) return [];
    const savedIncome = localStorage.getItem(`income_${user.id}`);
    return savedIncome ? JSON.parse(savedIncome) : [];
  });
  const [expenseCategories, setExpenseCategories] = useState(() => {
    if (!user?.id) return [];
    const savedExpenses = localStorage.getItem(`expenses_${user.id}`);
    return savedExpenses ? JSON.parse(savedExpenses) : [];
  });
  const [groups] = useState(() => {
    if (!user?.id) return [];
    const savedGroups = localStorage.getItem(`groups_${user.id}`);
    return savedGroups ? JSON.parse(savedGroups) : [];
  });

  // Drag and Drop Widgets State
  const [widgetOrder, setWidgetOrder] = useState(["chart", "spendingMap", "heatmapBadges"]);
  const [draggedWidgetId, setDraggedWidgetId] = useState(null);

  // Interactive Spending Map State
  const [selectedMapNode, setSelectedMapNode] = useState("groceries");

  // Sync back helper when modified locally
  const syncExpenses = (updatedExpenses) => {
    setExpenseCategories(updatedExpenses);
    if (user?.id) {
      localStorage.setItem(`expenses_${user.id}`, JSON.stringify(updatedExpenses));
    }
  };

  // Convert USD dynamically
  const formatVal = (valInUSD) => {
    const curr = CURRENCIES[currency];
    const converted = valInUSD * curr.rate;
    return `${curr.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculate real values
  const totalIncome = incomeSources.reduce((acc, source) => acc + source.amount, 0);
  const totalExpenses = expenseCategories.reduce((acc, cat) => acc + cat.spent, 0);
  const totalBudget = expenseCategories.reduce((acc, cat) => acc + cat.budget, 0);
  const totalBalance = totalIncome - totalExpenses;
  const activeSavingsRate = totalIncome > 0 ? (totalBalance / totalIncome) * 100 : 0;

  // ANIMATED STATS COUNTERS
  const animatedBalance = useAnimatedCounter(totalBalance);
  const animatedIncome = useAnimatedCounter(totalIncome);
  const animatedExpenses = useAnimatedCounter(totalExpenses);
  const animatedSavingsRate = useAnimatedCounter(activeSavingsRate);

  const hasData = totalIncome > 0 || totalExpenses > 0;

  // Calculate total balance across all shared spaces
  const calculateTotalJointBalance = () => {
    let totalBal = 0;
    groups.forEach(group => {
      const balances = {};
      group.members.forEach(m => { balances[m] = 0; });
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
          group.members.forEach(m => {
            const share = exp.customAmounts[m] || 0;
            if (balances[m] !== undefined) balances[m] -= share;
          });
        }
        if (balances[paidBy] !== undefined) balances[paidBy] += amount;
      });
      totalBal += (balances["You"] || 0);
    });
    return totalBal;
  };

  const totalJointBalance = calculateTotalJointBalance();

  // Generate chart data dynamically to show the flow
  const chartData = hasData ? [
    { date: "May 19", income: totalIncome * 0.1, expense: totalExpenses * 0.15 },
    { date: "May 20", income: totalIncome * 0.25, expense: totalExpenses * 0.3 },
    { date: "May 21", income: totalIncome * 0.45, expense: totalExpenses * 0.45 },
    { date: "May 22", income: totalIncome * 0.55, expense: totalExpenses * 0.6 },
    { date: "May 23", income: totalIncome * 0.7, expense: totalExpenses * 0.7 },
    { date: "May 24", income: totalIncome * 0.85, expense: totalExpenses * 0.8 },
    { date: "May 25", income: totalIncome, expense: totalExpenses },
  ] : [
    { date: "May 19", income: 0, expense: 0 },
    { date: "May 20", income: 0, expense: 0 },
    { date: "May 21", income: 0, expense: 0 },
    { date: "May 22", income: 0, expense: 0 },
    { date: "May 23", income: 0, expense: 0 },
    { date: "May 24", income: 0, expense: 0 },
    { date: "May 25", income: 0, expense: 0 },
  ];

  // Dynamic Y axis scale
  const maxVal = Math.max(
    ...chartData.map(d => Math.max(d.income, d.expense)),
    100 // minimum threshold
  );

  const stats = [
    {
      title: "Total Balance",
      value: formatVal(animatedBalance),
      change: totalIncome > 0 ? `${activeSavingsRate >= 0 ? "+" : ""}${activeSavingsRate.toFixed(1)}% net margin` : "No income recorded yet",
      isPositive: totalBalance >= 0,
      colorClass: totalBalance >= 0
        ? "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400"
        : "from-rose-500/20 to-orange-500/20 border-rose-500/30 text-rose-400",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Monthly Income",
      value: formatVal(animatedIncome),
      change: `${incomeSources.length} source${incomeSources.length === 1 ? "" : "s"} listed`,
      isPositive: true,
      colorClass: "from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      title: "Monthly Expenses",
      value: formatVal(animatedExpenses),
      change: `${expenseCategories.length} category${expenseCategories.length === 1 ? "" : "ies"} tracked`,
      isPositive: false,
      colorClass: "from-rose-500/20 to-orange-500/20 border-rose-500/30 text-rose-400",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
        </svg>
      ),
    },
    {
      title: "Savings Rate",
      value: `${animatedSavingsRate.toFixed(1)}%`,
      change: "Net Savings Margin",
      isPositive: activeSavingsRate >= 20,
      colorClass: "from-violet-500/20 to-fuchsia-500/20 border-violet-500/30 text-violet-400",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.176 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h4.906a1 1 0 00.95-.69l1.519-4.674z" />
        </svg>
      ),
    },
    {
      title: "Shared Balance",
      value: totalJointBalance > 0.05 ? `+${formatVal(totalJointBalance)}` : totalJointBalance < -0.05 ? formatVal(totalJointBalance) : "$0.00",
      change: `${groups.length} active shared space${groups.length === 1 ? "" : "s"}`,
      isPositive: totalJointBalance >= 0,
      colorClass: totalJointBalance > 0.05
        ? "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400"
        : totalJointBalance < -0.05
          ? "from-rose-500/20 to-orange-500/20 border-rose-500/30 text-rose-400"
          : "from-slate-500/20 to-slate-600/20 border-slate-700 text-slate-300",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    }
  ];

  // Smart Budget Warnings
  const budgetAlerts = expenseCategories.filter(cat => cat.spent >= cat.budget * 0.8);

  // Dynamic Recent Transactions
  const recentTransactions = [
    ...incomeSources.map((source, index) => ({
      id: `income_${index}`,
      title: source.name,
      date: source.date,
      category: "Income",
      amount: source.amount,
      type: "income"
    })),
    ...expenseCategories.filter(cat => cat.spent > 0).map((cat, index) => ({
      id: `expense_${index}`,
      title: cat.name,
      date: "Ongoing",
      category: cat.name,
      amount: -cat.spent,
      type: "expense"
    }))
  ];

  // Upcoming Bills Feed
  const recurringBills = [
    ...incomeSources.filter(source => source.isRecurring).map(source => ({
      title: `Expected: ${source.name}`,
      amount: source.amount,
      type: "income",
      due: "Every 1st of Month"
    })),
    ...expenseCategories.map(cat => ({
      title: `Budget for ${cat.name}`,
      amount: cat.budget,
      type: "expense",
      due: "Ongoing monthly limits"
    }))
  ];

  // simulated OCR trigger
  const handleTriggerSimulatedScan = (receiptTemplate) => {
    setSelectedReceipt(receiptTemplate);
    setIsScanning(true);
    setScanStep(1);

    setTimeout(() => setScanStep(2), 700);
    setTimeout(() => setScanStep(3), 1400);

    setTimeout(() => {
      const targetCategoryName = receiptTemplate.category;
      let updatedExpenses = [...expenseCategories];
      let targetCat = updatedExpenses.find(c => c.name.toLowerCase() === targetCategoryName.toLowerCase());

      if (targetCat) {
        targetCat.spent += receiptTemplate.amount;
      } else {
        const newCat = {
          name: receiptTemplate.category,
          budget: receiptTemplate.amount * 2.5,
          spent: receiptTemplate.amount,
          color: "bg-indigo-600"
        };
        updatedExpenses.push(newCat);
      }

      syncExpenses(updatedExpenses);
      setIsScanning(false);
      setIsScannerOpen(false);
      setSelectedReceipt(null);
    }, 2100);
  };

  const handleImageUploadSimulation = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const randomReceipt = SIMULATED_RECEIPTS[Math.floor(Math.random() * SIMULATED_RECEIPTS.length)];
      setSelectedReceipt(randomReceipt);
      setIsScanning(true);
      setScanStep(1);

      setTimeout(() => setScanStep(2), 700);
      setTimeout(() => setScanStep(3), 1400);

      setTimeout(() => {
        const targetCategoryName = randomReceipt.category;
        let updatedExpenses = [...expenseCategories];
        let targetCat = updatedExpenses.find(c => c.name.toLowerCase() === targetCategoryName.toLowerCase());

        if (targetCat) {
          targetCat.spent += randomReceipt.amount;
        } else {
          const newCat = {
            name: randomReceipt.category,
            budget: randomReceipt.amount * 2.5,
            spent: randomReceipt.amount,
            color: "bg-violet-600"
          };
          updatedExpenses.push(newCat);
        }

        syncExpenses(updatedExpenses);
        setIsScanning(false);
        setIsScannerOpen(false);
        setSelectedReceipt(null);
      }, 2100);
    }
  };

  // NATIVE DRAG AND DROP HANDLERS
  const handleDragStart = (e, widgetId) => {
    setDraggedWidgetId(widgetId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, overId) => {
    e.preventDefault();
    if (draggedWidgetId === null || draggedWidgetId === overId) return;

    const oldIndex = widgetOrder.indexOf(draggedWidgetId);
    const newIndex = widgetOrder.indexOf(overId);

    const updatedOrder = [...widgetOrder];
    updatedOrder.splice(oldIndex, 1);
    updatedOrder.splice(newIndex, 0, draggedWidgetId);
    setWidgetOrder(updatedOrder);
  };

  const handleDragEnd = () => {
    setDraggedWidgetId(null);
  };

  // Dynamic Achievements computation
  const achievements = [
    {
      id: "frugal",
      title: "Frugal Master",
      desc: "Spent <50% of monthly budget limit.",
      icon: "🛡️",
      isUnlocked: totalBudget > 0 && totalExpenses < totalBudget * 0.5,
      progress: totalBudget > 0 ? `${Math.round((totalExpenses / totalBudget) * 100)}% spent` : "0% spent"
    },
    {
      id: "pioneer",
      title: "Income Pioneer",
      desc: "Recorded your first monthly income source.",
      icon: "🚀",
      isUnlocked: incomeSources.length > 0,
      progress: `${incomeSources.length} active inflow${incomeSources.length === 1 ? "" : "s"}`
    },
    {
      id: "guru",
      title: "Savings Guru",
      desc: "Maintained a savings rate of 20% or more.",
      icon: "🎯",
      isUnlocked: activeSavingsRate >= 20,
      progress: `${activeSavingsRate.toFixed(1)}% rate`
    },
    {
      id: "warrior",
      title: "Budget Warrior",
      desc: "Added 3 or more budget categories.",
      icon: "💼",
      isUnlocked: expenseCategories.length >= 3,
      progress: `${expenseCategories.length} categories`
    }
  ];

  // GitHub contribution-style dynamic calendar heatmap generator
  const renderCalendarHeatmap = () => {
    const cells = [];
    const now = new Date();

    // Seed 84 days (12 weeks) of transaction activity
    for (let i = 83; i >= 0; i--) {
      const cellDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const day = cellDate.getDate();

      // Determine activity levels dynamically based on user state
      let activityLevel = 0;
      if (totalExpenses > 0) {
        // pseudo-random logic linked to date to remain deterministic
        const pseudoRand = (day * 3 + cellDate.getMonth() * 7) % 10;
        if (pseudoRand === 2 || pseudoRand === 6) activityLevel = totalExpenses * 0.01;
        else if (pseudoRand === 4) activityLevel = totalExpenses * 0.04;
        else if (pseudoRand === 7) activityLevel = totalExpenses * 0.09;
      }

      let colorClass = "bg-slate-900 border-slate-950";
      if (activityLevel > 0) {
        if (activityLevel < 15) colorClass = "bg-violet-950/40 border-violet-900/10 text-violet-400";
        else if (activityLevel < 45) colorClass = "bg-violet-850/60 border-violet-800/20 text-violet-300";
        else if (activityLevel < 100) colorClass = "bg-violet-600/80 border-violet-500/20 text-violet-200";
        else colorClass = "bg-violet-500 border-violet-400 shadow-md shadow-violet-500/10 text-white";
      }

      cells.push({
        dateStr: cellDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        spent: activityLevel,
        colorClass
      });
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center text-xs text-slate-400 font-bold">
          <span>Daily Expense Heatmap</span>
          <div className="flex gap-1 items-center text-[9px] text-slate-500 font-medium">
            <span>Empty</span>
            <span className="w-2.5 h-2.5 rounded-xs bg-slate-900 border border-slate-950"></span>
            <span className="w-2.5 h-2.5 rounded-xs bg-violet-950/40"></span>
            <span className="w-2.5 h-2.5 rounded-xs bg-violet-850/60"></span>
            <span className="w-2.5 h-2.5 rounded-xs bg-violet-600/80"></span>
            <span className="w-2.5 h-2.5 rounded-xs bg-violet-500"></span>
            <span>Active</span>
          </div>
        </div>

        {/* Heatmap calendar grid */}
        <div className="grid grid-cols-12 gap-1.5 p-4 bg-slate-950/40 border border-slate-850 rounded-2xl">
          {cells.map((cell, idx) => (
            <div
              key={idx}
              className={`heatmap-cell ${cell.colorClass} border`}
              title={`${cell.dateStr}: ${formatVal(cell.spent)} spent`}
            />
          ))}
        </div>
      </div>
    );
  };

  // Interactive Cyberpunk spending map SVG
  const renderSpendingMap = () => {
    const nodes = [
      { id: "groceries", name: "Groceries Sector", cx: 180, cy: 110, rx: 12, ry: 12, fill: "#8b5cf6" },
      { id: "housing", name: "Housing Hub", cx: 480, cy: 90, rx: 14, ry: 14, fill: "#f43f5e" },
      { id: "dining", name: "Dining District", cx: 280, cy: 190, rx: 10, ry: 10, fill: "#10b981" },
      { id: "transport", name: "Transit Terminal", cx: 120, cy: 220, rx: 9, ry: 9, fill: "#f59e0b" },
      { id: "subs", name: "Subscriptions Grid", cx: 580, cy: 200, rx: 11, ry: 11, fill: "#3b82f6" },
    ];

    // Find category details for nodes dynamically
    const getNodeDetails = (nodeId) => {
      if (nodeId === "groceries") {
        const cat = expenseCategories.find(c => c.name.toLowerCase().includes("grocer"));
        return { spent: cat?.spent || 240, budget: cat?.budget || 500, label: "Groceries Sector" };
      }
      if (nodeId === "housing") {
        const cat = expenseCategories.find(c => c.name.toLowerCase().includes("rent") || c.name.toLowerCase().includes("house"));
        return { spent: cat?.spent || 1200, budget: cat?.budget || 1500, label: "Housing Hub" };
      }
      if (nodeId === "dining") {
        const cat = expenseCategories.find(c => c.name.toLowerCase().includes("dining") || c.name.toLowerCase().includes("food"));
        return { spent: cat?.spent || 145, budget: cat?.budget || 300, label: "Dining District" };
      }
      if (nodeId === "transport") {
        const cat = expenseCategories.find(c => c.name.toLowerCase().includes("transport") || c.name.toLowerCase().includes("gas"));
        return { spent: cat?.spent || 85, budget: cat?.budget || 200, label: "Transit Terminal" };
      }
      if (nodeId === "subs") {
        const cat = expenseCategories.find(c => c.name.toLowerCase().includes("sub") || c.name.toLowerCase().includes("premium"));
        return { spent: cat?.spent || 68, budget: cat?.budget || 100, label: "Subscriptions Grid" };
      }
      return { spent: 0, budget: 100, label: "N/A Sector" };
    };

    const activeNodeData = getNodeDetails(selectedMapNode);

    return (
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="cursor-move select-none text-slate-500">☰</span>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              🌍 Interactive Spending Map
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Click network nodes to inspect sector allocation</p>
        </div>

        {/* Vector SVG Network map */}
        <div className="relative pt-2 bg-slate-950/40 rounded-xl border border-slate-850 p-2 overflow-hidden flex-1 flex flex-col justify-center min-h-[220px]">
          <svg viewBox="0 0 700 300" className="w-full h-auto drop-shadow-2xl">
            {/* SVG Connecting Net Lines */}
            <path d="M 180 110 Q 300 80 480 90" stroke="rgba(139,92,246,0.15)" strokeWidth="2" strokeDasharray="5 5" fill="none" />
            <path d="M 180 110 L 280 190" stroke="rgba(139,92,246,0.15)" strokeWidth="2" strokeDasharray="5 5" fill="none" />
            <path d="M 120 220 L 280 190" stroke="rgba(139,92,246,0.15)" strokeWidth="2" strokeDasharray="5 5" fill="none" />
            <path d="M 280 190 L 480 90" stroke="rgba(139,92,246,0.15)" strokeWidth="2" strokeDasharray="5 5" fill="none" />
            <path d="M 480 90 L 580 200" stroke="rgba(139,92,246,0.15)" strokeWidth="2" strokeDasharray="5 5" fill="none" />
            <path d="M 280 190 L 580 200" stroke="rgba(139,92,246,0.15)" strokeWidth="2" strokeDasharray="5 5" fill="none" />

            {/* Pulsing ring indicator under selected node */}
            {(() => {
              const activeNode = nodes.find(n => n.id === selectedMapNode);
              if (!activeNode) return null;
              return (
                <circle
                  cx={activeNode.cx}
                  cy={activeNode.cy}
                  r={activeNode.rx + 12}
                  fill="none"
                  stroke={activeNode.fill}
                  strokeWidth="2"
                  className="animate-ping"
                  opacity="0.4"
                />
              );
            })()}

            {/* Vector Nodes */}
            {nodes.map((n) => {
              const isSelected = selectedMapNode === n.id;
              return (
                <g
                  key={n.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedMapNode(n.id)}
                >
                  <circle
                    cx={n.cx}
                    cy={n.cy}
                    r={isSelected ? n.rx + 3 : n.rx}
                    fill={n.fill}
                    stroke="#0f172a"
                    strokeWidth="2.5"
                    className="transition-all duration-150 hover:scale-125"
                  />
                  <text
                    x={n.cx}
                    y={n.cy + n.ry + 14}
                    fill={isSelected ? "#ffffff" : "#94a3b8"}
                    fontSize="9.5"
                    textAnchor="middle"
                    className="font-bold select-none transition-colors"
                  >
                    {n.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Active node detail overlay panel */}
          <div className="mt-4 p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-200">
            <div>
              <p className="font-bold text-white">{activeNodeData.label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Budget Limit: {formatVal(activeNodeData.budget)}</p>
            </div>
            <div className="text-right">
              <span className="font-extrabold text-sm text-violet-400">{formatVal(activeNodeData.spent)}</span>
              <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Accumulated Flow</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      {/* Smart Budget Warning Banner Overlay */}
      {budgetAlerts.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-slate-200 text-xs flex items-center justify-between shadow-lg shadow-rose-950/20 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 font-bold">
              ⚠️
            </div>
            <div>
              <p className="font-semibold text-rose-400">Budget Limit Warning</p>
              <p className="text-slate-400 mt-0.5">
                The following categories have consumed over 80% of their limit:{" "}
                {budgetAlerts.map(c => `${c.name} (${Math.round(c.spent / c.budget * 100)}%)`).join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Header & Feature Controls */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name || "User"}!
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Here is your smart financial summary for this month.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* AI Scanner Trigger */}
          <button
            id="ai-scanner-trigger-btn"
            onClick={() => setIsScannerOpen(true)}
            className="py-2 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs transition duration-200 shadow-md shadow-indigo-600/20 active:scale-[0.98] flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            AI Receipt Scan
          </button>

          {/* Currency Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            {Object.keys(CURRENCIES).map((curr) => (
              <button
                key={curr}
                onClick={() => setCurrency(curr)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${currency === curr
                    ? "bg-violet-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                  }`}
              >
                {curr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid with ANIMATED COUNTERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`bg-gradient-to-br ${stat.colorClass} bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between transition-transform duration-200 hover:-translate-y-1`}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{stat.title}</p>
              <h3 className="text-2xl font-bold text-white mb-2">{stat.value}</h3>
              <p className="text-xs text-slate-500 font-medium">{stat.change}</p>
            </div>
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/40">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* THREE-COLUMN WIDGETS SECTION (DRAGGABLE) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Graph / Chart Widget */}
        <div className="lg:col-span-2">
          {widgetOrder.map((widgetId) => {
            if (widgetId !== "chart") return null;
            return (
              <div
                key={widgetId}
                draggable
                onDragStart={(e) => handleDragStart(e, "chart")}
                onDragOver={(e) => handleDragOver(e, "chart")}
                onDragEnd={handleDragEnd}
                className={`bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all duration-300 ${draggedWidgetId === "chart" ? "opacity-30 scale-98 border-violet-500/50" : ""
                  }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="cursor-move select-none text-slate-500">☰</span>
                    <div>
                      <h2 className="text-lg font-bold text-white">Expense vs Income Flow</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Visualize your cashflow throughout this month</p>
                    </div>
                  </div>
                </div>

                <div className="relative pt-4 px-2 bg-slate-950/40 rounded-xl border border-slate-850 overflow-hidden">
                  <div className="flex gap-4 mb-4 px-4 text-xs font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                      <span className="text-slate-300">Income</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                      <span className="text-slate-300">Expenses</span>
                    </div>
                  </div>

                  {hoveredIndex !== null && hasData && (
                    <div
                      className="absolute z-20 bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-xl text-xs pointer-events-none transition-all duration-150"
                      style={{
                        left: `${Math.min(Math.max(50 + hoveredIndex * 80 - 60, 10), 450)}px`,
                        top: "20px",
                      }}
                    >
                      <p className="font-bold text-white mb-1.5 border-b border-slate-800 pb-1">{chartData[hoveredIndex].date}</p>
                      <div className="space-y-1">
                        <p className="text-emerald-400 flex items-center justify-between gap-4">
                          <span>Income:</span> <strong>{formatVal(chartData[hoveredIndex].income)}</strong>
                        </p>
                        <p className="text-rose-400 flex items-center justify-between gap-4">
                          <span>Expense:</span> <strong>{formatVal(chartData[hoveredIndex].expense)}</strong>
                        </p>
                      </div>
                    </div>
                  )}

                  <svg viewBox="0 0 700 260" className="w-full h-auto text-slate-700">
                    <defs>
                      <linearGradient id="incomeArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="expenseArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    <line x1="50" y1="40" x2="650" y2="40" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="50" y1="130" x2="650" y2="130" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="50" y1="220" x2="650" y2="220" stroke="#1e293b" strokeWidth="1" />

                    <text x="15" y="44" fill="#64748b" className="text-[10px] font-semibold">{CURRENCIES[currency].symbol}{Math.round(maxVal * CURRENCIES[currency].rate).toLocaleString()}</text>
                    <text x="15" y="134" fill="#64748b" className="text-[10px] font-semibold">{CURRENCIES[currency].symbol}{Math.round((maxVal / 2) * CURRENCIES[currency].rate).toLocaleString()}</text>
                    <text x="25" y="224" fill="#64748b" className="text-[10px] font-semibold">$0</text>

                    <path
                      d={`M 50 220 L 50 ${220 - (chartData[0].income / maxVal) * 180} L 150 ${220 - (chartData[1].income / maxVal) * 180} L 250 ${220 - (chartData[2].income / maxVal) * 180} L 350 ${220 - (chartData[3].income / maxVal) * 180} L 450 ${220 - (chartData[4].income / maxVal) * 180} L 550 ${220 - (chartData[5].income / maxVal) * 180} L 650 ${220 - (chartData[6].income / maxVal) * 180} L 650 220 Z`}
                      fill="url(#incomeArea)"
                    />
                    <path
                      d={`M 50 220 L 50 ${220 - (chartData[0].expense / maxVal) * 180} L 150 ${220 - (chartData[1].expense / maxVal) * 180} L 250 ${220 - (chartData[2].expense / maxVal) * 180} L 350 ${220 - (chartData[3].expense / maxVal) * 180} L 450 ${220 - (chartData[4].expense / maxVal) * 180} L 550 ${220 - (chartData[5].expense / maxVal) * 180} L 650 ${220 - (chartData[6].expense / maxVal) * 180} L 650 220 Z`}
                      fill="url(#expenseArea)"
                    />

                    <path
                      d={`M 50 ${220 - (chartData[0].income / maxVal) * 180} L 150 ${220 - (chartData[1].income / maxVal) * 180} L 250 ${220 - (chartData[2].income / maxVal) * 180} L 350 ${220 - (chartData[3].income / maxVal) * 180} L 450 ${220 - (chartData[4].income / maxVal) * 180} L 550 ${220 - (chartData[5].income / maxVal) * 180} L 650 ${220 - (chartData[6].income / maxVal) * 180}`}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d={`M 50 ${220 - (chartData[0].expense / maxVal) * 180} L 150 ${220 - (chartData[1].expense / maxVal) * 180} L 250 ${220 - (chartData[2].expense / maxVal) * 180} L 350 ${220 - (chartData[3].expense / maxVal) * 180} L 450 ${220 - (chartData[4].expense / maxVal) * 180} L 550 ${220 - (chartData[5].expense / maxVal) * 180} L 650 ${220 - (chartData[6].expense / maxVal) * 180}`}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {chartData.map((data, idx) => {
                      const xPos = 50 + idx * 100;
                      const incY = 220 - (data.income / maxVal) * 180;
                      const expY = 220 - (data.expense / maxVal) * 180;
                      const isHovered = hoveredIndex === idx;

                      return (
                        <g key={idx} className="cursor-pointer">
                          {isHovered && hasData && (
                            <line x1={xPos} y1="40" x2={xPos} y2="220" stroke="#334155" strokeWidth="1.5" strokeDasharray="2 2" />
                          )}

                          <circle
                            cx={xPos}
                            cy={incY}
                            r={isHovered ? 6 : 4}
                            fill="#10b981"
                            stroke="#020617"
                            strokeWidth="2"
                            className="transition-all duration-150"
                          />

                          <circle
                            cx={xPos}
                            cy={expY}
                            r={isHovered ? 6 : 4}
                            fill="#f43f5e"
                            stroke="#020617"
                            strokeWidth="2"
                            className="transition-all duration-150"
                          />

                          <rect
                            x={xPos - 40}
                            y="20"
                            width="80"
                            height="205"
                            fill="transparent"
                            onMouseEnter={() => setHoveredIndex(idx)}
                            onMouseLeave={() => setHoveredIndex(null)}
                          />

                          <text x={xPos} y="245" fill="#64748b" textAnchor="middle" className="text-[10px] font-semibold select-none">
                            {data.date}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {!hasData && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/65 backdrop-blur-[1px] rounded-xl text-center p-4">
                      <svg className="w-8 h-8 text-slate-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="text-xs font-semibold text-slate-300">No cashflow data available yet</p>
                      <p className="text-[10px] text-slate-500 mt-1 max-w-[200px]">Add your income and expenses in the respective tabs to see your cashflow trend.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Smart Insight Panel Widget */}
        <div className="lg:col-span-1">
          <TypewriterInsight
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            totalBalance={totalBalance}
            savingsRate={activeSavingsRate}
          />
        </div>
      </div>

      {/* SECOND ROW WIDGETS (DRAGGABLE & INTERACTIVE) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Interactive Spending Map */}
        {widgetOrder.map((widgetId) => {
          if (widgetId !== "spendingMap") return null;
          return (
            <div
              key={widgetId}
              draggable
              onDragStart={(e) => handleDragStart(e, "spendingMap")}
              onDragOver={(e) => handleDragOver(e, "spendingMap")}
              onDragEnd={handleDragEnd}
              className={`transition-all duration-300 ${draggedWidgetId === "spendingMap" ? "opacity-30 scale-98 border-violet-500/50" : ""
                }`}
            >
              {renderSpendingMap()}
            </div>
          );
        })}

        {/* Calendar Heatmap & Achievements Panel */}
        {widgetOrder.map((widgetId) => {
          if (widgetId !== "heatmapBadges") return null;
          return (
            <div
              key={widgetId}
              draggable
              onDragStart={(e) => handleDragStart(e, "heatmapBadges")}
              onDragOver={(e) => handleDragOver(e, "heatmapBadges")}
              onDragEnd={handleDragEnd}
              className={`bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all duration-300 flex flex-col justify-between ${draggedWidgetId === "heatmapBadges" ? "opacity-30 scale-98 border-violet-500/50" : ""
                }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <span className="cursor-move select-none text-slate-500">☰</span>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    🎖️ Achievements & Calender
                  </h2>
                </div>

                {/* Gamified Achievements/Badges Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {achievements.map((ach) => (
                    <div
                      key={ach.id}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between h-24 relative overflow-hidden transition duration-300 ${ach.isUnlocked
                          ? "bg-violet-600/10 border-violet-500/30 text-white shadow-md shadow-violet-500/5"
                          : "bg-slate-950/20 border-slate-850/60 opacity-50 grayscale"
                        }`}
                      title={ach.desc}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xl">{ach.icon}</span>
                        {!ach.isUnlocked && <span className="text-[10px] text-slate-500">🔒 Locked</span>}
                        {ach.isUnlocked && <span className="text-[9px] font-bold uppercase tracking-wider text-violet-400 bg-violet-950/50 px-1.5 py-0.5 rounded">Unlocked</span>}
                      </div>
                      <div>
                        <p className="font-bold text-xs truncate">{ach.title}</p>
                        <p className="text-[9px] text-slate-500 font-medium truncate mt-0.5">{ach.progress}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Heatmap Grid */}
                {renderCalendarHeatmap()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Transactions Table & Bills Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">Recent Transactions</h2>
                <p className="text-xs text-slate-400 mt-0.5">Your latest financial activity</p>
              </div>
            </div>

            <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1">
              {recentTransactions.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  <svg className="w-10 h-10 text-slate-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>No transactions yet. Add details in Income or Expenses tabs.</span>
                </div>
              ) : (
                recentTransactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-850/40 hover:border-slate-800 transition duration-150">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${tx.type === "income"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                        {tx.type === "income" ? "+" : "-"}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-white truncate max-w-[150px]">{tx.title}</p>
                        <p className="text-[10px] text-slate-500 truncate">{tx.date} • {tx.category}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${tx.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                      {tx.type === "income" ? "+" : "-"}{formatVal(Math.abs(tx.amount))}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Expected Financial Flows</h2>
            <p className="text-xs text-slate-400 mb-6">Automated trackers and budget summaries</p>

            <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1">
              {recurringBills.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  <p>No active flows or monthly limits initialized.</p>
                </div>
              ) : (
                recurringBills.map((bill, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-850/40 text-xs">
                    <div>
                      <p className="font-semibold text-white truncate max-w-[140px]">{bill.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{bill.due}</p>
                    </div>
                    <span className={`font-bold ${bill.type === "income" ? "text-emerald-400" : "text-slate-300"}`}>
                      {bill.type === "income" ? "+" : ""}{formatVal(bill.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Receipt Scanner Simulator Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-indigo-400 animate-pulse">✨</span>
                AI Receipt Scanner
              </h3>
              <button
                onClick={() => {
                  setIsScannerOpen(false);
                  setIsScanning(false);
                }}
                className="text-slate-400 hover:text-white transition duration-150 cursor-pointer"
                disabled={isScanning}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isScanning ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-violet-600/30 blur-[10px] animate-ping"></div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-indigo-500/40 relative">
                    {scanStep === 1 && "📄"}
                    {scanStep === 2 && "🔍"}
                    {scanStep === 3 && "⚡"}
                  </div>
                </div>

                <h4 className="text-lg font-bold text-white mb-2">
                  {scanStep === 1 && "Analyzing receipt metadata..."}
                  {scanStep === 2 && "Extracting merchant coordinates..."}
                  {scanStep === 3 && "Parsing totals and categories..."}
                </h4>
                <p className="text-xs text-slate-500 max-w-[280px]">
                  {selectedReceipt
                    ? `Simulating scan of "${selectedReceipt.merchant}" for ${formatVal(selectedReceipt.amount)}...`
                    : "Extracting transaction from uploaded image..."}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="border-2 border-dashed border-slate-800 hover:border-violet-500/50 rounded-2xl p-6 text-center transition duration-200 cursor-pointer relative bg-slate-950/20 group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUploadSimulation}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <svg className="w-10 h-10 text-slate-600 mx-auto mb-3 group-hover:text-violet-400 transition duration-150" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm font-semibold text-white">Upload Receipt Image</p>
                  <p className="text-xs text-slate-500 mt-1">Drag and drop or browse files to simulate scanning</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Choose a Test Receipt Template</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {SIMULATED_RECEIPTS.map((receipt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleTriggerSimulatedScan(receipt)}
                        className="p-3 text-left bg-slate-950 border border-slate-850 hover:border-slate-800 hover:bg-slate-900/60 rounded-xl transition duration-150 flex flex-col justify-between h-20 text-xs cursor-pointer"
                      >
                        <span className="font-semibold text-white truncate w-full">{receipt.merchant}</span>
                        <div className="flex justify-between items-center w-full mt-2">
                          <span className="text-[10px] text-slate-500">{receipt.category}</span>
                          <strong className="text-emerald-400">+${receipt.amount.toFixed(2)}</strong>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
