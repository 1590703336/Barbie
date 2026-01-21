# Analytics API Documentation

This document describes the generic analytics API endpoints required for dashboard charts and data analysis features. All endpoints are designed to be flexible and reusable for various use cases (user dashboard, admin dashboard, reports, etc.).

## Table of Contents
- [Design Principles](#design-principles)
- [Common Parameters](#common-parameters)
- [Endpoints](#endpoints)
  - [1. Trend Data API](#1-trend-data-api)
  - [2. Category Breakdown API](#2-category-breakdown-api)
  - [3. Monthly Comparison API](#3-monthly-comparison-api)
  - [4. Budget Usage API](#4-budget-usage-api)

---

## Design Principles

1. **Generic Date Range**: All endpoints accept flexible `startDate` and `endDate` parameters instead of hardcoded periods
2. **Granularity Control**: Support different time groupings (daily, weekly, monthly, yearly)
3. **Reusable**: Same endpoints work for user dashboards, admin dashboards, and reports
4. **Pagination Ready**: Large datasets support pagination
5. **Currency Agnostic**: All monetary values returned in user's preferred currency (converted server-side)

---

## Common Parameters

### Date Filtering

To maintain consistency with existing APIs (`/budgets`, `/expenses`, `/income`), endpoints support **two** date filtering modes:

**Option A: Month/Year (Preferred for single-month queries)**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `month` | `number` | Yes | Month (1-12) |
| `year` | `number` | Yes | Year (e.g., 2026) |

**Option B: Date Range (For multi-month queries)**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | `string` (ISO 8601) | Yes | Start date, e.g., `2026-01-01` |
| `endDate` | `string` (ISO 8601) | Yes | End date, e.g., `2026-06-30` |

> **Important**: Backend should use `Date.UTC()` for all date calculations to avoid timezone issues, matching the pattern in `expense.service.js` and `income.controllers.js`.

### Other Common Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `granularity` | `string` | No | Time grouping: `daily`, `weekly`, `monthly`, `yearly`. Default: `monthly` |
| `userId` | `string` | No | Target user ID. If omitted, uses authenticated user. Admin can query any user. |

---

## Endpoints

### 1. Trend Data API

**Purpose**: Get income and expense totals over a time period, grouped by the specified granularity. Used for line charts showing financial trends.

```
GET /api/analytics/trend
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `granularity` | `string` | No | `monthly` | `weekly` \| `monthly` \| `yearly` |
| `count` | `number` | No | `12` | Number of periods to return (e.g., 12 weeks, 12 months, 12 years) |
| `startDate` | `string` | No | - | Start date (ISO 8601). Alternative to count-based query. |
| `endDate` | `string` | No | - | End date (ISO 8601). Alternative to count-based query. |
| `userId` | `string` | No | Current user | Target user ID (admin only for other users) |

> **Frontend Usage**: The dashboard uses `granularity` + `count` approach.
> - Weekly: Last 12 weeks (granularity=weekly, count=12)
> - Monthly: Last 12 months (granularity=monthly, count=12)
> - Yearly: Last 12 years (granularity=yearly, count=12)

#### Response

```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2025-07-01",
      "end": "2026-01-31",
      "granularity": "monthly"
    },
    "currency": "CAD",
    "series": [
      {
        "date": "2025-07",
        "income": 5200.00,
        "expense": 3100.50,
        "savings": 2099.50
      },
      {
        "date": "2025-08",
        "income": 5200.00,
        "expense": 2850.00,
        "savings": 2350.00
      },
      {
        "date": "2025-09",
        "income": 5500.00,
        "expense": 3200.00,
        "savings": 2300.00
      }
      // ... more months
    ],
    "totals": {
      "income": 31200.00,
      "expense": 18500.50,
      "savings": 12699.50
    }
  }
}
```

#### Use Cases

- **收支趋势折线图 (Trend Line Chart)**: Display 12 periods of income vs expense trends (weekly/monthly/yearly selectable)
- **Admin Dashboard**: View all users' financial trends over arbitrary periods
- **Annual Report**: Yearly breakdown of finances

---

### 2. Category Breakdown API

**Purpose**: Get expense or income breakdown by category for a given period. Used for pie/donut charts.

```
GET /api/analytics/category-breakdown
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `month` | `number` | Conditional | - | Month (1-12). Preferred for single-month view. |
| `year` | `number` | Conditional | - | Year (e.g., 2026). |
| `startDate` | `string` | Conditional | - | Start date (ISO 8601). Alternative to month/year. |
| `endDate` | `string` | Conditional | - | End date (ISO 8601). |
| `type` | `string` | No | `expense` | `expense` \| `income` \| `both` |
| `limit` | `number` | No | `10` | Max categories to return (others grouped as "Other") |
| `userId` | `string` | No | Current user | Target user ID |

#### Response

```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2026-01-01",
      "end": "2026-01-31"
    },
    "currency": "CAD",
    "type": "expense",
    "total": 3200.50,
    "categories": [
      {
        "category": "Food",
        "amount": 850.00,
        "percentage": 26.56,
        "count": 45
      },
      {
        "category": "Transport",
        "amount": 420.00,
        "percentage": 13.12,
        "count": 22
      },
      {
        "category": "Entertainment",
        "amount": 380.00,
        "percentage": 11.87,
        "count": 15
      },
      {
        "category": "Utilities",
        "amount": 350.00,
        "percentage": 10.94,
        "count": 5
      },
      {
        "category": "Shopping",
        "amount": 520.00,
        "percentage": 16.25,
        "count": 12
      },
      {
        "category": "Others",
        "amount": 680.50,
        "percentage": 21.26,
        "count": 28
      }
    ]
  }
}
```

#### Use Cases

- **支出分类环形图 (Category Pie Chart)**: Monthly expense breakdown
- **Income Sources**: Show where income comes from
- **Admin Analytics**: Category spending patterns across all users

---

### 3. Monthly Comparison API

**Purpose**: Compare income, expenses, and savings across multiple months. Used for bar charts showing month-over-month comparison.

```
GET /api/analytics/monthly-comparison
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `months` | `number` | Conditional | `6` | Number of trailing months to compare. **Frontend default: 6** |
| `startDate` | `string` | Conditional | - | Start date (ISO 8601). Alternative to `months`. |
| `endDate` | `string` | Conditional | - | End date (ISO 8601). |
| `includeCategories` | `boolean` | No | `false` | Include category-level breakdown per month |
| `categories` | `string` | No | - | Comma-separated category names to filter |
| `userId` | `string` | No | Current user | Target user ID |

> **Frontend Usage**: Dashboard requests last 6 months for monthly comparison chart.

#### Response

```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2025-10-01",
      "end": "2026-01-31"
    },
    "currency": "CAD",
    "months": [
      {
        "month": "2025-10",
        "income": 5200.00,
        "expense": 3100.00,
        "savings": 2100.00,
        "savingsRate": 40.38
      },
      {
        "month": "2025-11",
        "income": 5200.00,
        "expense": 4200.00,
        "savings": 1000.00,
        "savingsRate": 19.23
      },
      {
        "month": "2025-12",
        "income": 6500.00,
        "expense": 5100.00,
        "savings": 1400.00,
        "savingsRate": 21.54
      },
      {
        "month": "2026-01",
        "income": 5200.00,
        "expense": 3200.00,
        "savings": 2000.00,
        "savingsRate": 38.46
      }
    ],
    "averages": {
      "income": 5525.00,
      "expense": 3900.00,
      "savings": 1625.00,
      "savingsRate": 29.41
    }
  }
}
```

#### Use Cases

- **月度对比柱状图 (Monthly Comparison Bar Chart)**: Visual comparison across months
- **Savings Trend Analysis**: Track saving rate over time
- **Budget Planning**: Historical data for future budget decisions

---

### 4. Budget Usage API

**Purpose**: Get budget utilization data per category for a specific period. Used for progress bars showing spending vs budget.

```
GET /api/analytics/budget-usage
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `month` | `number` | Yes | - | Month (1-12) |
| `year` | `number` | Yes | - | Year (e.g., 2026) |
| `sortBy` | `string` | No | `usage` | `usage` \| `budget` \| `remaining` \| `category` |
| `sortOrder` | `string` | No | `desc` | `asc` \| `desc` |
| `userId` | `string` | No | Current user | Target user ID |

#### Response

```json
{
  "success": true,
  "data": {
    "period": {
      "month": 1,
      "year": 2026
    },
    "currency": "CAD",
    "summary": {
      "totalBudget": 4000.00,
      "totalSpent": 2850.00,
      "totalRemaining": 1150.00,
      "overallUsage": 71.25
    },
    "categories": [
      {
        "category": "Food",
        "budget": 800.00,
        "spent": 720.00,
        "remaining": 80.00,
        "usage": 90.00,
        "status": "warning"
      },
      {
        "category": "Transport",
        "budget": 400.00,
        "spent": 380.00,
        "remaining": 20.00,
        "usage": 95.00,
        "status": "critical"
      },
      {
        "category": "Entertainment",
        "budget": 300.00,
        "spent": 150.00,
        "remaining": 150.00,
        "usage": 50.00,
        "status": "healthy"
      },
      {
        "category": "Utilities",
        "budget": 500.00,
        "spent": 500.00,
        "remaining": 0.00,
        "usage": 100.00,
        "status": "exceeded"
      },
      {
        "category": "Shopping",
        "budget": 600.00,
        "spent": 450.00,
        "remaining": 150.00,
        "usage": 75.00,
        "status": "warning"
      }
    ]
  }
}
```

#### Status Values

| Status | Usage Range | Color Suggestion |
|--------|-------------|------------------|
| `healthy` | 0% - 70% | Green |
| `warning` | 70% - 90% | Yellow/Orange |
| `critical` | 90% - 100% | Red |
| `exceeded` | > 100% | Dark Red |

#### Use Cases

- **预算使用进度条 (Budget Progress Bars)**: Visual budget tracking
- **Budget Alerts**: Identify categories needing attention
- **Admin View**: Monitor users' budget health

---

## Error Responses

All endpoints follow a consistent error format:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_DATE_RANGE",
    "message": "startDate must be before endDate"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_DATE_RANGE` | 400 | Start date is after end date |
| `MISSING_REQUIRED_PARAM` | 400 | Required parameter not provided |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Cannot access other user's data |
| `USER_NOT_FOUND` | 404 | Specified userId does not exist |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Implementation Priority

For the current dashboard charts feature, implement in this order:

1. **[✅ DONE]** Budget Usage API - `GET /api/v1/analytics/budget-usage`
2. **[✅ DONE]** Trend Data API - `GET /api/v1/analytics/trend`
3. **[✅ DONE]** Category Breakdown API - `GET /api/v1/analytics/category-breakdown`
4. **[✅ DONE]** Monthly Comparison API - `GET /api/v1/analytics/monthly-comparison`

> **Note**: All analytics APIs are now implemented in `apps/backend/src/modules/analytics/`. Frontend hooks in `useChartData.js` use React Query to call these APIs with mock data as placeholders.

---

## Frontend-Backend Integration Reference

### Current Frontend Chart Data Calls

This section documents exactly how the frontend currently calls each chart hook, so backend developers know what parameters to expect:

| Chart | Hook | Parameters | Notes |
|-------|------|------------|-------|
| **Income & Expense Trend** | `useTrendData` | `{ granularity: 'weekly'|'monthly'|'yearly', count: 12 }` | User-selectable granularity via dropdown |
| **Expense Breakdown** | `useCategoryBreakdown` | `{ type: 'expense', month, year }` | Uses dashboard's selected month/year |
| **Budget Usage** | `useBudgetUsage` | `{ month, year, budgetSummary }` | Uses selected month/year |
| **Monthly Comparison** | `useMonthlyComparison` | `{ months: 6 }` | Shows last 6 months |

### Backend Implementation Checklist

- [x] `GET /api/v1/analytics/trend` - Accept `granularity` and `count` parameters
- [x] `GET /api/v1/analytics/category-breakdown` - Accept `type`, `month`, `year` parameters
- [x] `GET /api/v1/analytics/monthly-comparison` - Accept `months` parameter (default: 6)
- [x] `GET /api/v1/analytics/budget-usage` - Accept `month`, `year` parameters
- [x] Ensure all date calculations use `Date.UTC()` for timezone safety

### Implementation Files

| File | Description |
|------|-------------|
| `apps/backend/src/modules/analytics/analytics.controllers.js` | API controllers |
| `apps/backend/src/modules/analytics/analytics.services.js` | Aggregation pipelines and utilities |
| `apps/backend/src/modules/analytics/analytics.routes.js` | Route definitions |
| `apps/frontend/src/services/analyticsService.js` | Frontend API service |
| `apps/frontend/src/hooks/useChartData.js` | React Query hooks |

