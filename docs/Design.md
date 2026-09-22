# Design System & UI/UX Specifications — ExpenseX 🎨

## 1. Design Philosophy & Visual Identity

ExpenseX embodies a **"Fintech Dark Glassmorphism"** aesthetic. The design marries the authoritative precision of modern wealth management software with the sleek, captivating energy of next-generation developer tooling.

### Key Pillars
- **Immersive Dark Canvas**: Deep cosmic blue-slate background (`#0a0f1d`) enriched with ambient radial gradients in indigo, emerald, and dark slate.
- **Translucent Glass Layers**: Tiered depth created by blurred translucent backdrops (`backdrop-blur-md`, `backdrop-blur-lg`) with ultra-fine borders (`rgba(255, 255, 255, 0.08)`).
- **Semantically Vibrant Accents**: Strict color coding: Emerald Green for capital inflows, Rose Red for expenditures, and Electric Indigo for interactive brand moments.
- **Delightful Micro-Interactions**: Hover scale elevations, glowing box-shadows, and kinetic loader animations that make the interface feel alive.

---

## 2. Color Palette & Design Tokens

### 2.1 Brand & Accent Palette (Indigo)
| Token | Hex Value | Intended Usage |
| :--- | :--- | :--- |
| `brand-50` | `#eef2ff` | Lightest tint, contrast highlights |
| `brand-100`| `#e0e7ff` | Active soft backgrounds |
| `brand-400`| `#818cf8` | Secondary icon accents, links |
| `brand-500`| `#6366f1` | **Primary Brand Color**, active buttons, focus rings |
| `brand-600`| `#4f46e5` | Button hover state, primary gradients |
| `brand-900`| `#312e81` | Deep indigo panel tints |

### 2.2 Semantic Financial Palette
| Domain | Token | Hex | Role |
| :--- | :--- | :--- | :--- |
| **Income** | `income.DEFAULT` | `#10b981` | Inflow amounts, positive balances, savings rate |
| | `income.light` | `#ecfdf5` | Badges, positive tags |
| | `income.dark` | `#047857` | Hover states, border accents |
| **Expense** | `expense.DEFAULT` | `#f43f5e` | Outflow amounts, negative balances, over-budget alerts |
| | `expense.light` | `#fff1f2` | Danger badges, warning tags |
| | `expense.dark` | `#be123c` | Danger button hover states |

### 2.3 Dark Theme Neutral Tokens
| Token | Hex / CSS | Description |
| :--- | :--- | :--- |
| `dark.bg` | `#0a0f1d` | Global page background canvas |
| `dark.surface` | `#111827` | Primary structural surface (Navbar, Sidebar) |
| `dark.card` | `#1e293b` | Floating content cards, modal bodies |
| `dark.border` | `#334155` | Dividers, input borders, structural separators |

### 2.4 Chart & Category Palette
For multi-category donut breakdowns and trend bars:
```javascript
const CATEGORY_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#14b8a6', // Teal
];
```

---

## 3. Typography & Hierarchy

- **Primary Font Family**: `Plus Jakarta Sans`, `Inter`, `system-ui`, sans-serif.
- **Monospace Font**: `font-mono` applied to monetary amounts, currency symbols, and OTP digit boxes to ensure numerical alignment.

| Style | Tailwind Classes | Size / Weight | Usage |
| :--- | :--- | :--- | :--- |
| **Page Title (H1)** | `text-2xl sm:text-3xl font-extrabold text-white tracking-tight` | 24px–30px / 800 | Top of dashboard, reports, settings |
| **Section Title (H2)**| `text-base sm:text-lg font-bold text-white tracking-tight` | 16px–18px / 700 | Card headings, chart section headers |
| **KPI Stat Value** | `text-3xl font-black tracking-tight` | 30px / 900 | Main numbers in summary stat cards |
| **Body Text** | `text-sm text-slate-300` | 14px / 400 | General descriptions, table data |
| **Subtext / Caption** | `text-xs text-slate-400 font-medium` | 12px / 500 | Metadata, helper text, date timestamps |
| **Badges / Labels** | `text-xs font-semibold uppercase tracking-wider` | 11px–12px / 600 | Category pills, transaction type badges |

---

## 4. Glassmorphism & Elevation System

ExpenseX uses two tailored utility classes declared in `client/src/index.css`:

### 4.1 `.glass-panel`
- **Application**: Structural shells (Navbar, Sidebar, full-width chart containers).
- **CSS Definition**:
  ```css
  background: rgba(17, 24, 39, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  ```

### 4.2 `.glass-card`
- **Application**: Interactive metric cards, transaction ledger items, budget cards.
- **CSS Definition**:
  ```css
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.2s ease-in-out;
  ```
- **Hover Enhancement**: `border-color: rgba(99, 102, 241, 0.3);`

### 4.3 Glow Shadows
- `shadow-glow-brand`: `0 0 25px -5px rgba(99, 102, 241, 0.4)`
- `shadow-glow-income`: `0 0 25px -5px rgba(16, 185, 129, 0.35)`
- `shadow-glow-expense`: `0 0 25px -5px rgba(244, 63, 94, 0.35)`

---

## 5. Component Anatomy & UI Patterns

### 5.1 Stat / KPI Metric Card
- Container: `.glass-card` with rounded 2xl corners and subtle overflow hiding.
- Header: Upper-case muted label paired with a circular icon badge (`p-2.5 rounded-xl`).
- Value: Large, high-contrast numerical representation (`text-3xl font-black`).
- Subtitle: Dynamic trend indicator or explanatory contextual note.

### 5.2 Modal Windows
- Backdrop: `fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4`.
- Container: `.glass-panel` or `bg-slate-900` with high-density borders (`border-white/10`) and rounded 24px borders.
- Header: Title, subtitle, and an accessible close button (`X` icon).
- Footer: Action row featuring secondary "Cancel" button and primary colored submit button.

### 5.3 The Bespoke ExpenseX Loader
A pure CSS kinetic loading animation (`.expensex-loader`) engineered without external image dependencies:
- Consists of two rotating, pill-shaped gradient ribbons forming an interconnected dynamic "X".
- Features continuous breathing animation (`scale(0.92)` to `scale(1)`).
- Automatically responds to `prefers-reduced-motion` for accessibility.

### 5.4 Toast Notifications
- Position: Fixed at top-right or bottom-right viewport (`z-50`).
- Container: Dark translucent floating pill with status-colored icon (CheckCircle, AlertTriangle, AlertCircle).
- Progress Countdown: Real-time progress bar shrinking over 4000ms (`animate-progress`).

---

## 6. Data Visualization Standards (Recharts)

### 6.1 Chart Containers
- Always wrapped inside `<ResponsiveContainer width="100%" height="100%">` within a fixed-height parent (typically `h-72` or `h-80`).

### 6.2 Tooltip Styling
All Recharts tooltips must use consistent fintech styling:
```javascript
contentStyle={{
  backgroundColor: '#0f172a',
  borderColor: 'rgba(255, 255, 255, 0.15)',
  borderRadius: '12px',
  fontSize: '12px',
  color: '#f8fafc',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
}}
itemStyle={{ color: '#f8fafc', fontWeight: 600 }}
labelStyle={{ color: '#94a3b8', fontWeight: 500 }}
```

---

## 7. Responsive Layout & Breakpoints

- **Mobile Viewport (< 640px)**:
  - Sidebar collapses into a slide-over off-canvas drawer triggered by the hamburger icon in Navbar.
  - KPI cards stack vertically into a single column.
  - Data tables switch to card-based horizontal scrolling or compact mobile rows.
- **Tablet Viewport (640px – 1024px)**:
  - KPI cards arrange into 2-column grids.
- **Desktop Viewport (> 1024px)**:
  - Fixed 64-column (`w-64`) left sidebar navigation.
  - KPI cards span a 4-column layout (`grid-cols-4`).
  - Dual-column chart and analytics view.
