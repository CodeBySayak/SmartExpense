import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

export default function Help() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeTourStep, setActiveTourStep] = useState(0);

  const faqs = [
    {
      q: "Where is my financial data stored?",
      a: "All your data is stored locally in your browser using localStorage. The application does not upload your sensitive financial ledgers, investments, or budgets to any external server, ensuring 100% privacy and client-side custody."
    },
    {
      q: "How does the Rules Engine work?",
      a: "The Rules Engine listens to new manual transaction entries. Alert rules monitor category spending limits and trigger warnings when thresholds are crossed. Categorization rules check merchant keywords (like 'Uber') and automatically assign the target category."
    },
    {
      q: "How can I back up my dashboard information?",
      a: "Navigate to the Settings tab, under Vault Management. Click 'Export Backup Vault (JSON)' to download a local backup file. To restore, click 'Import Backup Vault (JSON)' and upload your saved file."
    },
    {
      q: "Can I manage debts using Snowball vs Avalanche?",
      a: "Yes! In the Debt Tracker tab, you can input your extra monthly payments. The simulator calculates the optimal payoffs under both strategies, showing interest savings and exact timelines."
    }
  ];

  const tourSteps = [
    {
      title: "🏠 Core Dashboard",
      desc: "Get an birds-eye summary of your finances, scan paper receipts using the AI receipt parser, and review your daily activity heatmap logs."
    },
    {
      title: "📊 Category Budgets",
      desc: "Assign monthly limits to specific expense categories, customize colored badges, and receive warnings before you exceed caps."
    },
    {
      title: "⚙️ Automated Rules",
      desc: "Set thresholds to alert you, and map recurring keywords to categories automatically during transactions entry."
    },
    {
      title: "🔌 Backups & Themes",
      desc: "Switch between 4 high-contrast gradients (Abyss, Sunset, Emerald, Nordic) and download or restore complete ledger archives."
    }
  ];

  const toggleFaq = (idx) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  const nextTour = () => {
    setActiveTourStep((prev) => (prev + 1) % tourSteps.length);
  };

  const prevTour = () => {
    setActiveTourStep((prev) => (prev - 1 + tourSteps.length) % tourSteps.length);
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Help Center</h1>
        <p className="text-slate-400 text-sm mt-1">Guided tutorials, keyboard shortcuts mapping, and frequently asked questions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Guided Tour Card */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between h-80 lg:h-auto">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-bold text-white">App Features Tour</h2>
              <span className="text-[10px] bg-violet-950/40 border border-violet-850 px-2 py-0.5 rounded text-violet-300 font-bold">
                Step {activeTourStep + 1} of {tourSteps.length}
              </span>
            </div>

            <div className="space-y-3 min-h-[120px] transition-all duration-300">
              <h3 className="text-sm font-extrabold text-white">{tourSteps[activeTourStep].title}</h3>
              <p className="text-xs text-slate-400 leading-normal">{tourSteps[activeTourStep].desc}</p>
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-slate-800/80 pt-4">
            <button
              onClick={prevTour}
              className="py-1.5 px-3 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-white rounded-lg text-xs transition cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={nextTour}
              className="py-1.5 px-3 bg-violet-605 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Next Step
            </button>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white">General Questions</h2>
          
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-slate-950/20 border border-slate-850/60 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 text-left flex justify-between items-center text-xs font-bold text-white hover:bg-slate-950/30 transition focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <span className="text-slate-500">{activeFaq === idx ? "▼" : "▶"}</span>
                </button>
                {activeFaq === idx && (
                  <div className="p-4 pt-0 border-t border-slate-900 text-xs text-slate-400 leading-normal">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white">Keyboard Shortcuts</h2>
          
          <div className="space-y-3">
            {[
              { keys: ["⌘", "K"], action: "Open Command Palette / Theme Swapper" },
              { keys: ["Esc"], action: "Close modals and dropdown windows" },
              { keys: ["Tab"], action: "Focus inputs and form fields" },
              { keys: ["Enter"], action: "Submit forms / confirm alerts logs" }
            ].map((sh, i) => (
              <div key={i} className="flex justify-between items-center bg-slate-950/20 p-3 rounded-xl border border-slate-850">
                <span className="text-xs font-semibold text-slate-350">{sh.action}</span>
                <div className="flex gap-1 select-none">
                  {sh.keys.map((k, idx) => (
                    <kbd key={idx} className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[10px] text-slate-400 font-sans font-bold shadow-sm">
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
