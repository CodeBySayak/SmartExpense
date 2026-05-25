import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";

export default function Reports() {
  const { user } = useAuth();

  const [transactions] = useState(() => {
    if (!user?.id) return [];
    const saved = localStorage.getItem(`transactions_${user.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [reportType, setReportType] = useState("spending");
  const [dateRange, setDateRange] = useState("month");
  const [filterCategory, setFilterCategory] = useState("all");

  // Generate report dynamically during render (derived state)
  const generatedReport = (() => {
    if (transactions.length === 0) return null;

    // Filter transactions by date range
    const now = new Date();
    const filteredByDate = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      const diffTime = Math.abs(now - txDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (dateRange === "month" && diffDays <= 30) return true;
      if (dateRange === "3months" && diffDays <= 90) return true;
      if (dateRange === "year" && diffDays <= 365) return true;
      if (dateRange === "all") return true;
      return false;
    });

    // Filter by category
    const filtered = filteredByDate.filter(tx => {
      if (filterCategory === "all") return true;
      return tx.category === filterCategory;
    });

    // Calculations
    const totalIncome = filtered.filter(t => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
    const totalSpent = filtered.filter(t => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);
    const netSavings = totalIncome - totalSpent;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    const highestExpense = filtered
      .filter(t => t.type === "expense")
      .sort((a, b) => b.amount - a.amount)[0];

    const categoryBreakdown = filtered.reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {});

    return {
      totalIncome,
      totalSpent,
      netSavings,
      savingsRate,
      highestExpense,
      categoryBreakdown,
      transactionsList: filtered
    };
  })();

  // CSV Exporter
  const handleExportCSV = () => {
    const list = generatedReport?.transactionsList || transactions;
    if (list.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Description,Category,Type,Payment Method,Amount,Notes\n";

    list.forEach(tx => {
      const row = [
        tx.date,
        `"${tx.description.replace(/"/g, '""')}"`,
        tx.category,
        tx.type,
        tx.method || "",
        tx.amount.toFixed(2),
        `"${(tx.notes || "").replace(/"/g, '""')}"`
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SmartExpense_Report_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Reports</h1>
        <p className="text-slate-400 text-sm mt-1">Compile custom sheets, export ledgers to CSV, and analyze cash flows.</p>
      </div>

      {/* Builder Filters */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Report Focus</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-slate-950/40 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
            >
              <option value="spending">Spending Breakdown</option>
              <option value="income">Income Analysis</option>
              <option value="networth">Cash Flow / Net Worth</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Time Window</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-slate-950/40 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
            >
              <option value="month">Current Month (30d)</option>
              <option value="3months">Last 3 Months (90d)</option>
              <option value="year">Year-to-Date (365d)</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Category Scope</label>
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

          <button
            onClick={handleExportCSV}
            disabled={!generatedReport}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition duration-200 shadow-md shadow-indigo-650/20 active:scale-[0.98] cursor-pointer"
          >
            📥 Export to CSV Sheet
          </button>
        </div>
      </div>

      {generatedReport ? (
        <div className="space-y-8">
          {/* Output Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl">
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Total Income Cashflow</span>
              <p className="text-xl font-extrabold text-white mt-2">${generatedReport.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl">
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Total Expenses Outflow</span>
              <p className="text-xl font-extrabold text-rose-400 mt-2">${generatedReport.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl">
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Net Savings Cashflow</span>
              <p className={`text-xl font-extrabold mt-2 ${generatedReport.netSavings >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                ${generatedReport.netSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl">
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Calculated Saving Rate</span>
              <p className="text-xl font-extrabold text-indigo-400 mt-2">{generatedReport.savingsRate.toFixed(1)}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Category summary bars */}
            <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Spending Distribution</h2>

              <div className="space-y-4">
                {Object.keys(generatedReport.categoryBreakdown).length === 0 ? (
                  <p className="text-slate-500 text-xs text-center py-10">No expenses recorded for this selection.</p>
                ) : (
                  Object.keys(generatedReport.categoryBreakdown).map(cat => {
                    const amt = generatedReport.categoryBreakdown[cat];
                    const maxAmt = Math.max(...Object.values(generatedReport.categoryBreakdown));
                    const pct = maxAmt > 0 ? (amt / maxAmt) * 105 : 0;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-350">{cat}</span>
                          <span className="font-bold text-white">${amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-violet-655 bg-gradient-to-r from-violet-600 to-indigo-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Deep report details */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Report Analytics</h2>
              
              <div className="space-y-4">
                <div className="bg-slate-950/20 p-4 rounded-xl border border-slate-850">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Highest Transaction</span>
                  {generatedReport.highestExpense ? (
                    <div className="mt-1 flex justify-between items-center">
                      <span className="text-xs font-semibold text-white truncate max-w-[130px]">{generatedReport.highestExpense.description}</span>
                      <strong className="text-rose-400 text-sm">${generatedReport.highestExpense.amount.toFixed(2)}</strong>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">-</span>
                  )}
                </div>

                <div className="bg-slate-950/20 p-4 rounded-xl border border-slate-850">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Transactions Count</span>
                  <span className="text-sm font-extrabold text-white block mt-1">{generatedReport.transactionsList.length} items logged</span>
                </div>

                <div className="bg-slate-955/20 bg-slate-950/20 p-4 rounded-xl border border-slate-850">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Audit Health Indicator</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${generatedReport.savingsRate >= 20 ? "bg-emerald-400" : generatedReport.savingsRate >= 0 ? "bg-amber-400" : "bg-rose-500"}`}></span>
                    <span className="text-xs font-semibold text-white">
                      {generatedReport.savingsRate >= 20 ? "Superb Savings Profile" : generatedReport.savingsRate >= 0 ? "Balanced Budget" : "Capital Drain Warning"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/10 border border-dashed border-slate-850 rounded-2xl">
          <p className="text-slate-500 text-sm">Waiting for transactions sync to compile report...</p>
        </div>
      )}
    </DashboardLayout>
  );
}
