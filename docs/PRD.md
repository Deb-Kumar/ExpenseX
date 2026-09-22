# Product Requirements Document (PRD) — ExpenseX 💰

## 1. Executive Summary & Vision

**ExpenseX** is an enterprise-grade, modern personal finance tracking and financial intelligence platform. Designed to solve the friction of manual bookkeeping, ExpenseX equips users with intuitive income and expense tracking, budget allocation monitoring, interactive data visualizations, and bank-grade security features.

With sleek dark-mode glassmorphism aesthetics, multi-currency versatility, and smart authentication options, ExpenseX transforms mundane expense logging into an engaging, insightful, and secure financial management journey.

---

## 2. Problem Statement & Opportunity

### The Problem
- **Scattered Financial Records**: Users frequently use multiple accounts, cash, UPI, and cards without a unified dashboard to visualize where their money goes.
- **Budget Overruns**: Lack of real-time monthly budget alerts causes users to exceed limits before realizing it at month's end.
- **Security Deficits in Personal Trackers**: Traditional trackers lack transaction authorization verification, making shared or left-open devices vulnerable to accidental or malicious record tampering.
- **Rigid Interfaces**: Most personal finance apps are utilitarian, visually dull, and inflexible with currency configurations and avatars.

### The ExpenseX Solution
- **Consolidated Cashflow Tracking**: Fast, categorized logging of incomes and expenses across multiple payment methods (UPI, Card, Cash, Net Banking).
- **Proactive Budgeting**: Category-level monthly targets with live progress bars and warning thresholds.
- **Multi-Layered Security**: Re-authentication password modals on critical actions (e.g., transaction deletion), master password setup for Google OAuth users, and 6-digit OTP verification for email modifications.
- **Delightful Aesthetics**: High-end fintech dark theme, bespoke CSS animations, dynamic charts via Recharts, and customizable user avatars.

---

## 3. Target Audience & User Personas

| Persona | Description | Core Needs |
| :--- | :--- | :--- |
| **The Young Professional / Freelancer** | Tech-savvy individual managing multiple income streams (salary, freelance projects, gigs) and frequent digital micro-transactions (UPI/cards). | Quick transaction entry, clear income vs. expense breakdown, savings rate calculation. |
| **The Conscious Budgeter** | University student or young couple with fixed monthly allowances seeking to curb impulse spending. | Monthly category budgets, over-limit warnings, visual spending caps. |
| **The Privacy-Conscious User** | Individual demanding tight control over personal finance data and account access. | Re-authentication before deletions, secure OTP email verification, secure session tokens. |

---

## 4. Key Product Features & Capabilities

### 4.1 Authentication & Profile Management
- **Dual Authentication**:
  - Direct Google OAuth 2.0 integration with Google Auth Library verification.
  - Firebase Authentication (Email/Password & Google Sign-In popups).
- **Session Continuity**: 30-day JWT authentication with HTTP interceptors and automatic session rehydration.
- **Master Password Setup**: Optional yet strongly prompted master password creation for users who registered via OAuth.
- **Profile Customization**:
  - Name, avatar, and currency symbol customization (₹ INR, $ USD, € EUR, £ GBP, ¥ JPY).
  - Avatar Basket containing curated categories (Vehicles, Animals, Humans, Tech) alongside custom image URL support.
- **Secure Email Modification**:
  - Two-step email change workflow requiring 6-digit email OTP verification powered by Nodemailer.

### 4.2 Transaction Management Engine
- **Transaction Types**: Clear bifurcation of `income` vs. `expense` entries.
- **Curated Categorization**:
  - Expense categories: *Food, Transport, Shopping, Bills, Entertainment, Health, Education, Travel, Other*.
  - Income categories: *Salary, Freelance, Business, Investment, Gift, Other*.
- **Payment Method Association**: *UPI, Cash, Card, Net Banking, Other*.
- **Search & Multi-Filter Querying**:
  - Real-time text search by description.
  - Filter by transaction type (`all`, `income`, `expense`).
  - Filter by specific category.
  - Date range filtering (`startDate` to `endDate`).
- **Security-Gated Deletions**: Sensitive transaction deletion triggers password re-verification or Google OAuth re-authentication.

### 4.3 Interactive Dashboard & Analytics
- **Summary Metrics**: Real-time Net Balance, Total Income, Total Expenses, and Active Budget counts.
- **Visual Analytics**:
  - Cash flow bar chart (Monthly Inflow vs. Outflow).
  - Spending distribution donut/pie chart with percentage breakdowns.
- **Recent Activity Ledger**: Chronological transaction feed with instant action buttons.

### 4.4 Budgeting & Threshold Alerts
- **Monthly Category Limits**: Set customized spending caps per category for any selected month/year.
- **Real-Time Spent Tracking**: Automatic aggregation of actual expense transactions against the active monthly limit.
- **Visual Status & Warnings**:
  - Safe (< 80% used)
  - Warning (80% – 100% used)
  - Exceeded (> 100% used) with alert indicators.

### 4.5 Financial Reports
- **Savings Rate KPI**: Mathematical percentage of gross earnings retained as net savings.
- **Volume Metrics**: Total cash flow volume and historical transaction counts.
- **Payment Method Distribution**: Comparative breakdown of spending across UPI, cards, cash, and digital channels.

---

## 5. Non-Functional Requirements (NFR)

### 5.1 Performance & Responsiveness
- **Sub-100ms API Latency**: Efficient indexing (`{ userId: 1, date: -1 }` and compound unique budget indexes) ensures snappy responses.
- **Client-side Transitions**: Vite-powered React 18 SPA delivers instantaneous route transitions and fluid modal animations.

### 5.2 Reliability & Fault Tolerance
- **Hybrid Data Store Fallback**: If MongoDB Atlas is temporarily unreachable or unconfigured during local development, the backend automatically falls back to an in-memory data store with sample data auto-seeding.

### 5.3 Security & Compliance
- **JWT Protection**: Stored tokens validated against standard HMAC-SHA256 signatures.
- **Input Sanitization**: Mongoose schemas enforce data types, trimming, and required field validations.
- **Credential Protection**: Passwords hashed and never exposed in JSON responses.
- **Re-Authentication Guardrails**: Critical data deletion requires active identity re-verification.

### 5.4 Usability & Accessibility
- Responsive layout supporting mobile devices, tablets, and desktop displays.
- High-contrast typography on dark slate backgrounds complying with WCAG 2.1 AA standards.

---

## 6. Success Metrics & Key Performance Indicators (KPIs)

| Metric | Target | Method of Measurement |
| :--- | :--- | :--- |
| **Transaction Entry Speed** | < 10 seconds | Time from clicking "Add Transaction" to confirmation toast |
| **Dashboard Load Time** | < 1.2 seconds | Network timing on initial `/dashboard` load |
| **Budget Adherence Rate** | > 70% | Proportion of users whose monthly expenses stay under set budgets |
| **Security Verification Completion** | > 95% | Successful completion rate of OTP and deletion verification modals |

---

## 7. Out of Scope for Current Release

- Native iOS / Android binary apps (currently mobile web responsive).
- Direct Open Banking / Plaid bank account auto-sync (transactions are manually logged).
- Multi-user shared wallets or family expense splitting.
- Cryptocurrency tracking and automated stock portfolio valuation.
