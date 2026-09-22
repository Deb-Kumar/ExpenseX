# Engineering & Architectural Rules — ExpenseX 📜

This document establishes the mandatory architectural boundaries, coding standards, security policies, and engineering workflows for the ExpenseX codebase. All contributors and AI coding agents must adhere to these rules.

---

## 1. Architectural Boundaries & Modularity

### 1.1 Separation of Concerns (Backend)
- **Routes (`server/src/routes/`)**:
  - Route files must ONLY define URL patterns, HTTP methods, and apply middleware.
  - NEVER write business logic, database queries, or data transformations inside route files.
- **Controllers (`server/src/controllers/`)**:
  - Controllers receive `req`, `res`, and `next`. They validate input parameters and orchestrate service or model calls.
  - Always wrap asynchronous controller methods in `try ... catch (error)` blocks and pass unhandled errors to `next(error)` or return standardized HTTP error responses.
- **Services & Data Layer (`server/src/services/`)**:
  - Encapsulate data access logic, external integrations (Nodemailer, Google OAuth), and the dual persistence strategy.
  - Changes to persistence mechanisms (e.g., swapping MongoDB or memory storage) must remain isolated to the service layer without breaking controller signatures.
- **Models (`server/src/models/`)**:
  - Define Mongoose schemas, types, validation rules, default values, and database indexes.
  - Guard against hot-reload re-compilation errors using the pattern:
    ```javascript
    const Model = mongoose.models.ModelName || mongoose.model('ModelName', modelSchema);
    ```

### 1.2 Separation of Concerns (Frontend)
- **Pages (`client/src/pages/`)**:
  - Top-level route views responsible for page layout, coordinating multiple components, and handling page-specific data fetching.
- **Components (`client/src/components/`)**:
  - Reusable, self-contained UI building blocks (Modals, Navbars, Sidebars, Cards).
  - Components should accept clear props and emit callback events rather than directly coupling with disparate pages.
- **Contexts (`client/src/context/`)**:
  - Global app state is strictly limited to application-wide domains: Authentication (`AuthContext`) and Notifications (`ToastContext`).
  - Do NOT store ephemeral form state or page-specific table filters in global context.
- **API Services (`client/src/services/api.js`)**:
  - All network calls must pass through the configured Axios client in `api.js`. Never invoke raw `fetch()` or instantiate unconfigured Axios calls inside components.

---

## 2. Coding Standards & Conventions

### 2.1 Language & Module Standards
- **ES Modules**: Both frontend and backend use ES Modules (`import` / `export`). In the Node.js backend, always include the file extension on local imports (e.g., `import User from '../models/User.js';`).
- **Async / Await**: Use `async/await` syntax for asynchronous operations. Avoid raw promise chaining (`.then().catch()`) unless inside utility compositions.
- **Naming Conventions**:
  - Files: `PascalCase.jsx` for React components; `camelCase.js` for utilities, controllers, routes, and services.
  - Variables & Functions: `camelCase` (e.g., `fetchTransactionsApi`, `handleSavePassword`).
  - Constants: `SCREAMING_SNAKE_CASE` (e.g., `EXPENSE_CATEGORIES`, `CURRENCIES`).
  - Database Models: `PascalCase` singular (e.g., `User`, `Transaction`, `Budget`).

### 2.2 Standard API Response Contract
All backend API responses must adhere to the standardized JSON contract:

```json
// Success Response
{
  "success": true,
  "message": "Optional human-readable feedback message",
  "dataField": { ... }
}

// Error Response
{
  "success": false,
  "message": "Clear explanation of error",
  "errors": [ ... ]
}
```

---

## 3. Security & Authentication Policies

### 3.1 Route Protection & JWT Lifecycle
- All routes handling user transactions, budgets, or profile modifications MUST be protected by the `protect` middleware (`server/src/middleware/authMiddleware.js`).
- Never trust `userId` passed in request bodies or query parameters. Always extract `req.user._id` from the verified JWT payload.
- In the frontend Axios client, an interceptor automatically attaches `Authorization: Bearer <token>`. If a 401 response is returned, stale tokens must be purged from `localStorage`.

### 3.2 Sensitive Operations & Re-Authentication
- **Transaction Deletion**: Because financial records are sensitive, deletion requires explicit re-authentication (`DeleteAuthModal.jsx`). Users must confirm their password or verify their Google OAuth session before the delete request is processed.
- **Password Strength**: Minimum 6 characters required for all account passwords.
- **Email Updates**: Changing account email requires successful two-factor verification via a 6-digit numeric OTP sent to the new email address.

### 3.3 Secrets & Environment Safety
- NEVER commit secrets, API keys, passwords, or `.env` files into source control.
- All required environment keys must be documented with placeholder values in `.env.example` files in both `client/` and `server/`.

---

## 4. Design & UI/UX Standards

### 4.1 Styling Tokens & Glassmorphism
- Adhere strictly to the ExpenseX Fintech Dark Theme design system defined in `client/tailwind.config.js`:
  - Background: `#0a0f1d`
  - Surface panels: `glass-panel` (dark slate with backdrop blur and subtle border)
  - Interactive cards: `glass-card` with hover border highlights
  - Accent colors: `brand-500` (`#6366f1`), `income` (`#10b981`), `expense` (`#f43f5e`)
- Do not introduce arbitrary, unharmonious colors or plain white backgrounds.

### 4.2 Formatting & Localization
- **Currency Symbols**: Never hardcode `₹` or `$`. Always derive the symbol using `getCurrencySymbol(user?.currency)`.
- **Numbers**: Always format monetary values using `.toLocaleString()` to ensure readable digit grouping.
- **Dates**: Present dates in clear, localized human-friendly formats.

---

## 5. Error Handling & Resilience

### 5.1 Backend Error Handling
- Never let unhandled promise rejections crash the Node process.
- Use the centralized `errorHandler` middleware to format error responses and suppress stack traces in production environments (`NODE_ENV === 'production'`).
- In `emailService.js`, if SMTP credentials are missing or failing, log the error and OTP to the console rather than crashing the HTTP request pipeline, preserving developer velocity.

### 5.2 Frontend Resilience
- Always wrap network operations in `try ... catch ... finally` blocks to ensure loading states (`loading = false`) are cleared even during failures.
- Provide contextual, user-facing error feedback using the global `ToastContext` instead of native browser `alert()` popups.

---

## 6. Git & Version Control Guidelines

### 6.1 Commit Messages
Follow the Conventional Commits specification:
- `feat: ...` for new user-facing features
- `fix: ...` for bug fixes
- `docs: ...` for documentation additions or revisions
- `style: ...` for styling and cosmetic updates without logic changes
- `refactor: ...` for code restructuring without feature modification
- `chore: ...` for dependency updates and configuration changes

### 6.2 Branching Strategy
- `main` / `master`: Stable, production-ready release branch.
- `feature/<name>`: Dedicated feature development branches.
- `fix/<name>`: Bug fix and security patch branches.
