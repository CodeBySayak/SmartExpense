/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from "react";

export default function TypewriterInsight({ totalIncome, totalExpenses, totalBalance, savingsRate }) {
  const [insightText, setInsightText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [insightList, setInsightList] = useState([]);
  const [activeInsightIndex, setActiveInsightIndex] = useState(0);
  const timerRef = useRef(null);

  // Generate dynamic contextual insights based on real user numbers
  useEffect(() => {
    const list = [
      `💡 AI Smart Tip: Your current savings rate is ${savingsRate.toFixed(1)}%. Financial experts recommend saving at least 20% of your total income monthly to build an emergency fund.`,
      `🚀 Cashflow Analysis: You have recorded ${totalIncome > 0 ? `$${totalIncome.toLocaleString()} of total earnings` : "no income sources yet"}. Try tracking all side-gigs and monthly dividends in the Income tab to keep a perfect cashflow ledger.`,
      `🎯 Smart Budgeting: You have consumed $${totalExpenses.toLocaleString()} in expenses. Consider categorizing non-essential expenses and capping them at 30% of your net balance.`,
    ];

    if (totalIncome > 0 && totalExpenses > totalIncome) {
      list.push(
        `⚠️ Warning: Your expenses ($${totalExpenses.toLocaleString()}) exceed your monthly income ($${totalIncome.toLocaleString()}). Scale back retail expenditures and subscription trials immediately!`
      );
    } else if (savingsRate >= 30) {
      list.push(
        `🏆 High Performer Status: Excellent discipline! Your active savings rate is ${savingsRate.toFixed(1)}%. You are in the top tier of smart expense management. Keep it up!`
      );
    } else {
      list.push(
        `💡 Wealth Builder Tip: Try setting a targeted savings goal of $500 for a designated 'Rainy Day Fund' in our Goals page, and automate savings of $50 each week.`
      );
    }

    setInsightList(list);
    setActiveInsightIndex(0);
    setInsightText("");
    setCurrentIndex(0);
  }, [totalIncome, totalExpenses, totalBalance, savingsRate]);

  // Handle character-by-character typing animation
  useEffect(() => {
    if (insightList.length === 0) return;
    
    const activeText = insightList[activeInsightIndex];
    if (currentIndex < activeText.length) {
      timerRef.current = setTimeout(() => {
        setInsightText((prev) => prev + activeText[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, 25);
    }

    return () => clearTimeout(timerRef.current);
  }, [currentIndex, activeInsightIndex, insightList]);

  const handleNextInsight = () => {
    clearTimeout(timerRef.current);
    const nextIdx = (activeInsightIndex + 1) % insightList.length;
    setActiveInsightIndex(nextIdx);
    setInsightText("");
    setCurrentIndex(0);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-full group border border-slate-800/80 bg-slate-900/30">
      {/* Decorative absolute glow */}
      <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-violet-500/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500"></span>
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400">AI Financial Insights</h3>
          </div>
          <button
            onClick={handleNextInsight}
            className="text-[10px] font-bold text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-950/60 border border-slate-850 hover:border-slate-800 transition duration-150 active:scale-95"
          >
            Next Advice ➔
          </button>
        </div>

        {/* Console-like Typewriter screen */}
        <div className="font-mono text-slate-300 text-xs leading-relaxed min-h-[90px] p-3.5 bg-slate-950/50 rounded-xl border border-slate-900/80 shadow-inner select-all selection:bg-violet-600/30">
          {insightText}
          <span className="inline-block w-1.5 h-3.5 bg-violet-400 ml-1 animate-pulse"></span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/40 flex justify-between items-center">
        <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Engine: smart-logic-v2</span>
        <span className="text-[9px] text-slate-500 font-semibold">{activeInsightIndex + 1} / {insightList.length}</span>
      </div>
    </div>
  );
}
