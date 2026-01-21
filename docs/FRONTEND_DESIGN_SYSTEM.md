# Frontend Design System & Code Standards

This document defines the UI patterns, styling conventions, and code standards for the Barbie frontend application. Follow these guidelines to maintain consistency across all components.

---

## Table of Contents
- [Design Philosophy](#design-philosophy)
- [Theme System](#theme-system)
- [Text Colors](#text-colors)
- [Glass Effects](#glass-effects)
- [Form Elements](#form-elements)
- [Component Patterns](#component-patterns)
- [Charts](#charts)
- [Animation Guidelines](#animation-guidelines)
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

### Currency Formatting
Always use the utility function:
```javascript
import { formatCurrency } from '../utils/formatCurrency'

// Usage
formatCurrency(1234.56, 'CAD') // "$1,234.56"
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
- [ ] Currency values use `formatCurrency()` utility
- [ ] Month/Year selectors use `<select>` dropdowns, not number inputs
