# Smart Expense System

A modern, full-stack personal finance application designed to track expenses, incomes, debts, investments, budgets, and shared spaces. With an intuitive, sleek UI and robust functionality, it allows users to deeply monitor their financial health and set smart automation rules.

## ✨ Features

- **Dashboard**: High-level overview of net worth, cash flow, and monthly summaries.
- **Transactions & Ledger**: Log one-off or recurring incomes and expenses.
- **Dynamic Budgets**: Set spending limits per category, track utilization, and create automation rules.
- **Investments Tracker**: Monitor your stock and crypto portfolio with real-time (mocked) tracking and asset allocation charts.
- **Debt Management**: Track loans, credit cards, and amortization progress.
- **Bills & Subscriptions**: Manage recurring monthly commitments and due dates on a calendar grid.
- **Goals & Savings**: Set savings targets, log deposits, and celebrate milestone achievements with confetti!
- **Shared Spaces**: Split bills with roommates or friends. Includes an optimized debt-settlement algorithm to minimize transaction flows.
- **Analytics**: Deep dive into spending trends and category breakdowns via visual charts.
- **User Authentication**: Secure JWT-based registration and login system.

## 🛠 Tech Stack

**Frontend**
- **React.js** (v19)
- **Vite** (v8)
- **React Router** for seamless SPA navigation
- **Tailwind CSS** (v4) for styling and glassmorphism UI
- **Axios** for API communication

**Backend**
- **Node.js & Express.js** for RESTful APIs
- **JSON File Storage** for lightweight database (users.json)
- **bcryptjs** for password hashing
- **jsonwebtoken (JWT)** for secure session handling

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### 1. Clone the Repository
```bash
git clone https://github.com/CodeBySayak/SmartExpense.git
cd SmartExpense
```

### 2. Setup the Backend
Navigate to the backend directory, install dependencies, and start the server.

```bash
cd backend
npm install

# Start the development server (runs on port 5001 by default)
npm run dev
```

> **Note:** The backend uses a local `users.json` file to store registered users.

### 3. Setup the Frontend
Open a new terminal window, navigate to the frontend directory, install dependencies, and start the Vite dev server.

```bash
cd frontend
npm install

# Start the frontend server (typically runs on port 5174)
npm run dev -- --port 5174
```

### 4. Access the App
Open your browser and navigate to `http://localhost:5174` (or whatever port Vite allocated). Register a new account to start with a clean slate and explore the dashboard!

## 💡 Usage Highlights
- **Clean Slate**: New users start with completely empty dashboards to personalize from scratch.
- **Split Optimizer**: In the "Shared Spaces" tab, the system will automatically calculate the most efficient way for group members to settle their debts.
- **Budget Rules**: Set "Limit Alerts" and "Auto-Categorize" rules inside the Budgets tab.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/CodeBySayak/SmartExpense/issues).

## 📝 License
This project is open-source and available under the [MIT License](LICENSE).
