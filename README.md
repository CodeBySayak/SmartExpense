# Smart Expense System

A premium, feature-rich client-side personal finance manager and smart expense tracking platform. Built with a stunning dark-mode glassmorphic user interface, ambient glow animations, and interactive financial widgets.

This application provides a highly secure and private way to manage your personal finances. While user authentication and accounts are verified securely through a lightweight JWT backend, all sensitive financial records, budgets, and investments are kept **100% private**—stored client-side in the user's browser using `localStorage`.

---

## 🎨 Visual Design & Themes

The application features a modern, ultra-premium developer-centric dashboard designed to wow at first sight:
- **Glassmorphism Design**: Frosted glass-panel containers with custom blur effects (`backdrop-filter`) and thin, elegant borders.
- **Harmonious Color Palettes**: Clean dark-mode background defaults accented by vibrant, tailwind-curated tones.
- **Dynamic Accent Themes**: Switch between 4 premium themes in real-time under settings:
  - **Midnight (Default)**: Deep blue/violet space-age dashboard.
  - **Sunset**: Rich magenta, warm purple, and dark orange tones.
  - **Emerald**: Clean, refreshing deep forest-green and mint gradients.
  - **Nordic**: Sleek icy blue and slate-grey tones.
- **Ambient Micro-Animations**: Smooth floating transitions, animated background gradient shifting (`gradientShift`), and pulse-glow indicators for budgets and limits.
- **Interactive Component States**: Smooth scaling, shadow highlights, and instant interactive feedback (e.g. contribution heatmap scaling on hover).

---

## ⚡ Core Features

### 📊 1. Comprehensive Financial Dashboards
- Multi-dimensional summary panels for **Net Balance**, **Monthly Savings**, and **Active Budget Health**.
- Detailed activity feeds displaying recent transactions with category icons.
- Interactive interactive contribution heatmaps (similar to GitHub's commit graphs) visualizing spending habits over the course of the year.

### 🔐 2. Secure User Authentication
- Complete JWT-based registration and login flows.
- Backend encryption using `bcryptjs` with 12-round hashing salts.
- Client session persistence using secure token tokens.

### 💸 3. Expense & Income Ledger
- Complete transaction log with description, amount, date, payment method, and categories.
- Advanced filtering options (by category, date range, or payment type) and real-time search.
- Quick-add interface from any dashboard screen.

### 🛡️ 4. Active Budget Guard
- Set maximum spending limits per category (e.g. Food, Transport, Utilities, Entertainment).
- Interactive visual progress meters showing how much of each budget has been consumed.
- Dynamic color changes (turning warning orange or critical red) and alerts when limits are approached.

### 📅 5. Subscription & Bill Manager
- Log active recurring bills, services, and monthly subscriptions.
- Visual timeline displaying next bill due dates, active status, and monthly recurring totals.

### 🎯 6. Savings Goals (Milestones)
- Set target savings targets (e.g., "Emergency Fund", "New Laptop").
- Track current contributions with interactive percentage meters.
- Celebratory visual confetti trigger upon reaching goal completion.

### 📈 7. Investments & Net Worth Tracking
- Track assets and investment portfolios (Stocks, Crypto, Gold, Real Estate).
- Calculate total asset value, historical gains, and overall net worth progress.

### 🤝 8. Group Bill Splitting
- Create groups (e.g., "Flatmates", "Trip to Goa").
- Log group expenses, select who paid, and choose to split equally or unequally among members.
- Auto-calculate balances showing exactly who owes whom.

### 📤 9. Data Portability (Backup & Restore)
- Export all your financial ledgers, budgets, settings, and goals into a clean JSON file.
- Import data backups to seamlessly transition between devices or web browsers.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 (Vite-powered environment)
- **Styling**: Tailwind CSS v4
- **Routing**: React Router DOM (v7)
- **Interactions**: Custom CSS keyframe animations, React Canvas Confetti for goal celebrations.

### Backend
- **Runtime**: Node.js & Express
- **Auth & Security**: JSON Web Tokens (JWT), `bcryptjs`
- **Database**: Local JSON database file (`users.json`) ideal for lightweight local deployment and testing.

---

## 📂 Project Structure

```bash
Smart_Expense_System/
├── package.json               # Root scripts to run backend & frontend concurrently
├── backend/                   # Node.js backend
│   ├── server.js              # Express app, auth routes, and JSON DB utilities
│   ├── users.json             # Persistent local JSON user storage (git-ignored)
│   └── package.json           # Backend dependencies and scripts
└── frontend/                  # Vite + React frontend
    ├── vite.config.js         # Port settings and API proxy rules
    ├── package.json           # Frontend dependencies and dev servers
    ├── index.html             # Entry point template
    └── src/
        ├── index.css          # Core design system (glassmorphism, variables, themes)
        ├── main.jsx           # React app mount
        ├── App.jsx            # Routing and global layout container
        ├── components/        # Layout and reusable UI components
        ├── context/           # React Context (Auth states, app configuration)
        └── pages/             # Application views (Dashboard, Expenses, Analytics, etc.)
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or later recommended)
- `npm` (packaged with Node.js)

### Installation
Clone the repository and install all dependencies for both the frontend and backend using the root helper script:

```bash
# Install dependencies for both frontend and backend
npm run install:all
```

### Running the Application

You can start both servers concurrently with a single command from the root folder:

```bash
# Starts Node backend on http://localhost:5001 & Vite frontend on http://127.0.0.1:5173
npm run dev
```

*The frontend proxy is preconfigured to route any requests directed at `/api/*` directly to the backend server at port `5001`.*

---

## 🔒 Privacy Notice
Your financial privacy is our priority. Since all transactional and ledger records are stored locally in your browser's `localStorage` storage container, **no financial data is ever sent to or saved on the backend server**. The backend database solely handles encrypted user authentication login sessions.
