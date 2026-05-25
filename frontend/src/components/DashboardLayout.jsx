/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CommandPalette from "./ui/CommandPalette";

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(localStorage.getItem("sidebar_collapsed") === "true");

  // Theme state system
  const [activeTheme, setActiveTheme] = useState(localStorage.getItem("expense_theme") || "midnight");

  // Command Palette states
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Apply theme class to document body
  useEffect(() => {
    // Clean old theme classes
    document.body.className = "";
    document.body.classList.add(`theme-${activeTheme}`);
    localStorage.setItem("expense_theme", activeTheme);
  }, [activeTheme]);

  // Command Palette global hotkey (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync / calculate dynamic notifications
  useEffect(() => {
    if (user?.id) {
      const list = [];
      
      // 1. Budget Alerts
      const savedExpenses = localStorage.getItem(`expenses_${user.id}`);
      if (savedExpenses) {
        const expenses = JSON.parse(savedExpenses);
        expenses.forEach((cat) => {
          if (cat.spent >= cat.budget) {
            list.push({
              id: `warning-over-${cat.name}`,
              type: "warning",
              title: "⚠️ Over Budget Cap!",
              message: `You've spent $${cat.spent.toLocaleString()} on ${cat.name}, exceeding your $${cat.budget.toLocaleString()} limit.`,
              time: "Just Now",
            });
          } else if (cat.spent >= cat.budget * 0.8) {
            list.push({
              id: `warning-near-${cat.name}`,
              type: "warning",
              title: "⚠️ Nearing Budget Cap",
              message: `${cat.name} budget is at ${Math.round((cat.spent / cat.budget) * 100)}% capacity.`,
              time: "Just Now",
            });
          }
        });
      }

      // 2. Savings Goals completed
      const savedGoals = localStorage.getItem(`goals_${user.id}`);
      if (savedGoals) {
        const goals = JSON.parse(savedGoals);
        goals.forEach((goal) => {
          if (goal.saved >= goal.target) {
            list.push({
              id: `goal-met-${goal.name}`,
              type: "success",
              title: "🏆 Savings Target Achieved!",
              message: `Outstanding! You reached 100% of your target ($${goal.target.toLocaleString()}) for ${goal.name}.`,
              time: "Today",
            });
          }
        });
      }

      // 3. Welcome system logs
      list.push({
        id: "sys-auth",
        type: "info",
        title: "🛡️ Secured Vault Active",
        message: "Your sessions are locally encrypted and protected.",
        time: "1 hour ago",
      });

      setNotifications(list);
      setUnreadCount(list.length);
    }
  }, [user?.id, location.pathname]);

  // Seeding Developer demo mock data
  const seedMockData = () => {
    if (!user?.id) return;
    
    // Seed Expenses
    const demoExpenses = [
      { name: "Rent & Utility", budget: 1600, spent: 1600, color: "bg-violet-600" },
      { name: "Groceries", budget: 500, spent: 395, color: "bg-indigo-600" },
      { name: "Organic Dining Out", budget: 350, spent: 362, color: "bg-orange-600" },
      { name: "Fast Transport & Gas", budget: 250, spent: 124, color: "bg-teal-600" },
      { name: "Premium Subscriptions", budget: 150, spent: 139, color: "bg-pink-600" },
    ];
    localStorage.setItem(`expenses_${user.id}`, JSON.stringify(demoExpenses));

    // Seed Income
    const demoIncome = [
      { name: "Tech Salary", amount: 5200, date: "May 1, 2026", isRecurring: true },
      { name: "Consulting Gig", amount: 1250, date: "May 18, 2026", isRecurring: false },
      { name: "Equity Dividends", amount: 300, date: "May 25, 2026", isRecurring: true },
    ];
    localStorage.setItem(`income_${user.id}`, JSON.stringify(demoIncome));

    // Seed Goals
    const demoGoals = [
      { name: "New Apple Silicon Studio", target: 3500, saved: 3500, deadline: "July 2026", createdAt: new Date().toISOString() },
      { name: "Europe Summer Cruise", target: 7500, saved: 4800, deadline: "August 2026", createdAt: new Date().toISOString() },
      { name: "Emergency Buffer", target: 5000, saved: 2200, deadline: "Dec 2026", createdAt: new Date().toISOString() },
    ];
    localStorage.setItem(`goals_${user.id}`, JSON.stringify(demoGoals));

    window.location.reload();
  };

  const sidebarSections = [
    {
      title: "Overview",
      items: [
        {
          name: "Dashboard",
          path: "/dashboard",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
          ),
        }
      ]
    },
    {
      title: "Finance",
      items: [
        {
          name: "Expenses",
          path: "/expenses",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
        {
          name: "Income",
          path: "/income",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
        {
          name: "Budgets",
          path: "/budgets",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          ),
        },
        {
          name: "Transactions",
          path: "/transactions",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
            </svg>
          ),
        }
      ]
    },
    {
      title: "Wealth",
      items: [
        {
          name: "Investments",
          path: "/investments",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          ),
        },
        {
          name: "Debts",
          path: "/debts",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        }
      ]
    },
    {
      title: "Planning",
      items: [
        {
          name: "Goals",
          path: "/goals",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
        {
          name: "Shared Spaces",
          path: "/groups",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
        {
          name: "Bills & Subs",
          path: "/bills",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
        }
      ]
    },
    {
      title: "Reports",
      items: [
        {
          name: "Analytics",
          path: "/analytics",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
        },
        {
          name: "Reports",
          path: "/reports",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
        }
      ]
    },
    {
      title: "System",
      items: [
        {
          name: "Settings",
          path: "/settings",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
        {
          name: "Help Center",
          path: "/help",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        }
      ]
    }
  ];

  const toggleCollapse = () => {
    const nextVal = !isCollapsed;
    setIsCollapsed(nextVal);
    localStorage.setItem("sidebar_collapsed", nextVal.toString());
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col md:flex-row font-sans relative overflow-hidden transition-all duration-1000">
      {/* Command Palette search portal */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onThemeChange={(themeName) => setActiveTheme(themeName)}
        onTriggerMockData={seedMockData}
        onTriggerScanner={() => {
          if (location.pathname !== "/dashboard") {
            navigate("/dashboard");
          }
          setTimeout(() => {
            const scannerBtn = document.getElementById("ai-scanner-trigger-btn");
            scannerBtn?.click();
          }, 300);
        }}
      />

      {/* Mobile Top Navbar */}
      <header className="md:hidden bg-slate-900/80 border-b border-slate-800 backdrop-blur-lg flex items-center justify-between p-4 sticky top-0 z-30 w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white font-bold text-base shadow-md">
            $
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">
            SmartExpense
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Notification bell on mobile */}
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg border border-slate-800 hover:bg-slate-800/40 relative"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            )}
          </button>
          
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg border border-slate-800 hover:bg-slate-800/40"
            title="Open Menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay Background */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-35 md:hidden"
        ></div>
      )}

      {/* Sidebar navigation */}
      <aside
        className={`bg-slate-900 border-r border-slate-800/80 md:bg-slate-900/20 backdrop-blur-xl flex flex-col justify-between shrink-0 fixed md:static inset-y-0 left-0 z-40 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 ${
          isCollapsed ? "md:w-20" : "md:w-66"
        } w-64 transition-all duration-300 ease-out`}
      >
        <div className="overflow-y-auto max-h-[calc(100vh-140px)] select-none">
          {/* Logo / Brand Header */}
          <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/20 shrink-0">
                $
              </div>
              {!isCollapsed && (
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  SmartExpense
                </span>
              )}
            </div>
            {/* Desktop Collapse Arrow */}
            <button
              onClick={toggleCollapse}
              className="hidden md:flex p-1.5 text-slate-400 hover:text-white rounded-lg border border-slate-800 hover:bg-slate-800/40 transition duration-150"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <svg className={`w-4.5 h-4.5 transition-transform duration-350 ${isCollapsed ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            {/* Mobile Close Button inside sidebar */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg border border-slate-800 hover:bg-slate-800/40 transition duration-150"
              title="Close Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-3">
            {sidebarSections.map((section) => (
              <div key={section.title} className="space-y-1">
                {!isCollapsed ? (
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 pt-3 pb-1">
                    {section.title}
                  </div>
                ) : (
                  <div className="h-0.5 bg-slate-800/40 my-3 mx-2 rounded"></div>
                )}
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)} // Close sidebar on nav click (mobile)
                      className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                          : "text-slate-400 hover:bg-slate-850/50 hover:text-white"
                      } ${isCollapsed ? "justify-center" : ""}`}
                      title={isCollapsed ? item.name : ""}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* User profile & Dev Shortcuts */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-950/20 space-y-3 shrink-0">
          {/* Quick seed shortcut */}
          <button
            onClick={seedMockData}
            className={`flex items-center justify-center gap-2 rounded-lg border border-dashed border-violet-850 hover:border-violet-500 text-violet-300 hover:text-white font-bold bg-violet-950/10 hover:bg-violet-950/30 transition duration-150 ${
              isCollapsed ? "p-2 w-10 mx-auto text-xs" : "w-full py-1.5 px-3 text-[10px]"
            }`}
            title="Seed Demo Mock Data"
          >
            <span>🔌</span>
            {!isCollapsed && <span className="truncate">Seed Demo Mock Data</span>}
          </button>

          <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : "px-2"}`}>
            <div className="w-9 h-9 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center font-bold text-violet-300 uppercase shadow-inner shrink-0">
              {user?.name?.[0] || "U"}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{user?.name || "User"}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email || ""}</p>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className={`flex items-center justify-center gap-2 rounded-xl border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 font-medium transition duration-200 ${
              isCollapsed ? "p-2.5 w-10 mx-auto" : "w-full py-2.5 px-4 text-sm"
            }`}
            title="Sign Out"
          >
            <svg className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!isCollapsed && <span className="truncate">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto relative h-screen">
        {/* Background ambient spheres */}
        <div className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none animate-pulse-glow"></div>
        <div className="absolute bottom-0 left-1/3 w-[350px] h-[350px] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none animate-pulse-glow" style={{ animationDelay: "2s" }}></div>

        <div className="relative z-10 max-w-6xl mx-auto space-y-6">
          {/* STATE-OF-THE-ART TOPBAR BAR HEADER */}
          <div className="flex items-center justify-between gap-4 border-b border-slate-800/40 pb-4">
            {/* Quick Command shortcut launcher banner */}
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="flex items-center gap-2.5 px-4 py-2 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-850 hover:border-slate-800 rounded-xl transition duration-150 text-slate-400 text-xs font-semibold max-w-xs w-full shadow-inner select-none cursor-pointer group"
            >
              <svg className="w-4.5 h-4.5 text-slate-500 group-hover:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="flex-1 text-left">Search actions...</span>
              <kbd className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-500 font-sans">
                ⌘K
              </kbd>
            </button>

            {/* Right side controls: Theme Switcher dropdown + Notifications Bell */}
            <div className="flex items-center gap-4 relative">
              
              {/* LINEAR GRADIENT THEME SWITCHER */}
              <div className="flex items-center bg-slate-900/40 border border-slate-850 rounded-xl p-1 shadow-inner gap-1">
                {[
                  { id: "midnight", name: "Midnight Abyss", colors: "from-slate-950 to-indigo-950" },
                  { id: "sunset", name: "Sunset Glow", colors: "from-purple-900 to-pink-600" },
                  { id: "emerald", name: "Emerald Forest", colors: "from-emerald-950 to-teal-900" },
                  { id: "nordic", name: "Nordic Frost", colors: "from-slate-900 to-blue-800" },
                ].map((th) => (
                  <button
                    key={th.id}
                    onClick={() => setActiveTheme(th.id)}
                    className={`w-5.5 h-5.5 rounded-lg bg-gradient-to-br ${th.colors} border transition-all duration-150 hover:scale-110 active:scale-95 ${
                      activeTheme === th.id
                        ? "border-white shadow-md shadow-white/10"
                        : "border-slate-850 opacity-60 hover:opacity-100"
                    }`}
                    title={th.name}
                  />
                ))}
              </div>

              {/* LIVE NOTIFICATION CENTER DRAWER BELL */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsNotifOpen(!isNotifOpen);
                    setUnreadCount(0); // clear count on open
                  }}
                  className={`p-2.5 rounded-xl border transition-all duration-150 relative ${
                    isNotifOpen
                      ? "bg-violet-600/10 border-violet-500 text-white shadow-lg"
                      : "bg-slate-900/40 border-slate-850 text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                  title="Notifications Log"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping-glow">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Panel Overlay */}
                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)}></div>
                    <div className="absolute right-0 mt-3 w-80 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
                        <span className="font-bold text-xs text-white">Recent Activity & Alerts</span>
                        <button
                          onClick={() => setNotifications([])}
                          className="text-[10px] text-slate-500 hover:text-slate-300 font-semibold"
                        >
                          Clear All
                        </button>
                      </div>

                      <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-850">
                        {notifications.length === 0 ? (
                          <div className="text-center py-10 text-xs text-slate-500">
                            No alerts or events logged yet
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div key={notif.id} className="p-3.5 text-xs hover:bg-slate-950/20 transition duration-150">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className={`font-bold ${
                                  notif.type === "warning" ? "text-rose-400" : notif.type === "success" ? "text-emerald-400" : "text-violet-400"
                                }`}>
                                  {notif.title}
                                </span>
                                <span className="text-[9px] text-slate-500">{notif.time}</span>
                              </div>
                              <p className="text-slate-400 leading-normal">{notif.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                      
                      <div className="p-2.5 border-t border-slate-800/60 bg-slate-950/30 text-center">
                        <span className="text-[9px] text-slate-500 font-semibold tracking-wide uppercase">Real-time Smart Ledgers</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

            </div>
          </div>

          <div className="relative z-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
