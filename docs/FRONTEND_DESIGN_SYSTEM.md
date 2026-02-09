# Frontend Design System & Code Standards

This document defines the UI patterns, styling conventions, and code standards for the Barbie frontend application. Follow these guidelines to maintain consistency across all components.

---

## Table of Contents
- [Design Philosophy](#design-philosophy)
- [Theme System](#theme-system)
- [Text Colors](#text-colors)
- [Message State Colors](#message-state-colors)
- [Glass Effects](#glass-effects)
- [Form Elements](#form-elements)
- [Component Patterns](#component-patterns)
- [Charts](#charts)
- [Animation Guidelines](#animation-guidelines)
- [Currency Formatting](#currency-formatting)
- [Cache Management](#cache-management)
- [Code Conventions](#code-conventions)

---

## Design Philosophy

1. **Glassmorphism**: All cards and panels use frosted glass effects with backdrop blur
2. **Theme-Aware**: Every color must adapt to light/dark mode via CSS variables
3. **Minimal Hardcoding**: Never use hardcoded colors like `text-white` or `bg-white` - use CSS variable classes instead
4. **Consistent Spacing**: Use Tailwind's spacing scale (4, 6, 8, 10, etc.)

---

## Theme System

### CSS Variables Location
All theme variables are defined in `apps/frontend/src/styles/index.css`.

### Switching Themes
Theme is controlled by `data-theme` attribute on `:root`:
- `:root` = Dark mode (default)
- `:root[data-theme="light"]` = Light mode

### Adding New Theme Variables
1. Add to dark theme block (`:root { ... }`)
2. Add to light theme block (`:root[data-theme="light"] { ... }`)
3. Create utility class if needed

---

### ⚠️ CRITICAL: Theme Switching Pitfalls
**DO NOT use Tailwind's `dark:` modifier!**

The `dark:` modifier relies on the system's preferred color scheme (via media query) or a `dark` class on the root element. However, our app uses a `data-theme` attribute to toggle themes manually.

- ❌ **BAD**: `bg-white dark:bg-slate-900` (Will display dark mode if system is dark, even if app is in light mode)
- ✅ **GOOD**: `bg-[var(--glass-card-bg)]` (Uses CSS variables that change based on `data-theme`)

Always define theme values in `index.css` as CSS variables and use them in components.

---

## Text Colors

### Text Hierarchy (MUST USE)

| Purpose | CSS Class | Dark Mode | Light Mode | Usage |
|---------|-----------|-----------|------------|-------|
| **Primary Content** | `text-main` | `#f8fafc` (white) | `#0f172a` (slate-900) | Headlines, important values, amounts |
| **Secondary Content** | `text-secondary` | `#94a3b8` (slate-400) | `#475569` (slate-600) | Descriptions, labels, subtitles |
| **Muted/Tertiary** | `text-muted` | `#64748b` (slate-500) | `#94a3b8` (slate-400) | Hints, placeholders, less important text |

### ❌ NEVER DO
```jsx
// Bad - hardcoded colors that break themes
<p className="text-white">Amount</p>
<p className="text-slate-700">Label</p>
<p className="text-gray-400">Description</p>
```

### ✅ ALWAYS DO
```jsx
// Good - theme-aware classes
<p className="text-main">Amount</p>
<p className="text-secondary">Label</p>
<p className="text-muted">Description</p>
```

### Special Colors (Semantic)
For semantic meaning, these Tailwind colors are acceptable:
- `text-emerald-400` / `text-emerald-500` - Positive values, income, success
- `text-rose-400` / `text-rose-500` - Negative values, expenses, errors
- `text-indigo-400` / `text-indigo-300` - Accent, links, highlights
- `text-amber-400` - Warnings

### Message State Colors

> [!IMPORTANT]
> For user-facing error, success, and warning messages on `<p>` elements, you **MUST** use the custom CSS classes below. Tailwind color classes like `text-rose-400` will be overridden by the global `p { color: ... }` rule.

| Class | Color | Hex | Usage |
|-------|-------|-----|-------|
| `.text-error` | Rose-400 | `#fb7185` | Error messages, validation failures |
| `.text-success` | Emerald-400 | `#34d399` | Success messages, confirmations |
| `.text-warning` | Amber-400 | `#fbbf24` | Warning messages, alerts |

These classes use `!important` to override the global paragraph styling.

#### ✅ Usage Example
```jsx
// Error message
{error && <p className="text-sm text-error">{error}</p>}

// Success message
{success && <p className="text-sm text-success">{success}</p>}

// Conditional styling
<p className={`text-sm ${isError ? 'text-error' : 'text-success'}`}>
  {message}
</p>
```

#### ❌ Do NOT Use
```jsx
// These will be overridden by global p styling
<p className="text-rose-400">{error}</p>
<p className="text-emerald-600">{success}</p>
```

#### CSS Definition (in index.css)
```css
.text-error {
  color: #fb7185 !important; /* rose-400 */
}

.text-success {
  color: #34d399 !important; /* emerald-400 */
}

.text-warning {
  color: #fbbf24 !important; /* amber-400 */
}
```

---

## Conflict Display CSS Variables

> [!NOTE]
> These CSS variables enable theme-aware styling for side-by-side conflict comparison displays, such as comparing current budgets vs. import data.

### Purpose
When displaying conflicts (e.g., budget import conflicts), we need to visually distinguish between:
- **Current** data (existing in the system)
- **New** data (being imported)

### Available Variables

| Variable | Dark Mode | Light Mode | Usage |
|----------|-----------|------------|-------|
| **Current Budget Box** |
| `--conflict-current-bg` | `rgba(30, 41, 59, 0.5)` (slate-800) | `#fff7ed` (orange-50) | Background for current item |
| `--conflict-current-border` | `rgba(71, 85, 105, 0.5)` (slate-600) | `#fed7aa` (orange-200) | Border for current item |
| `--conflict-current-label` | `#94a3b8` (slate-400) | `#7c2d12` (orange-900) | Label text color |
| `--conflict-current-text` | `#f8fafc` (slate-50) | `#7c2d12` (orange-900) | Value text color |
| **New Budget Box** |
| `--conflict-new-bg` | `rgba(49, 46, 129, 0.2)` (indigo-900) | `#eff6ff` (blue-50) | Background for new item |
| `--conflict-new-border` | `rgba(99, 102, 241, 0.3)` (indigo-500) | `#bfdbfe` (blue-200) | Border for new item |
| `--conflict-new-label` | `#a5b4fc` (indigo-300) | `#1e3a8a` (blue-900) | Label text color |
| `--conflict-new-text` | `#f8fafc` (slate-50) | `#1e3a8a` (blue-900) | Value text color |

### Design Rationale

**Dark Mode:**
- **Current**: Neutral slate tones (no emphasis)
- **New**: Indigo accent (subtle emphasis on import data)

**Light Mode:**
- **Current**: Warm orange (keep existing)
- **New**: Cool blue (bring in new)
- High contrast for clear visual distinction

### Usage Pattern

**⚠️ CRITICAL**: Because Tailwind's `dark:` modifier doesn't work with our `data-theme` system, you **MUST** use CSS variables via inline `style` prop:

#### ❌ DO NOT Use Tailwind dark: Modifier
```jsx
// BAD - Won't respect data-theme switching
<div className="bg-orange-50 dark:bg-slate-800">
  Current Budget
</div>
```

#### ✅ ALWAYS Use CSS Variables via Inline Styles
```jsx
// GOOD - Adapts to theme automatically
<div 
  className="p-3 rounded-lg"
  style={{
    backgroundColor: 'var(--conflict-current-bg)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--conflict-current-border)'
  }}
>
  <p className="text-xs font-semibold mb-1" 
     style={{ color: 'var(--conflict-current-label)' }}>
    Current Budget
  </p>
  <div className="flex items-center gap-2">
    <span className="text-sm font-semibold" 
          style={{ color: 'var(--conflict-current-text)' }}>
      {existingBudget.limit}
    </span>
    <span className="text-xs" 
          style={{ color: 'var(--conflict-current-label)' }}>
      {existingBudget.currency}
    </span>
  </div>
</div>

<div 
  className="p-3 rounded-lg"
  style={{
    backgroundColor: 'var(--conflict-new-bg)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--conflict-new-border)'
  }}
>
  <p className="text-xs font-semibold mb-1" 
     style={{ color: 'var(--conflict-new-label)' }}>
    New Budget (from import)
  </p>
  {/* ... */}
</div>
```

### Implementation Reference
See [`BudgetImportModal.jsx`](file:///Users/huanzhang/code/Barbie/apps/frontend/src/components/budgets/BudgetImportModal.jsx) for complete implementation example.

---

## Glass Effects

### Available Glass Classes

| Class | Blur | Usage |
|-------|------|-------|
| `.glass-card` | 40px | Cards, modals, popups |
| `.glass-panel` | 30px | Sidebars, info boxes |
| `.glass` | 25px | General containers |

### Usage Example
```jsx
<div className="glass-card rounded-2xl p-6">
  <h3 className="text-lg font-semibold text-main">Card Title</h3>
  <p className="text-secondary">Card description</p>
</div>
```

### Glass Card Styling Notes
- Always pair with `rounded-2xl` or `rounded-xl`
- Use `p-4` or `p-6` for padding
- Border and shadow are handled automatically

---

## Form Elements

### Input Fields
All inputs automatically receive theme-aware styling via global CSS. Just use standard classes:

```jsx
// Standard input - NO need for bg/border colors
<input
  className="w-full rounded-lg px-3 py-2 text-sm"
  placeholder="Enter value"
/>

// With explicit dark theme styling (for components not inheriting global styles)
<input
  className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
/>
```

### Select Dropdowns
Use `<select>` for fixed ranges. Use `Intl.DateTimeFormat` for dates to allow localization.

```jsx
// Month selector (names)
<select
  className="w-32 rounded-lg px-3 py-2 text-sm"
  value={month}
  onChange={(e) => setMonth(Number(e.target.value))}
>
  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
    <option key={m} value={m}>
      {new Date(0, m - 1).toLocaleString('en-US', { month: 'long' })}
    </option>
  ))}
</select>

// Year selector (dynamic range)
<select
  className="w-full rounded-lg px-3 py-2 text-sm"
  value={year}
  onChange={(e) => setYear(Number(e.target.value))}
  required
>
    // Range: Current year + 10 future years (exclude past)
  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((y) => (
    <option key={y} value={y}>{y}</option>
  ))}
</select>
```

### Combobox / Searchable Select
For searchable dropdowns, use Headless UI Combobox with `anchor` positioning. This ensures the dropdown floats correctly above other content.

**Critical Styling Rules**:
- **Background**: Use `!bg-[var(--dropdown-bg)]` to ensure opacity in dark mode but glass effect in light mode.
- **Positioning**: Use `anchor="bottom start"` (Headless UI v2) to avoid z-index/overflow clipping.
- **Hover/Active**: Use `bg-[var(--list-item-hover)]` and `text-[var(--list-item-active-text)]`.

```jsx
<Combobox value={selected} onChange={setSelected}>
  <div className="relative">
    <Combobox.Input
      className="w-full !bg-[var(--input-bg)] !border-none text-[var(--input-text)]"
    />
    <Combobox.Options
      anchor="bottom start"
      className="z-[9999] w-[var(--input-width)] rounded-xl glass-card !bg-[var(--dropdown-bg)]"
    >
      {items.map((item) => (
        <Combobox.Option
          key={item.id}
          value={item}
          className={({ active }) =>
            `relative py-2 px-4 ${
              active ? 'bg-[var(--list-item-hover)] text-[var(--list-item-active-text)]' : 'text-main'
            }`
          }
        >
          {item.name}
        </Combobox.Option>
      ))}
    </Combobox.Options>
  </div>
</Combobox>
```

### CSS Variables for Lists
- `--dropdown-bg`: The background color of the dropdown list.
  - Dark Mode: `rgba(15, 23, 42, 0.95)` (Nearly opaque)
  - Light Mode: `var(--glass-card-bg)` (Glassy white)
- `--list-item-hover`: Background color for hovered items.
- `--list-item-active-text`: Text color for hovered/active items.
- `--list-item-selected-text`: Text color for selected (checked) items.

### Form Input Styling Reference
CSS variables for inputs:
- `--input-bg`: Background color
- `--input-border`: Border color
- `--input-text`: Text color
- `--input-placeholder`: Placeholder color
- `--input-focus-border`: Focus border color
- `--input-focus-ring`: Focus ring color

---

## Component Patterns

### Card with Summary Data
```jsx
<Motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  className="rounded-2xl glass-card p-4"
>
  <p className="text-sm text-secondary">Label</p>
  <p className="mt-2 text-2xl font-semibold text-main">
    {formatCurrency(value, currency)}
  </p>
</Motion.div>
```

### Section Header
```jsx
<div className="space-y-3">
  <p className="text-sm font-semibold text-indigo-400">Section Tag</p>
  <h1 className="text-3xl font-bold text-main">Page Title</h1>
  <p className="text-sm text-secondary">
    Description text explaining this section.
  </p>
</div>
```

### Auth Forms (Login/Register)
Auth form components must NOT use hardcoded light theme colors:

```jsx
// ❌ BAD - Hardcoded white background
<form className="bg-white border-slate-200 text-slate-700">

// ✅ GOOD - Theme-aware
<form className="space-y-4">
  <label className="text-sm font-medium text-muted">Email</label>
  <input
    className="rounded-lg bg-slate-800/50 border border-slate-700 text-main"
  />
</form>
```

---

## Charts

### Recharts Integration
All charts use Recharts with theme-aware styling.

### Color Constants
Import from `src/data/mockChartData.js`:
```javascript
import { CHART_COLORS } from '../data/mockChartData'

// Available:
CHART_COLORS.income    // '#10b981' (emerald-500)
CHART_COLORS.expense   // '#f43f5e' (rose-500)
CHART_COLORS.savings   // '#3b82f6' (blue-500)
CHART_COLORS.categories // Array of 10 colors
CHART_COLORS.status    // { healthy, warning, critical, exceeded }
```

### Chart Grid Lines
Grid lines use CSS variable `--chart-grid-line`:
- Dark mode: `rgba(255, 255, 255, 0.1)`
- Light mode: `rgba(0, 0, 0, 0.1)`

Already handled in global CSS:
```css
.recharts-cartesian-grid-horizontal line,
.recharts-cartesian-grid-vertical line {
  stroke: var(--chart-grid-line);
}
```

### Custom Tooltip Pattern
```jsx
<div className="chart-tooltip glass-card rounded-xl px-4 py-3 shadow-lg">
  <p className="text-sm font-semibold text-main">{label}</p>
  <div className="text-secondary">...</div>
</div>
```

### Legend Deduplication
When using `ComposedChart` with both `Area` and `Line` for the same dataKey, add `legendType="none"` to `Area`:
```jsx
<Area dataKey="income" legendType="none" />
<Line dataKey="income" name="Income" />
```

### Chart Item Hover Effects
For interactive list items in charts (legend items, progress bars, etc.), use theme-aware hover classes:

| Class | Purpose |
|-------|---------|
| `.chart-item-hover` | Base hover transition |
| `.chart-item-active` | Active/selected state |

CSS Variables:
- `--chart-item-hover-bg`: Background on hover
  - Dark: `rgba(255, 255, 255, 0.1)` 
  - Light: `rgba(0, 0, 0, 0.06)`
- `--chart-item-hover-shadow`: Shadow on hover
  - Dark: `0 4px 12px rgba(0, 0, 0, 0.3)`
  - Light: `0 4px 16px rgba(0, 0, 0, 0.15)` ← Darker for visibility

```jsx
// ❌ BAD - Hardcoded opacity that's invisible in light mode
<div className={`${isHovered ? 'bg-white/10' : 'hover:bg-white/5'}`}>

// ✅ GOOD - Theme-aware hover classes
<div className={`chart-item-hover ${isHovered ? 'chart-item-active' : ''}`}>
```

> **Light Mode Consideration**: The glass-card background is very light, so hover shadows must be darker (0.15+ opacity) to be visible.

### Skeleton Loading
Use the standard Skeleton pattern for charts waiting for data, instead of random placeholders.

```jsx
import ChartSkeleton from '../components/common/ChartSkeleton'

// ...
{isLoading ? (
  <ChartSkeleton height={300} />
) : (
  <ChartComponent data={data} />
)}
```

### Compact Axis Formatting
For Chart Y-Axes, use compact formatting for large numbers but raw numbers for small values (< 1000) to ensure readability.

```javascript
tickFormatter={(value) => {
    // 1000 -> 1k, 1500 -> 1.5k, 500 -> 500
    if (value >= 1000) {
        return `$${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`
    }
    return `$${value}`
}}
```

### ⚠️ Chart Currency Props
All chart components that display monetary values MUST accept a `currency` prop and use `formatCurrency()`:

```jsx
// ✅ GOOD - Pass currency to chart components
<TrendLineChart data={trendData} currency={currency} />
<CategoryPieChart data={categoryData} currency={currency} />
<MonthlyComparisonChart data={comparisonData} currency={currency} />
<BudgetProgressBars data={budgetData} currency={currency} />
```

Chart Y-axis formatting with dynamic currency symbol:
```javascript
tickFormatter={(value) => {
    const formatted = formatCurrency(1, currency)
    const symbol = formatted.replace(/[\d,\.\s]/g, '')
    if (value >= 1000) {
        return `${symbol}${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`
    }
    return formatCurrency(value, currency)
}}
```

### 🚫 No Internal Formatting Logic
Chart components should **NEVER** contain internal currency formatting logic (e.g., hardcoded `$` or local `Intl.NumberFormat` instances).
Always import and use the shared utility:
```javascript
import { formatCurrency } from '../../utils/formatCurrency'
// ...
{formatCurrency(value, currency)}
```

---

## Animation Guidelines

### Framer Motion Import
```javascript
import { motion as Motion } from 'framer-motion'
```

### Standard Entry Animation
```jsx
<Motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
```

### Staggered List Animation
```jsx
<Motion.div
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.4, delay: index * 0.1 }}
>
```

---

## Currency Formatting

### The `formatCurrency` Utility
Always use the utility function for displaying monetary values:

```javascript
import { formatCurrency } from '../utils/formatCurrency'

// Usage
formatCurrency(1234.56, 'USD')  // "$1,235"
formatCurrency(1234.56, 'CNY')  // "CN¥1,235"
formatCurrency(1234.56, 'EUR')  // "€1,235"
formatCurrency(1234.56, 'CAD')  // "CA$1,235"
```

### ❌ NEVER Hardcode Currency Symbols
```jsx
// ❌ BAD - Hardcoded $ symbol
<p>${value.toLocaleString()}</p>

// ✅ GOOD - Uses user's default currency
<p>{formatCurrency(value, currency)}</p>
```

### Getting User's Default Currency
```javascript
// In components, get currency from user object in store
const user = useStore((state) => state.user)
const currency = user?.defaultCurrency || 'USD'
```

### Chart Components
All chart components displaying monetary values must:
1. Accept a `currency` prop
2. Use `formatCurrency()` for all displayed amounts
3. Extract symbol for compact axis labels

See [Chart Currency Props](#-chart-currency-props) section above.

---

## Cache Management

This application uses **React Query** for server state management. Understanding cache invalidation is critical for data consistency.

### QueryClient Configuration
Located in `src/lib/queryClient.js`:

| Config | Value | Description |
|--------|-------|-------------|
| `staleTime` | 60s | Data is fresh for 1 minute |
| `gcTime` | 5min | Garbage collect after 5 minutes |
| `retry` | 1 | Only retry once on failure |
| `refetchOnWindowFocus` | false | Don't auto-refetch on window focus |

### Query Key Factories
Query keys are defined in hook files:

```javascript
// src/hooks/queries/useBudgetQueries.js
export const budgetKeys = {
    all: ['budgets'],
    lists: () => [...budgetKeys.all, 'list'],
    list: (filters) => [...budgetKeys.lists(), filters],
    summaries: () => [...budgetKeys.all, 'summary'],
    summary: (filters) => [...budgetKeys.summaries(), filters],
}

// src/hooks/useChartData.js
export const analyticsKeys = {
    all: ['analytics'],
    trend: (params) => ['analytics', 'trend', params],
    categoryBreakdown: (params) => ['analytics', 'category-breakdown', params],
    // ...
}
```

### Cache Invalidation Patterns

#### When Creating/Updating/Deleting Data
Use mutation hooks that automatically invalidate related caches:

```javascript
// In useExpenseQueries.js
export function useCreateExpense() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createExpense,
        onSuccess: () => {
            // Expenses affect budget summaries and analytics
            queryClient.invalidateQueries({ queryKey: expenseKeys.all })
            queryClient.invalidateQueries({ queryKey: budgetKeys.all })
            queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
        },
    })
}
```

#### Cross-Service Invalidation Rules

| Action | Invalidates |
|--------|-------------|
| Create/Update/Delete **Expense** | `expenseKeys.all`, `budgetKeys.all`, `analyticsKeys.all` |
| Create/Update/Delete **Income** | `incomeKeys.all`, `analyticsKeys.all` |
| Create/Update/Delete **Budget** | `budgetKeys.all`, `analyticsKeys.all` |
| Create/Update/Delete **Subscription** | `subscriptionKeys.all` |
| **User updates default currency** | ALL dashboard keys (see below) |
| **Login** | `queryClient.clear()` |
| **Logout** | `queryClient.clear()` |

#### Currency Change Invalidation
When user changes their default currency in Profile, ALL dashboard-related caches must be invalidated:

```javascript
// In Profile.jsx handleSubmit
if (defaultCurrency !== previousCurrency) {
    queryClient.invalidateQueries({ queryKey: budgetKeys.all })
    queryClient.invalidateQueries({ queryKey: incomeKeys.all })
    queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    queryClient.invalidateQueries({ queryKey: subscriptionKeys.all })
    queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
}
```

### ⚠️ Important Cache Considerations

1. **Always include `userId` in query keys** for user-specific data
2. **Invalidate related caches** when data changes (e.g., expenses affect budgets)
3. **Clear all cache on login/logout** to prevent data leakage between users
4. **Currency changes require full invalidation** since amounts need to be reformatted

### Manual Cache Invalidation
For pages using direct service calls (not mutation hooks), manually invalidate:

```javascript
const queryClient = useQueryClient()

// After successful operation
queryClient.invalidateQueries({ queryKey: relevantKeys.all })
```

---

## Code Conventions

### File Structure
```
src/
├── components/
│   ├── auth/           # LoginForm, RegisterForm
│   ├── charts/         # Chart components
│   ├── common/         # Shared components
│   └── dashboard/      # Dashboard-specific
├── data/               # Mock data, constants
├── hooks/              # Custom hooks
│   └── queries/        # React Query hooks
├── pages/              # Page components
├── services/           # API services
├── store/              # Zustand store
├── styles/             # Global CSS
└── utils/              # Utility functions
```

### Naming Conventions
- Components: `PascalCase` (`TrendLineChart.jsx`)
- Hooks: `camelCase` with `use` prefix (`useChartData.js`)
- Services: `camelCase` (`budgetService.js`)
- CSS classes: `kebab-case` (`glass-card`)

### React Query Keys
Define query keys as objects in query hook files:
```javascript
export const budgetKeys = {
  all: ['budgets'],
  list: (filters) => ['budgets', 'list', filters],
  summary: (filters) => ['budgets', 'summary', filters],
}
```

### Date Formatting
Use `Date.UTC()` for timezone-safe date handling in queries:
```javascript
const startDate = new Date(Date.UTC(year, month - 1, 1))
const endDate = new Date(Date.UTC(year, month, 1))
```

---

## Quick Reference Checklist

Before submitting any UI code, verify:

- [ ] All text uses `text-main`, `text-secondary`, or `text-muted` (not hardcoded colors)
- [ ] Cards use `glass-card` class with `rounded-2xl`
- [ ] Inputs work in both light and dark mode
- [ ] No hardcoded `bg-white` or `text-white` in components
- [ ] Charts use CSS variable for grid lines
- [ ] Framer Motion uses `Motion` alias
- [ ] Currency values use `formatCurrency()` utility with user's default currency
- [ ] Chart components (including `BudgetProgressBars`) receive `currency` prop
- [ ] NO internal currency formatting logic in components - always import utility
- [ ] Month/Year selectors use `<select>` dropdowns, not number inputs
- [ ] Mutations invalidate all related caches (including analytics for financial data)
- [ ] User-specific queries include `userId` in query key

---

## Admin Dashboard UI Patterns

The admin dashboard uses a **purple accent theme** to distinguish it from the user-facing app (which uses indigo).

### File Structure
```
src/
├── components/admin/
│   └── AdminLayout.jsx        # Sidebar navigation + session timer
├── pages/admin/
│   ├── AdminLogin.jsx         # Dedicated admin login
│   ├── AdminDashboard.jsx     # Platform KPIs + charts
│   ├── AdminUsers.jsx         # User management table
│   ├── AdminFinancials.jsx    # Financial analytics
│   └── AdminSubscriptions.jsx # Subscription health
├── services/
│   └── adminService.js        # Dedicated admin API client
└── store/slices/
    └── adminAuthSlice.js      # Separate from user auth
```

### Admin Route Structure
```jsx
// App.jsx - Admin routes are completely separate
if (isAdminRoute) {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        {/* ... */}
      </Route>
    </Routes>
  )
}
```

### Admin Color Scheme
| Element | User App | Admin Dashboard |
|---------|----------|-----------------|
| Primary accent | `indigo-500` | `purple-500` |
| Active nav | `bg-indigo-500/20` | `bg-purple-500/20` |
| Buttons | `from-indigo-500` | `from-purple-500` |

### Session Management
- **Auto-logout**: Sessions expire after 30 minutes
- **Session timer**: Displayed in sidebar, shows remaining time
- **Click to refresh**: Clicking the timer refreshes the session
- **Expiry warning**: Timer turns red when < 5 minutes remaining

### Reusing Chart Components
Admin pages reuse the same chart components as the user dashboard:
```jsx
import { TrendLineChart, CategoryPieChart } from '../../components/charts'

// Same props, just with platform-wide data
<TrendLineChart data={platformTrendData} currency="USD" />
```


