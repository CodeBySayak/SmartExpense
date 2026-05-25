import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user } = useAuth();

  // Load preferences from localStorage or default
  const [profileName, setProfileName] = useState(user?.name || "User");
  const [profileEmail, setProfileEmail] = useState(user?.email || "user@example.com");

  const [currency, setCurrency] = useState(() => {
    if (!user?.id) return "USD";
    return localStorage.getItem(`currency_${user.id}`) || "USD";
  });

  const [notifications, setNotifications] = useState(() => {
    if (!user?.id) return { budgetAlerts: true, milestones: true, billReminders: true };
    const saved = localStorage.getItem(`notif_prefs_${user.id}`);
    return saved ? JSON.parse(saved) : { budgetAlerts: true, milestones: true, billReminders: true };
  });

  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem("expense_theme") || "midnight";
  });

  const [confirmClear, setConfirmClear] = useState(false);

  // Sync state changes
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`currency_${user.id}`, currency);
    }
  }, [currency, user?.id]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`notif_prefs_${user.id}`, JSON.stringify(notifications));
    }
  }, [notifications, user?.id]);

  // Sync theme class to document.body
  useEffect(() => {
    document.body.className = "";
    document.body.classList.add(`theme-${activeTheme}`);
  }, [activeTheme]);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (user?.id) {
      const storedUsers = localStorage.getItem("users");
      if (storedUsers) {
        const users = JSON.parse(storedUsers);
        const updated = users.map(u => u.id === user.id ? { ...u, name: profileName.trim(), email: profileEmail.trim() } : u);
        localStorage.setItem("users", JSON.stringify(updated));
      }
      // Also update active session user details
      const session = localStorage.getItem("session");
      if (session) {
        const sessionData = JSON.parse(session);
        sessionData.name = profileName.trim();
        sessionData.email = profileEmail.trim();
        localStorage.setItem("session", JSON.stringify(sessionData));
      }
      alert("Profile metadata updated successfully! Please reload to sync completely.");
      window.location.reload();
    }
  };

  const toggleNotif = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectTheme = (themeId) => {
    setActiveTheme(themeId);
    localStorage.setItem("expense_theme", themeId);
  };

  // Backup & Import Engine
  const handleExportBackup = () => {
    if (!user?.id) return;
    const backupKeys = [
      `expenses_${user.id}`,
      `income_${user.id}`,
      `goals_${user.id}`,
      `transactions_${user.id}`,
      `debts_${user.id}`,
      `bills_${user.id}`,
      `overall_budget_${user.id}`,
      `budget_rules_${user.id}`,
      `currency_${user.id}`,
      `notif_prefs_${user.id}`
    ];

    const data = {};
    backupKeys.forEach(k => {
      data[k] = localStorage.getItem(k);
    });

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `SmartExpense_VaultBackup_${user.name || "user"}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        Object.keys(data).forEach(key => {
          if (data[key] !== null) {
            localStorage.setItem(key, data[key]);
          }
        });
        alert("Backup archive imported successfully! Reloading vaults...");
        window.location.reload();
      } catch {
        alert("Failed to read files. Please ensure it is a valid SmartExpense backup archive.");
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    if (!user?.id) return;
    const backupKeys = [
      `expenses_${user.id}`,
      `income_${user.id}`,
      `goals_${user.id}`,
      `transactions_${user.id}`,
      `debts_${user.id}`,
      `bills_${user.id}`,
      `overall_budget_${user.id}`,
      `budget_rules_${user.id}`,
      `currency_${user.id}`,
      `notif_prefs_${user.id}`
    ];
    backupKeys.forEach(k => localStorage.removeItem(k));
    alert("Local registries wiped completely. Reloading dashboard...");
    window.location.reload();
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure profile criteria, backup archives, preferences, and aesthetics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Card */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
          <h2 className="text-base font-bold text-white mb-4">Profile Credentials</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Display Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Email Address</label>
              <input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-violet-650 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs transition duration-200 active:scale-[0.98] cursor-pointer"
            >
              Update Credentials
            </button>
          </form>
        </div>

        {/* System Options & Notification Toggles */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-white mb-4">Preferences</h2>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Global Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
              >
                <option value="USD">USD ($) - United States Dollar</option>
                <option value="EUR">EUR (€) - Euro Currency</option>
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="GBP">GBP (£) - British Pound Sterling</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alert Subscriptions</h3>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-300">Over-Budget Caps Warnings</span>
              <button
                onClick={() => toggleNotif("budgetAlerts")}
                className={`w-9 h-5 rounded-full p-0.5 transition duration-200 focus:outline-none ${
                  notifications.budgetAlerts ? "bg-violet-600 flex justify-end" : "bg-slate-800 flex justify-start"
                }`}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow-md"></span>
              </button>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-300">Milestone Savings Confetti</span>
              <button
                onClick={() => toggleNotif("milestones")}
                className={`w-9 h-5 rounded-full p-0.5 transition duration-200 focus:outline-none ${
                  notifications.milestones ? "bg-violet-600 flex justify-end" : "bg-slate-800 flex justify-start"
                }`}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow-md"></span>
              </button>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-300">Bill Due Calendar Reminders</span>
              <button
                onClick={() => toggleNotif("billReminders")}
                className={`w-9 h-5 rounded-full p-0.5 transition duration-200 focus:outline-none ${
                  notifications.billReminders ? "bg-violet-600 flex justify-end" : "bg-slate-800 flex justify-start"
                }`}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow-md"></span>
              </button>
            </div>
          </div>
        </div>

        {/* Backups & Themes Panel */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-base font-bold text-white mb-4">Vault Management & Themes</h2>

          {/* Theme selection grid */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400">Active Theme Preset</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "midnight", name: "Midnight Abyss", colors: "from-slate-950 to-indigo-950" },
                { id: "sunset", name: "Sunset Glow", colors: "from-purple-900 to-pink-650 to-pink-600" },
                { id: "emerald", name: "Emerald Forest", colors: "from-emerald-950 to-teal-900" },
                { id: "nordic", name: "Nordic Frost", colors: "from-slate-900 to-blue-800" }
              ].map(th => (
                <button
                  key={th.id}
                  onClick={() => handleSelectTheme(th.id)}
                  className={`p-2.5 rounded-xl border text-[10px] font-bold text-left bg-gradient-to-br ${th.colors} transition ${
                    activeTheme === th.id ? "border-white" : "border-slate-850 opacity-70 hover:opacity-100"
                  }`}
                >
                  {th.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Backup Controls</h3>
            
            <button
              onClick={handleExportBackup}
              className="w-full py-2 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
            >
              📤 Export Backup Vault (JSON)
            </button>

            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <button
                type="button"
                className="w-full py-2 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-350 hover:text-white rounded-xl text-xs font-semibold transition"
              >
                📥 Import Backup Vault (JSON)
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            {!confirmClear ? (
              <button
                onClick={() => setConfirmClear(true)}
                className="w-full py-2 bg-rose-950/20 border border-rose-900/30 text-rose-400 hover:bg-rose-950/40 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                ⚠️ Purge All Vault Records
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleClearAllData}
                  className="flex-1 py-2 bg-rose-650 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-500 transition cursor-pointer"
                >
                  Yes, Wipe Everything
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-3 bg-slate-950 border border-slate-850 text-slate-400 hover:text-white rounded-xl text-xs transition"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
