# Project Memory & Engineering Context — ExpenseX 🧠

## 1. Project Context & Purpose

**ExpenseX** is an enterprise-grade personal finance and budgeting platform. The repository is configured as a lightweight monorepo containing a React 18 / Vite frontend (`client/`) and a Node.js / Express backend (`server/`).

This document serves as the long-term context memory for developers and AI agents, detailing architectural rationales, design decisions, environment configurations, and active implementation patterns.

---

## 2. Key Architectural Decisions & Rationale

### Decision 1: Hybrid Persistence Layer (`dataStore.js`)
- **Context**: Setting up a remote MongoDB Atlas database during initial development or testing can create friction for new developers or CI/CD pipelines.
- **Decision**: Implemented an intelligent abstraction layer in `server/src/services/dataStore.js`. When `MONGO_URI` is connected, it uses Mongoose models. If disconnected or unconfigured, it seamlessly routes queries to in-memory `Map` collections (`memUsers`, `memTransactions`, `memBudgets`) and automatically seeds sample financial data.
- **Rationale**: Guarantees that the application is 100% functional out-of-the-box upon `npm run dev:server` without database connection blockers.

### Decision 2: Dual Authentication Engine (Google OAuth & Firebase)
- **Context**: Users expect both modern one-click Google Sign-In and standard Email/Password accounts, while developers need flexible authentication choices.
- **Decision**: The backend supports both Google ID token verification (`google-auth-library` via `/api/auth/google`) and Firebase Client SDK credentials (`/api/auth/firebase`). Both pathways converge into a unified user model and emit an HMAC-SHA256 JWT with a 30-day lifespan.
- **Rationale**: Eliminates vendor lock-in while preserving seamless social login.

### Decision 3: Re-Authentication Modal for Critical Deletions
- **Context**: In financial tracking systems, accidental or malicious transaction deletion compromises ledger integrity.
- **Decision**: Deletion of any transaction triggers `DeleteAuthModal.jsx`, requiring users to verify their password or re-authenticate their Google session before the `DELETE` API call is executed.
- **Rationale**: Emulates bank-grade security protocols and safeguards user financial records.

### Decision 4: Event-Driven Client Synchronization
- **Context**: When a user adds a transaction via the global quick-add modal in the Navbar, views like the Dashboard and Transactions ledger must refresh without forcing full-page reloads.
- **Decision**: Dispatched a native DOM window event `expensex:transaction-added` upon modal form submission. Listening components attach an event listener to re-fetch their dataset.
- **Rationale**: Lightweight, decoupled, and avoids cumbersome global Redux/Zustand boilerplate for simple data invalidation.

### Decision 5: Non-Blocking Nodemailer Email Service with Console Fallback
- **Context**: Modifying user email addresses requires a 6-digit OTP verification. However, requiring active SMTP credentials during local development blocks feature testing.
- **Decision**: `emailService.js` inspects `SMTP_USER` and `SMTP_PASS`. If configured, it sends a styled HTML email; if unconfigured, it prints a prominent ASCII banner in the server terminal with the active OTP code and returns success.
- **Rationale**: Ensures zero friction in local testing while offering production-ready SMTP delivery.

### Decision 6: Salted Bcrypt Master Password Hashing & Auto-Migration
- **Context**: Passwords (such as `dev@123`) must never be persisted in plaintext in the database.
- **Decision**: Installed `bcryptjs` in `server/`. Added a Mongoose `pre('save')` hook on `User.js` that hashes modified passwords with 10 salt rounds. Added `encryptLegacyPlaintextPasswords()` on database startup in `db.js` to automatically detect and encrypt existing plaintext passwords in MongoDB Atlas. Added `POST /api/auth/verify-password` route and `verifyUserPassword()` with bcrypt verification to authorize sensitive actions (e.g. transaction deletion).
- **Rationale**: Guarantees bank-grade cryptographic security while seamlessly migrating legacy records without disrupting user access.

---

## 3. Environment Variables Reference Catalog

### 3.1 Backend Variables (`server/.env`)
| Variable | Required | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | `5000` | HTTP port for the Express API server |
| `NODE_ENV` | Optional | `development` | Server environment (`development` / `production`) |
| `CLIENT_URL` | Optional | `http://localhost:5173` | Allowed CORS origin for frontend client |
| `MONGO_URI` | Optional | `mongodb+srv://...` | MongoDB Atlas connection string (triggers in-memory fallback if empty) |
| `JWT_SECRET` | Required | `expensex_super_secret_jwt_dev_key_2026` | Secret key for signing and verifying 30-day session JWTs |
| `GOOGLE_CLIENT_ID` | Optional | `...apps.googleusercontent.com` | Google Cloud OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Optional | `...` | Google Cloud OAuth Client Secret |
| `SMTP_HOST` | Optional | `smtp.gmail.com` | SMTP email server hostname |
| `SMTP_PORT` | Optional | `587` | SMTP email server port |
| `SMTP_SECURE` | Optional | `false` | SSL/TLS toggle (`true` for port 465) |
| `SMTP_USER` | Optional | `your_email@gmail.com` | SMTP authentication username |
| `SMTP_PASS` | Optional | `your_app_password` | SMTP authentication app password |
| `EMAIL_FROM` | Optional | `"ExpenseX Security" <noreply@expensex.app>` | Sender identity in email headers |

### 3.2 Frontend Variables (`client/.env`)
| Variable | Required | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Optional | `/api` | Base URL for backend API requests |
| `VITE_FIREBASE_API_KEY` | Optional | `...` | Firebase Web Client API key |
| `VITE_FIREBASE_AUTH_DOMAIN`| Optional| `...firebaseapp.com` | Firebase Authentication domain |
| `VITE_FIREBASE_PROJECT_ID` | Optional| `...` | Firebase project identifier |
| `VITE_FIREBASE_STORAGE_BUCKET`| Optional| `...firebasestorage.app`| Firebase Cloud Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Optional| `...` | Firebase Cloud Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Optional | `...` | Firebase Web App application ID |

---

## 4. Component & Service Registry

```text
Backend Layer:
  - server.js                    -> Express initialization, middleware stack, route mounts
  - config/db.js                 -> Mongoose connection management
  - models/User.js               -> User schema (Google/Firebase IDs, OTP, currency)
  - models/Transaction.js        -> Income & Expense ledger records
  - models/Budget.js             -> Monthly category budget caps
  - controllers/authController.js-> Authentication, profile updates, OTP verification
  - controllers/transactionController.js -> Transaction CRUD and financial analytics summaries
  - controllers/budgetController.js      -> Budget management and monthly calculations
  - services/dataStore.js        -> MongoDB / in-memory hybrid data abstraction
  - services/emailService.js     -> Nodemailer HTML template and OTP dispatch
  - middleware/authMiddleware.js -> JWT extraction and authentication guard

Frontend Layer:
  - App.jsx                      -> Router configuration and global AppLayout
  - context/AuthContext.jsx      -> Session state, login/logout, profile mutations
  - context/ToastContext.jsx     -> Toast notification dispatch system
  - services/api.js              -> Axios client with JWT interceptors
  - components/Navbar.jsx        -> Top header, quick-add trigger, user menu
  - components/Sidebar.jsx       -> Desktop fixed sidebar / mobile drawer
  - components/TransactionModal.jsx -> Transaction creation and update form
  - components/DeleteAuthModal.jsx  -> Security re-auth modal for deletions
  - components/SetPasswordModal.jsx -> Master password prompt for OAuth accounts
  - components/AvatarBasketModal.jsx-> Curated avatar picker with category tabs & custom upload
  - components/EditProfileModal.jsx -> Name, email (with OTP verification), and profile photo customization
  - pages/Dashboard.jsx          -> KPI cards, charts, and recent activity
  - pages/Transactions.jsx       -> Filterable and searchable ledger
  - pages/Budgets.jsx            -> Category monthly budgets and threshold alerts
  - pages/Reports.jsx            -> Financial analytics, savings rates, and payment methods
  - pages/Settings.jsx           -> Currency switcher, profile details, and security controls
```

---

## 5. Known Constraints & Edge Cases Handled

1. **Mongoose Model Re-Compilation**: In environments with code watching (`node --watch`), importing Mongoose models can throw `Cannot overwrite model once compiled`. Resolved across all models using:
   ```javascript
   const User = mongoose.models.User || mongoose.model('User', userSchema);
   ```
2. **Category Isolation**: Income and Expense categories have distinct sets. In `client/src/utils/categories.js`, `getCategoriesByType()` prevents mixing income sources (e.g., Salary) with expense budgets (e.g., Groceries).
3. **Sparse Index on `googleId`**: For users registering via pure email/password, `googleId` is null. Setting `sparse: true` in `User.js` prevents MongoDB duplicate key errors on null values.
4. **CORS Configuration**: The backend explicitly permits `CLIENT_URL`, `http://localhost:5173`, and `http://127.0.0.1:5173` with `credentials: true` to prevent development origin issues.

---

## 6. Developer & AI Assistant Quick-Start Guide

1. **Install All Dependencies**:
   ```bash
   npm run install:all
   ```
2. **Start Backend Server**:
   ```bash
   npm run dev:server
   ```
   Health check: `http://localhost:5000/api/health`
3. **Start Frontend Client**:
   ```bash
   npm run dev:client
   ```
   Client URL: `http://localhost:5173`
4. **Extending Features**:
   - To add an API route, register it in `server/src/routes/`, implement the controller in `server/src/controllers/`, and add methods in `server/src/services/dataStore.js` to ensure both MongoDB and memory mode support.
   - To add a frontend page, create the page under `client/src/pages/`, register the route in `client/src/App.jsx`, and add a navigation link in `client/src/components/Sidebar.jsx`.
