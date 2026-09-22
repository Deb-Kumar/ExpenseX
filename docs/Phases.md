# Development Phases & Roadmap — ExpenseX 🗺️

This document details the development lifecycle, completed milestone stages, current production readiness, and future engineering phases for ExpenseX.

---

## 1. Roadmap Matrix & Status Overview

| Phase | Milestone | Focus Area | Status |
| :--- | :--- | :--- | :--- |
| **Stage 1** | Foundation & Toolchain | Monorepo structure, Express server, Vite React client, MongoDB Atlas connection, Tailwind CSS | ✅ **COMPLETED** |
| **Stage 2** | Authentication & Identity | Google OAuth, Firebase Auth, JWT session lifecycle, Protected routes, User Mongoose model | ✅ **COMPLETED** |
| **Stage 3** | Transaction Engine | Income/Expense CRUD, category filters, payment methods, search, date range queries | ✅ **COMPLETED** |
| **Stage 4** | Dashboard & Visualizations| Financial KPI summary, Recharts cash flow charts, category breakdown, recent activity feed | ✅ **COMPLETED** |
| **Stage 5** | Budgets & Analytics | Category monthly limits, real-time threshold alerts, in-depth reports, savings rate KPI | ✅ **COMPLETED** |
| **Stage 6** | Security & Profile Polish | Re-auth deletion modal, Nodemailer OTP email changes, avatar basket, currency switcher | ✅ **COMPLETED** |
| **Stage 7** | Data Export & Invoicing | CSV/Excel export, monthly PDF statement generator, receipt image attachments | 📋 *Planned* |
| **Stage 8** | Recurring Bills & Subscriptions| Automated recurring transactions, billing reminders, subscription cost tracking | 📋 *Planned* |
| **Stage 9** | PWA & Offline Support | Service workers, IndexedDB offline transaction sync, installable mobile PWA | 📋 *Planned* |
| **Stage 10**| AI Financial Intelligence | Anomaly detection, predictive cashflow forecasting, personalized savings tips | 📋 *Planned* |

---

## 2. Completed Milestones (Stages 1 – 6)

### Stage 1: Foundation Setup ✅
- Established root npm workspace scripts (`install:all`, `dev:server`, `dev:client`).
- Initialized Express.js backend with Morgan logging, CORS configuration, and environment variable loaders.
- Configured Mongoose connection to MongoDB Atlas with graceful error handling and health-check endpoint (`/api/health`).
- Scaffolding of React 18 frontend with Vite, Tailwind CSS, and Lucide React icons.

### Stage 2: Authentication Engine ✅
- Implemented Google OAuth 2.0 token verification using `google-auth-library`.
- Integrated Firebase Web SDK for email/password authentication and Google Sign-in popups.
- Configured 30-day HMAC-SHA256 JWT generation and Axios request interceptors.
- Created `AuthContext` with automatic `localStorage` session rehydration and `ProtectedRoute` guardrails.

### Stage 3: Transaction Engine ✅
- Built Mongoose `Transaction` schema with compound index `{ userId: 1, date: -1 }`.
- Implemented unified categories for income and expenses (`client/src/utils/categories.js`).
- Developed `TransactionModal` supporting both quick creation and full editing.
- Built multi-filter query engine (search keyword, transaction type, category, and date bounds).

### Stage 4: Dashboard & Analytics ✅
- Developed server-side financial summary endpoint (`GET /api/transactions/summary`) aggregating Net Balance, Inflows, Outflows, and monthly trends.
- Rendered responsive KPI cards with dynamic icons and color-coded status badges.
- Integrated Recharts for Monthly Inflow vs. Outflow bar charts and spending distribution breakdowns.
- Created real-time recent transactions feed with quick-action delete and edit buttons.

### Stage 5: Budgets & Reports ✅
- Created Mongoose `Budget` schema with compound unique constraint `{ userId: 1, category: 1, month: 1, year: 1 }`.
- Built interactive budget planner with visual progress bars and dynamic thresholds (Safe, Warning >80%, Exceeded >100%).
- Engineered comprehensive `Reports` page displaying:
  - Savings Rate percentage
  - Net Accumulated capital
  - Total cashflow volume
  - Breakdown by payment methods (UPI, Card, Cash, Net Banking)

### Stage 6: Security, Verification & Profile Polish ✅
- **Delete Authorization Modal (`DeleteAuthModal.jsx`)**: Enforced password re-verification or Google OAuth re-authentication prior to transaction deletion.
- **Mandatory Password Configuration (`SetPasswordModal.jsx`)**: Non-blocking prompt enabling OAuth users to configure an account master password.
- **Two-Step Email Modification**: Implemented 6-digit verification code generation and delivery via Nodemailer (`emailService.js`) with 10-minute expiry.
- **Avatar Basket (`AvatarBasketModal.jsx`)**: Curated library of avatars across Vehicles, Animals, Humans, and Tech, plus external URL input.
- **Multi-Currency Engine**: Support for ₹ (INR), $ (USD), € (EUR), £ (GBP), and ¥ (JPY) persisted to user profiles.

---

## 3. Future Roadmap & Production Scaling (Stages 7 – 10)

### Stage 7: Data Export & Reports Generation
- Export filtered transaction ledgers to CSV and Microsoft Excel formats.
- Client-side or server-side generation of styled PDF monthly financial statements.
- Support for uploading and storing receipt image attachments in Cloud Storage.

### Stage 8: Recurring Bills & Subscription Tracking
- Automated scheduler for recurring income (monthly salary) and recurring bills (rent, utilities, Netflix, Spotify).
- Upcoming bill notifications and payment due reminders.
- True cost-of-subscription analytics to highlight unused recurring charges.

### Stage 9: Progressive Web App (PWA) & Offline Sync
- Service worker implementation with Workbox for complete offline asset caching.
- Local IndexedDB storage enabling users to log transactions while offline, auto-syncing when network connectivity restores.
- Web App Manifest configuration for native desktop and mobile home-screen installation.

### Stage 10: AI-Powered Financial Intelligence
- Integration with Gemini API for natural-language expense queries (e.g., *"How much did I spend on dining out last month?"*).
- Anomaly detection highlighting unusual spikes in specific expense categories.
- Smart monthly budget recommendations based on historical 3-month spending trends.
