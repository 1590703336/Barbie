# Backend Design System & Architecture Guide

This document defines the architectural standards, design patterns, and coding guidelines for the Barbie Project backend. All contributors must adhere to these rules to maintain maintainability, security, and scalability.

## 1. Architectural Overview

The backend follows a **Modular Layered Architecture**. Each feature is encapsulated in its own module, and within each module, responsibilities are strictly separated into four layers.

### The 4-Layer Pattern

1.  **Routes (`*.routes.js`)**: Defines API endpoints and maps them to controllers. Applies middleware (auth, validation).
2.  **Controllers (`*.controller.js`)**: Handles HTTP requests `(req, res)`. Orchestrates the flow, handles authorization checks, and sends responses. **Does not contain business logic or DB queries.**
3.  **Services (`*.service.js`)**: Pure business logic. Performs calculations, data transformation, and prepares data for the repository. **Does not access the database directly.**
4.  **Repositories (`*.repository.js`)**: The **ONLY** layer allowed to access the database. Contains all Mongoose queries (`find`, `create`, `aggregate`).

## 2. Directory Structure

```
apps/backend/src/
├── config/             # Environment & app configuration
├── middlewares/        # Express middlewares (Auth, Validation, Error)
├── modules/            # Feature modules (The core logic)
│   ├── expenses/
│   │   ├── expense.routes.js
│   │   ├── expense.controller.js
│   │   ├── expense.service.js
│   │   ├── expense.repository.js  <-- The Guard of the Database
│   │   ├── expense.model.js
│   │   └── expense.validation.js
│   └── auth/           
├── utils/              # Shared utilities (Authorization helpers, etc.)
└── app.js              # App entry point
```

## 3. Strict Development Rules

### Rule #1: Database Isolation (The Repository Pattern)
*   ❌ **NEVER** use Mongoose models (`Model.find`, `Model.create`) in Controllers or Services.
*   ✅ **ALWAYS** use Repository functions (`Repository.findByUser`, `Repository.create`).
*   **Why?** This decouples business logic from the database, making testing easier and allowing future database changes without breaking logic.

### Rule #2: Controller Responsibilities
Controllers are "Traffic Cops". They verify:
1.  **Who are you?** (Auth Middleware handles this).
2.  **Are you allowed?** (Call `assertOwnerOrAdmin` from utils).
3.  **Is data valid?** (Validation Middleware or Service helpers).
4.  **Action:** Call Service/Repository.
5.  **Response:** Return JSON.

### Rule #3: Services are Pure(ish)
Services should focus on *logic*.
*   Calculating totals (e.g., `calculateTotalExpenses`).
*   Currency conversion (e.g., calling `convertToUSD` helper).
*   Preparing complex DB queries (returning pipelines, not executing them).

### Rule #4: Timezone & Date Handling
Date consistency is critical.
*   ❌ **AVOID** `new Date()` (Local Server Time) for logic.
*   ✅ **ALWAYS** use **UTC** when constructing dates for ranges or storage.
*   **Pattern:**
    ```javascript
    // Correct way to query a specific month range
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    ```

### Rule #5: Authorization
*   Never assume a user can access a resource just because they are logged in.
*   Use `src/utils/authorization.js`:
    ```javascript
    import { assertOwnerOrAdmin } from '../../utils/authorization.js';
    
    // In Controller
    const resource = await Repository.findById(id);
    assertOwnerOrAdmin(resource.user, req.user);
    ```

### Rule #6: External API & Caching
*   **Isolation**: External API calls (e.g., currency, payments) must happen **only** in the Service layer.
*   **Caching**: Expensive or rate-limited external calls **must** be cached.
    *   **Short-term**: 5-10 mins for volatile data (e.g., live rates).
    *   **Long-term**: 24h+ for historical/stable data.


## 4. API & Error Handling

### Request Validation
Use Joi schemas in `*.validation.js` and the `validate` middleware in routes.

```javascript
router.post('/', validate(createExpenseSchema), controller.create);
```

### Error Responses
Use the global error handler. Pass errors to `next(err)`.
Use `buildError` utility for predictable status codes.

```javascript
import { buildError } from '../../utils/authorization.js';

if (!resource) {
  return next(buildError('Resource not found', 404));
}
```

## 5. Testing Guidelines

We use **Jest** for unit testing. Tests must be **Isolated** and **Fast**.

### Mocking Strategy (Unit Tests)
When testing a Controller:
1.  **Mock the Repository**: Ensure no real DB calls are made.
2.  **Mock the Service**: control the business logic output.
3.  **Mock Authorization**: Bypass complex role checks.

**Example `apps/backend/tests/expense.refactor.test.js` pattern:**
```javascript
import { jest } from '@jest/globals';

// 1. Define Mocks
const mockRepo = { create: jest.fn() };
const mockService = { prepareData: jest.fn() };

// 2. Unstable Mock Module (for ESM)
jest.unstable_mockModule('../path/to/repo', () => mockRepo);
jest.unstable_mockModule('../path/to/service', () => mockService);

// 3. Dynamic Import (Crucial for ESM mocking)
const { createController } = await import('../path/to/controller');

// 4. Test logic
it('should create expense', async () => {
  mockRepo.create.mockResolvedValue(result);
  await createController(req, res, next);
  expect(mockRepo.create).toHaveBeenCalled();
});
```

## 6. Data Visualization & Chart Standards

To prevent mismatches between frontend chart libraries (e.g., Recharts) and backend data, adhere to these rules:

### Rule #1: Domain-Specific Fields
*   ❌ **AVOID** generic field names like `count`, `value`, or `data`.
*   ✅ **USE** domain-specific names: `newUsers`, `activeSubscriptions`, `totalIncome`, `expenseAmount`.
*   **Why?** Frontend components often map multiple data lines. `count` is ambiguous when plotting "New Users" vs "Total Users".

### Rule #2: Cumulative Totals
*   When a chart shows growth (e.g., User Growth), **ALWAYS** return the cumulative total alongside the periodic count.
*   **Do not** rely on the frontend to calculate running totals, as it requires fetching all historical data.

### Rule #3: Response Format Example
```javascript
// GET /api/admin/users/growth
{
  "success": true,
  "data": [
    {
      "period": "2025-01",
      "newUsers": 50,      // Specific
      "totalUsers": 1200   // Cumulative (Pre-calculated)
    },
    {
      "period": "2025-02",
      "newUsers": 80,
      "totalUsers": 1280
    }
  ]
}
  ]
}
```

### Rule #4: Server-Side Aggregation
*   **Performance**: For large datasets (e.g., yearly history), **do not** send thousands of raw data points to the frontend.
*   **Aggregation**: Aggregate data on the server based on the requested view (granularity).
    *   **Weekly View**: Daily points.
    *   **Monthly View**: Weekly averages.
    *   **Yearly View**: Monthly averages.


## 7. Module Spotlight: Budgets Architecture

The **Budgets Module** is a complex example that demonstrates cross-module interaction and specialized logic.

### Structure
```
modules/budgets/
├── budget.controller.js  # Orchestrates Budgets + Expenses data
├── budget.service.js     # Budget-specific logic (USD conversion)
├── budget.repository.js  # DB Access for Budgets
├── budgetAlertService.js # ⚠️ Specialized Cross-Functional Service
└── ...
```

### Key Components

#### 1. The Controller (`budget.controllers.js`)
*   **Role:** The Aggregator.
*   **Behavior:** It fetches data from *multiple* repositories to build a summary.
*   **Example (`getBudgetStatisticsController`):**
    1.  Calls `budgetService.buildMonthlyStatsPipeline(...)`
    2.  Calls `expenseService.buildMonthlyStatsPipeline(...)`
    3.  Executes both pipelines via `budgetRepository` and `expenseRepository`.
    4.  Merges the results in memory.
    5.  Converts USD values back to the user's preferred currency using `currencyService`.

#### 2. The Alert Service (`budgetAlertService.js`)
*   **Role:** The Watchdog.
*   **Logic:**
    -   Accepts `userId`, `category`, `month`, `year`.
    -   Fetches the relevant Budget.
    -   Aggregates total expenses for that period (Cross-module data access).
    -   Compares spending vs. limit.
    -   **Stateful:** Updates `budget.alertsTriggered` map in the DB to prevent duplicate alerts for the same threshold (e.g., 80%, 100%).

### Cross-Module Rules (Budgets <-> Expenses)
*   **Read-Only:** The budget module *reads* expense data to calculate statistics and alerts.
*   **Independence:** Expenses do not fetch budget data (One-way dependency preferred).

## 8. Security Checklist

-   [ ] **Rate Limiting**: Is `arcjet` middleware applied to sensitive routes?
-   [ ] **NoSQL Injection**: Are we using Mongoose methods correctly? (Avoid concatenation in queries).
-   [ ] **Data Exposure**: Do we exclude sensitive fields (password, `__v`) from responses?
-   [ ] **Broken Access Control**: Is `assertOwnerOrAdmin` called on EVERY update/delete/get-by-id?

## 9. Validation Strategy

We use **Joi** for data validation.

### Architecture
1.  **Schema Definition (`*.validation.js`)**: Define pure Joi object schemas. Export them directly.
2.  **Middleware Application**: Use `src/middlewares/validate.middleware.js` in routes.

### Example
**`modules/expenses/expense.validation.js`**
```javascript
import Joi from "joi";

export const expenseSchema = Joi.object({
    title: Joi.string().min(2).max(100).required(),
    amount: Joi.number().min(0).required(),
    currency: Joi.string().valid('USD', 'EUR').default('USD'),
    // ...
});
```

**`modules/expenses/expense.routes.js`**
```javascript
import validate from '../../middlewares/validate.middleware.js';
import { expenseSchema } from './expense.validation.js';

router.post('/', validate(expenseSchema), controller.create);
```

### Rules
-   **Strictness**: Validation happens *before* the controller.
-   **Sanitization**: Joi schemas should handle defaults (e.g., `default('USD')`).
-   **Consistency**: All validation files should end in `.validation.js`.

## Summary Checklist for New Features

1.  **Model**: Define Schema.
2.  **Repository**: Write DB queries.
3.  **Service**: Write logic/transformations.
4.  **Validation**: Define Joi schema.
5.  **Controller**: Stitch it together + Auth checks.
6.  **Routes**: Define URL + Apply Middleware.
7.  **Tests**: Unit test the controller flow.

---

## Admin Module Architecture

The admin module follows a specialized pattern distinct from regular user modules:

### Directory Structure
```
modules/admin/
├── admin.auth.controller.js    # Admin login/logout endpoints
├── admin.auth.service.js       # JWT with short expiry (30min)
├── admin.auth.validation.js    # Joi schemas for admin auth
├── admin.auth.routes.js        # /api/admin/auth/* endpoints
├── admin.dashboard.controller.js  # Platform analytics endpoints
├── admin.dashboard.service.js     # Cross-user aggregations
└── admin.dashboard.routes.js      # /api/admin/* endpoints
```

### Admin Authentication
-   **Separate from user auth**: Uses `admin_token` vs regular `auth_token`
-   **Short-lived sessions**: 30-minute expiry by default (configurable via `ADMIN_SESSION_DURATION`)
-   **Role verification**: Both token claim (`isAdmin: true`) AND database role (`user.role === 'admin'`) are verified

### Admin Middleware
```javascript
// middlewares/admin.middleware.js
export const requireAdmin = async (req, res, next) => {
    // 1. Extract and verify JWT
    // 2. Check isAdmin claim in token
    // 3. Verify user still has admin role in DB
    // 4. Attach user to req.user, set req.isAdmin = true
};
```

### Admin API Routes
| Endpoint | Description |
|----------|-------------|
| `POST /api/admin/auth/sign-in` | Admin login |
| `POST /api/admin/auth/sign-out` | Admin logout |
| `POST /api/admin/auth/refresh` | Session refresh |
| `GET /api/admin/overview` | Platform KPIs |
| `GET /api/admin/users` | Paginated user list |
| `GET /api/admin/users/:id` | User detail with activity |
| `PATCH /api/admin/users/:id/role` | Change user role |
| `DELETE /api/admin/users/:id` | Delete user + cascade data |
| `GET /api/admin/analytics/financials` | Platform financials |
| `GET /api/admin/analytics/categories` | Category distribution |
| `GET /api/admin/subscriptions/health` | Subscription metrics |

