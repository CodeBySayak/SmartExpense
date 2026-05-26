import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";

export default function Investments() {
  const { user } = useAuth();

  // Load investments from localStorage
  const [portfolio, setPortfolio] = useState(() => {
    if (!user?.id) return [];
    const saved = localStorage.getItem(`investments_${user.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Sync to localStorage
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`investments_${user.id}`, JSON.stringify(portfolio));
    }
  }, [portfolio, user?.id]);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [category, setCategory] = useState("Stocks");
  const [shares, setShares] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");

  // Quick edit state for price update
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState("");

  // Portfolio calculations
  const totalCostBasis = portfolio.reduce((sum, item) => sum + (item.shares * item.buyPrice), 0);
  const totalCurrentValue = portfolio.reduce((sum, item) => sum + (item.shares * item.currentPrice), 0);
  const totalGainLoss = totalCurrentValue - totalCostBasis;
  const totalGainLossPct = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;

  // Breakdown calculations for donut chart
  const breakdown = portfolio.reduce((acc, item) => {
    const val = item.shares * item.currentPrice;
    acc[item.category] = (acc[item.category] || 0) + val;
    return acc;
  }, {});

  const categories = Object.keys(breakdown);
  const totalValue = Object.values(breakdown).reduce((a, b) => a + b, 0);

  const colors = {
    Stocks: "bg-blue-500",
    Crypto: "bg-orange-500",
    "Mutual Funds": "bg-violet-500",
    Bonds: "bg-emerald-500",
    Cash: "bg-teal-500"
  };

  const handleAddAsset = (e) => {
    e.preventDefault();
    if (!name || !symbol || !shares || !buyPrice) return;

    const parsedBuy = parseFloat(buyPrice) || 0;
    const newAsset = {
      id: Date.now().toString(),
      name: name.trim(),
      symbol: symbol.toUpperCase().trim(),
      category,
      shares: parseFloat(shares) || 0,
      buyPrice: parsedBuy,
      currentPrice: parseFloat(currentPrice) || parsedBuy
    };

    setPortfolio([...portfolio, newAsset]);

    // Reset Form
    setName("");
    setSymbol("");
    setShares("");
    setBuyPrice("");
    setCurrentPrice("");
    setIsModalOpen(false);
  };

  const handleDeleteAsset = (id) => {
    setPortfolio(portfolio.filter(item => item.id !== id));
  };

  const handleUpdatePrice = (id) => {
    setPortfolio(portfolio.map(item => {
      if (item.id === id) {
        return { ...item, currentPrice: parseFloat(editPrice) || item.currentPrice };
      }
      return item;
    }));
    setEditingId(null);
    setEditPrice("");
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Investments</h1>
          <p className="text-slate-400 text-sm mt-1">Monitor real-time value and allocation metrics of your investment portfolio.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="self-start py-2.5 px-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm transition duration-200 shadow-md shadow-indigo-600/20 active:scale-[0.98]"
        >
          + Add Investment
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Portfolio Net Worth</span>
          <span className="text-3xl font-extrabold text-white my-3">${totalCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="text-[10px] text-slate-400">Total investment value</span>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Cost Basis</span>
          <span className="text-3xl font-extrabold text-slate-300 my-3">${totalCostBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="text-[10px] text-slate-400">Capital invested</span>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">All-Time Returns</span>
          <span className={`text-3xl font-extrabold my-3 ${totalGainLoss >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
            {totalGainLoss >= 0 ? "+" : ""}${totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={`text-xs font-semibold ${totalGainLoss >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {totalGainLoss >= 0 ? "▲" : "▼"} {totalGainLossPct.toFixed(2)}% Return
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Asset Table */}
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white">Holdings Details</h2>

          {portfolio.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">No assets in portfolio yet. Click "+ Add Investment" to add one.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800 uppercase text-[9px] font-bold tracking-wider">
                    <th className="pb-3">Asset</th>
                    <th className="pb-3">Shares</th>
                    <th className="pb-3">Buy Price</th>
                    <th className="pb-3">Current Price</th>
                    <th className="pb-3 text-right">Market Value</th>
                    <th className="pb-3 text-right">Gain / Loss</th>
                    <th className="pb-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60">
                  {portfolio.map(asset => {
                    const cost = asset.shares * asset.buyPrice;
                    const value = asset.shares * asset.currentPrice;
                    const profit = value - cost;
                    const profitPct = cost > 0 ? (profit / cost) * 100 : 0;

                    return (
                      <tr key={asset.id} className="hover:bg-slate-950/10">
                        <td className="py-3">
                          <div>
                            <span className="font-bold text-white">{asset.symbol}</span>
                            <span className="block text-[10px] text-slate-500">{asset.name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-slate-300 font-semibold">{asset.shares}</td>
                        <td className="py-3 text-slate-400">${asset.buyPrice.toFixed(2)}</td>
                        <td className="py-3">
                          {editingId === asset.id ? (
                            <div className="flex gap-2">
                              <input
                                type="number"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                className="w-16 bg-slate-950 border border-slate-800 rounded px-1 text-xs text-white"
                              />
                              <button onClick={() => handleUpdatePrice(asset.id)} className="text-[10px] text-emerald-400 hover:text-emerald-300">✓</button>
                              <button onClick={() => setEditingId(null)} className="text-[10px] text-rose-400 hover:text-rose-300">✗</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 group">
                              <span className="text-slate-300">${asset.currentPrice.toFixed(2)}</span>
                              <button 
                                onClick={() => { setEditingId(asset.id); setEditPrice(asset.currentPrice); }}
                                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white text-[9px] transition"
                              >
                                ✏️
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="py-3 text-right font-bold text-slate-200">${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className={`py-3 text-right font-bold ${profit >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                          ${profit.toFixed(0)} <span className="text-[9px] font-semibold">({profitPct.toFixed(0)}%)</span>
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => handleDeleteAsset(asset.id)}
                            className="text-slate-500 hover:text-red-400 p-1 transition"
                            title="Remove Asset"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Asset Allocation Chart Card */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-6">Asset Allocation</h2>
            
            {portfolio.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-10">No allocation data.</p>
            ) : (
              <div className="space-y-6">
                {/* SVG Visual allocation bar */}
                <div className="h-6 w-full rounded-full bg-slate-950 overflow-hidden flex shadow-inner">
                  {categories.map(cat => {
                    const pct = totalValue > 0 ? (breakdown[cat] / totalValue) * 100 : 0;
                    return (
                      <div
                        key={cat}
                        className={`h-full ${colors[cat] || "bg-slate-500"} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                        title={`${cat}: ${pct.toFixed(1)}%`}
                      ></div>
                    );
                  })}
                </div>

                <div className="space-y-3">
                  {categories.map(cat => {
                    const amt = breakdown[cat];
                    const pct = totalValue > 0 ? (amt / totalValue) * 100 : 0;
                    const colClass = colors[cat] || "bg-slate-500";
                    return (
                      <div key={cat} className="flex justify-between items-center bg-slate-950/20 p-3 rounded-xl border border-slate-850">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${colClass}`}></span>
                          <span className="text-xs font-semibold text-white">{cat}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-white">${amt.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          <span className="block text-[9px] text-slate-500">{pct.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Entry Asset Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-in zoom-in duration-150">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Add Asset</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddAsset} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Asset Class</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="Stocks">Stocks</option>
                    <option value="Crypto">Crypto</option>
                    <option value="Mutual Funds">Mutual Funds</option>
                    <option value="Bonds">Bonds</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Ticker Symbol</label>
                  <input
                    type="text"
                    placeholder="e.g. TSLA, ETH"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Asset Name</label>
                <input
                  type="text"
                  placeholder="e.g. Tesla Inc."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-1">
                  <label className="text-xs text-slate-400">Shares</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="0.0"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                    required
                  />
                </div>

                <div className="space-y-1 col-span-1">
                  <label className="text-xs text-slate-400">Buy Price</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.0"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                    required
                  />
                </div>

                <div className="space-y-1 col-span-1">
                  <label className="text-xs text-slate-400">Current</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Optional"
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition duration-150 mt-2 shadow-lg shadow-indigo-500/20"
              >
                Hold Position
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
