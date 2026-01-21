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
| `startDate` | `string` | Conditional | - | Start date (ISO 8601). Required if `month`/`year` not provided. |
| `endDate` | `string` | Conditional | - | End date (ISO 8601). Required if `month`/`year` not provided. |
| `month` | `number` | Conditional | - | Month (1-12). Alternative to startDate/endDate for recent N months. |
| `year` | `number` | Conditional | - | Year. Used with `month` or alone for yearly. |
| `months` | `number` | No | 6 | Number of trailing months to include (convenience param). |
| `granularity` | `string` | No | `monthly` | `daily` \| `weekly` \| `monthly` \| `yearly` |
| `userId` | `string` | No | Current user | Target user ID (admin only for other users) |

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

- **收支趋势折线图 (Trend Line Chart)**: Display 6-month income vs expense trends
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
| `months` | `number` | Conditional | 4 | Number of trailing months to compare. |
| `startDate` | `string` | Conditional | - | Start date (ISO 8601). Alternative to `months`. |
| `endDate` | `string` | Conditional | - | End date (ISO 8601). |
| `includeCategories` | `boolean` | No | `false` | Include category-level breakdown per month |
| `categories` | `string` | No | - | Comma-separated category names to filter |
| `userId` | `string` | No | Current user | Target user ID |

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

1. **[已有/Existing]** Budget Usage API - Mostly covered by existing `getBudgetStatisticsController`
2. **[新增/New]** Trend Data API - Required for line chart
3. **[新增/New]** Category Breakdown API - Required for pie chart  
4. **[新增/New]** Monthly Comparison API - Required for bar chart

> **Note**: The current frontend implementation will use **mock data** until these APIs are ready. The API contracts above ensure future backend development is straightforward.
