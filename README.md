# ExpenseX — Smart Personal Finance Tracker 💰

ExpenseX is a modern, responsive, full-stack personal finance tracking application designed to help individuals effortlessly track their income, monitor expenses, visualize spending habits, and manage monthly budgets.

---

## 🛠️ Technology Stack

- **Frontend (`client/`)**:
  - React 18
  - Vite
  - React Router v6
  - Tailwind CSS
  - Lucide React (Icons)
  - Recharts (Interactive Financial Visualizations)
  - Axios (HTTP Client)

- **Backend (`server/`)**:
  - Node.js (ES Modules)
  - Express.js
  - MongoDB Atlas & Mongoose
  - JSON Web Tokens (JWT) & Google Auth Library
  - Morgan & CORS

---

## 📁 Directory Structure

```text
Personal Finance Tracker/
├── client/                     # React + Vite Frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/         # Reusable UI cards, forms, charts
│   │   ├── pages/              # Dashboard, Transactions, Budgets, Reports
│   │   ├── services/           # Axios API configuration & endpoints
│   │   ├── App.jsx             # Main application component
│   │   ├── index.css           # Tailwind base styles & glassmorphism
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Node.js + Express Backend
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js           # Mongoose MongoDB connection
│   │   ├── controllers/        # Request handlers
│   │   ├── middleware/         # Auth & error handling
│   │   ├── models/             # User, Transaction, Budget schemas
│   │   ├── routes/             # Health, Auth, Transaction, Budget routes
│   │   └── server.js           # Express app & server lifecycle
│   ├── .env.example
│   └── package.json
│
├── .gitignore
├── package.json                # Unified workspace scripts
└── README.md
```

---

## 🚀 Quick Start (Stage 1: Foundation)

### 1. Install Dependencies
In the root directory, run:
```bash
npm run install:all
```
*(Or navigate to `client/` and `server/` respectively and run `npm install`)*

### 2. Configure Environment
- In `server/`, inspect `.env` (or copy from `.env.example`).
- Add your **MongoDB Atlas Connection URI**:
  ```env
  MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/expensex?retryWrites=true&w=majority
  ```

### 3. Run Development Servers
- **Backend API**:
  ```bash
  npm run dev:server
  ```
  Runs at: `http://localhost:5000` (Health Check: `http://localhost:5000/api/health`)

- **Frontend Client**:
  ```bash
  npm run dev:client
  ```
  Runs at: `http://localhost:5173`

---

## 🗺️ Project Roadmap
- ✅ **Stage 1: Foundation Setup** (React + Vite, Node + Express, MongoDB Atlas connection handling, health checks)
- ⏳ **Stage 2: Google Authentication** (Google Cloud OAuth, JWT session, User model, Protected routes)
- ⏳ **Stage 3: Transaction Engine** (Income & Expense CRUD, categories, payment methods, Mongoose models)
- ⏳ **Stage 4: Dashboard & Analytics** (Live balance calculations, Recharts spending breakdown)
- ⏳ **Stage 5: Budgets & Reports** (Monthly budget targets, threshold alerts, date range reports)
- ⏳ **Stage 6: Polish & Deployment**
