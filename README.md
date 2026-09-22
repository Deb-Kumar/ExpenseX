# ExpenseX 💰 — Smart Personal Finance & Expense Intelligence Platform

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas_%26_Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Recharts](https://img.shields.io/badge/Recharts-2.15-22c55e?style=flat-square&logo=chartdotjs&logoColor=white)](https://recharts.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)

> **ExpenseX** is an enterprise-grade, modern personal finance tracking and financial intelligence platform. Designed to eliminate manual bookkeeping friction, ExpenseX equips users with intuitive multi-channel cash flow tracking, dynamic category budgeting with threshold alerts, interactive Recharts visualizations, bank-grade re-authentication safeguards, and 1-click accounting statement exports in PDF and Excel formats.

---

## 📸 Key Features & Capabilities

### 📊 Real-Time Financial Intelligence & Analytics
- **Live Net Balance & KPI Overview:** Instant calculations for Net Balance, Monthly Inflows, Monthly Outflows, and Savings Rate.
- **Dynamic Cash Flow Visualizations:** Monthly income vs. expense comparison bar charts and category distribution donut charts powered by **Recharts**.
- **Chronological Transaction Ledger:** Live activity feed with quick-action transaction modals, search indexing, and real-time updates.

### 💳 Smart Multi-Channel Transaction Engine
- **Income & Expense Tracking:** Clear classification across essential expense categories (*Food, Transport, Shopping, Bills, Entertainment, Health, Education, Travel, etc.*) and income sources (*Salary, Freelance, Business, Investments, Gifts*).
- **Payment Method Association:** Track transactions across **UPI**, **Debit/Credit Cards**, **Cash**, and **Net Banking**.
- **Advanced Querying & Filtering:** Filter seamlessly by transaction type (`All`, `Income`, `Expense`), category, payment mode, or date ranges (`startDate` to `endDate`).

### 🎯 Proactive Monthly Budgets & Warning Thresholds
- **Category-Level Limits:** Set customizable spending caps per category for any selected month and year.
- **Visual Progress & Threshold Alerts:** Real-time calculation of expense allocations:
  - 🟢 **Safe:** `< 80%` budget consumed.
  - 🟡 **Warning:** `80% – 100%` budget consumed.
  - 🔴 **Exceeded:** `> 100%` budget exceeded with visual badges and optional email alerts.

### 📑 Comprehensive Statement Reports & 1-Click Exports
- **Date-Range Statements:** Select arbitrary reporting periods to evaluate total cash flow, savings rate percentages, and payment method distribution.
- **Professional PDF Generation:** Formatted statements with tables, dates, and category tags via `jspdf` and `jspdf-autotable`.
- **Excel Spreadsheet Export:** Instant accounting workbook generation via `xlsx` for external bookkeeping.

### 🛡️ Multi-Tier Security & Re-Authentication Safeguards
- **Dual Authentication:** Secure email/password login with JWT (HMAC-SHA256) plus seamless **Google OAuth 2.0** / Firebase authentication.
- **Re-Authentication Guardrails:** Deleting transactions or sensitive records requires active re-verification (password or OAuth confirmation modal) to prevent accidental or unauthorized data loss.
- **Master Password Prompting:** Enables OAuth users to configure an optional master password for critical security actions.
- **Two-Step Email Modification:** OTP verification via Nodemailer email service for email change requests.

### 👤 Profile Customization & Multi-Currency Support
- **Custom Currency Formatting:** Seamlessly toggle between **₹ INR**, **$ USD**, **€ EUR**, **£ GBP**, and **¥ JPY**.
- **Interactive Avatar Basket:** Choose from curated avatar packs (*Vehicles, Animals, Humans, Tech*) or supply custom profile image URLs.

---

## 🏗️ System Architecture

```text
┌──────────────────────────────────────────────────────────────────┐
│                   Client: React 18 + Vite                        │
│   Tailwind CSS • Recharts • Lucide React • jsPDF • SheetJS       │
└─────────────────▲───────────────────────────────▲────────────────┘
                  │                               │
        REST API (Axios + JWT)            Google / Firebase Auth
                  │                               │
┌─────────────────▼───────────────┐ ┌─────────────▼────────────────┐
│      Express 4 + Node.js        │ │       Third-Party Services   │
│  • Auth & User Management       │ │  • Google OAuth 2.0 API      │
│  • Transaction & Budget Engine  │ │  • Firebase Auth SDK         │
│  • Nodemailer SMTP Service      │ │  • Nodemailer SMTP Relay     │
└─────────────────▲───────────────┘ └──────────────────────────────┘
                  │
┌─────────────────▼───────────────┐
│     Database & Storage Layer    │
│  • Primary: MongoDB Atlas       │
│  • In-Memory Dev Store Fallback │
└─────────────────────────────────┘
```

---

## 📂 Project Structure

```text
ExpenseX/
├── backend/                      # Node.js + Express REST API
│   ├── config/                   # MongoDB Atlas connection (Mongoose)
│   ├── controllers/              # Business logic handlers (auth, transactions, budgets)
│   ├── middleware/               # JWT auth & error handling middleware
│   ├── models/                   # Mongoose Schemas (User, Transaction, Budget)
│   ├── routes/                   # API endpoint definitions
│   ├── services/                 # Email OTP, Google Auth & in-memory fallback
│   ├── .env                      # Backend environment variables
│   ├── .env.example              # Server environment template
│   ├── .gitignore                # Backend-specific ignore rules
│   ├── package.json
│   ├── package-lock.json
│   └── server.js                 # Express application entrypoint
│
├── web-app/                      # React 18 + Vite Frontend
│   ├── public/                   # Favicons, web manifest, static logos
│   ├── src/
│   │   ├── assets/               # Branding graphics & logo variants
│   │   ├── components/           # Reusable UI components & modals
│   │   │   ├── AvatarBasketModal.jsx
│   │   │   ├── BudgetModal.jsx
│   │   │   ├── ConfirmModal.jsx
│   │   │   ├── DeleteAuthModal.jsx
│   │   │   ├── EditProfileModal.jsx
│   │   │   ├── MonthBreakdownModal.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── ReportExportSection.jsx
│   │   │   ├── SetPasswordModal.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── TransactionModal.jsx
│   │   │   └── UserAvatar.jsx
│   │   ├── config/               # Firebase & app configuration
│   │   ├── context/              # AuthContext & ToastContext providers
│   │   ├── pages/                # Application views (Budgets, Dashboard, Login, etc.)
│   │   ├── services/             # Axios API client & interceptors
│   │   ├── utils/                # Categories, currency & export helpers
│   │   ├── App.jsx               # Route configuration & layout shell
│   │   ├── index.css             # Tailwind CSS & glassmorphic styling
│   │   └── main.jsx              # Application bootstrap
│   ├── .env                      # Web app environment variables
│   ├── .env.example              # Client environment template
│   ├── .gitignore                # Frontend-specific ignore rules
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── docs/                         # Architecture, PRD & design specifications
├── .gitignore                    # Global git tracking rules
└── README.md                     # Project documentation
```

---

## 🛠️ Technology Matrix

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18**, **Vite 5** | High-speed single-page application with modular component architecture |
| **Styling & Theme** | **Tailwind CSS 3.4** | Modern dark-mode glassmorphic theme with responsive breakpoints |
| **Visual Charts** | **Recharts 2.15** | Animated cash flow bar charts, donut charts, and spending distribution |
| **Report Export** | **jsPDF**, **SheetJS (xlsx)** | Client-side dynamic PDF statement styling and Excel spreadsheet generation |
| **Backend Runtime** | **Node.js (ESM)**, **Express 4** | Modular REST API with structured controllers, routes, and middleware |
| **Database** | **MongoDB Atlas & Mongoose 8** | Cloud NoSQL persistence with in-memory fallback for offline dev resilience |
| **Authentication** | **JWT & Google OAuth 2.0** | Dual-channel auth via JSON Web Tokens, bcrypt, and Google Auth Library |
| **Mail Services** | **Nodemailer** | SMTP notification relay for 6-digit email change OTP verification |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **MongoDB Atlas** account (or local MongoDB instance)

---

### 2. Clone the Repository
```bash
git clone https://github.com/Deb-Kumar/ExpenseX.git
cd ExpenseX
```

---

### 3. Backend Setup (`backend/`)

1. Navigate to the backend directory:
   ```bash
   cd backend
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

3. Update `backend/.env` with your credentials:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/ExpenseX?retryWrites=true&w=majority
   CLIENT_URL=http://localhost:5173
   JWT_SECRET=your_super_secret_jwt_key
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_gmail_app_password
   ```

4. Start the backend server:
   ```bash
   npm run dev
   # or
   npm start
   ```
   *The backend will boot at `http://localhost:5000` (Health Check: `http://localhost:5000/api/health`).*

---

### 4. Frontend Web App Setup (`web-app/`)

1. Open a new terminal and navigate to the web-app directory:
   ```bash
   cd web-app
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

3. Update `web-app/.env`:
   ```env
   VITE_API_URL=/api
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   # or
   npm start
   ```
   *The web app will be accessible at `http://localhost:5173`.*

---

## 📡 REST API Reference

| Endpoint | Method | Auth | Description |
| :--- | :---: | :---: | :--- |
| `/api/health` | `GET` | Public | System status and database connectivity check |
| `/api/auth/signup` | `POST` | Public | Create new user account with email & password |
| `/api/auth/login` | `POST` | Public | Authenticate user and receive JWT session token |
| `/api/auth/google` | `POST` | Public | Verify Google OAuth token and issue JWT session |
| `/api/auth/profile` | `GET` | Protected | Fetch current user profile, currency, and avatar |
| `/api/auth/profile` | `PUT` | Protected | Update user profile, currency preferences, or avatar |
| `/api/transactions` | `GET` | Protected | Fetch paginated, filtered transaction records |
| `/api/transactions` | `POST` | Protected | Record a new income or expense transaction |
| `/api/transactions/:id`| `PUT` | Protected | Update an existing transaction record |
| `/api/transactions/:id`| `DELETE`| Protected (Re-auth) | Remove transaction (requires password/OAuth re-verification) |
| `/api/budgets` | `GET` | Protected | Retrieve all monthly category budgets |
| `/api/budgets` | `POST` | Protected | Create or update budget limits for a category |
| `/api/budgets/:id` | `DELETE`| Protected | Remove a budget allocation |

---

## 📄 License
This project is licensed under the [ISC License](LICENSE).
