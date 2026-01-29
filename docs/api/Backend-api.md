# Backend API Documentation

Complete API reference for the Subscription Tracker backend service.

## Base URL

默认：`http://localhost:<PORT>/api/v1`（`PORT` development: 5500, production: 5000）

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

Tokens are obtained from the `/auth/sign-in` or `/auth/sign-up` endpoints.

---

## Table of Contents

- [Authentication API](#authentication-api)
- [Users API](#users-api)
- [Subscriptions API](#subscriptions-api)
- [Budgets API](#budgets-api)
- [Income API](#income-api)
- [Currency API](#currency-api)
- [Analytics API](#analytics-api)
- [Error Responses](#error-responses)
- [Request Examples](#request-examples)

---

## Authentication API

### Sign Up

Register a new user account.

**Endpoint:** `POST /auth/sign-up`

**Authentication:** Not required

**Request Body:**
```json
{
  "name": "string (2-30 characters, required)",
  "email": "string (valid email, required)",
  "password": "string (min 6 characters, required)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "\"email\" must be a valid email"
  ]
}
```

---

### Sign In

Authenticate and obtain a JWT token.

**Endpoint:** `POST /auth/sign-in`

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "string (valid email, required)",
  "password": "string (required)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User signed in successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### Sign Out

Log out the current user (client-side token removal).

**Endpoint:** `POST /auth/sign-out`

**Authentication:** Not required (handled client-side)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## Users API

All user interfaces require authentication and follow roles/attributions:
- admin: Can perform all user operations (list/create/read/update/delete any user)
- Ordinary users: can only read/update/delete their own user records, cannot create other users, and cannot view the user list

### Get All Users

Retrieve a list of all users.

**Endpoint:** `GET /users`

**Authentication:** Required  
**Authorization:** admin only

**Query Parameters:** None

**Success Response (200):**
```json
{
  "success": true,
  "message": "Users fetched successfully",
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### Get User by ID

Retrieve a specific user by their ID.

**Endpoint:** `GET /users/:id`

**Authentication:** Required  
**Authorization:** admin 或本人（`:id` 等于当前用户）

**URL Parameters:**
- `id` (string, required) - User's MongoDB ObjectId

**Success Response (200):**
```json
{
  "success": true,
  "message": "User fetched successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "User not found"
}
```

---

### Create User

Create a new user (admin function).

**Endpoint:** `POST /users`

**Authentication:** Required  
**Authorization:** admin only

**Request Body:**
```json
{
  "name": "string (2-30 characters, required)",
  "email": "string (valid email, required)",
  "password": "string (min 6 characters, required)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

---

### Update User

Update user information.

**Endpoint:** `PUT /users/:id`

**Authentication:** Required  
**Authorization:** admin or own

**URL Parameters:**
- `id` (string, required) - User's MongoDB ObjectId

**Request Body:**
```json
{
  "name": "string (2-30 characters, optional)",
  "email": "string (valid email, optional)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Updated",
      "email": "johnupdated@example.com",
      "updatedAt": "2025-01-02T00:00:00.000Z"
    }
  }
}
```

---

### Delete User

Delete a user account.

**Endpoint:** `DELETE /users/:id`

**Authentication:** Required  
**Authorization:** admin or owner

**URL Parameters:**
- `id` (string, required) - User's MongoDB ObjectId

**Success Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {
    "deleted": true
  }
}
```

---

## Subscriptions API

Authorization rules (service has been verified with common helper):
- admin: can access/manage any subscription; `/upcoming-renewals` is available `?userId=` specifies the user
- Ordinary users: can only access/manage their own subscriptions

### Get All Subscriptions

Retrieve all subscriptions.

**Endpoint:** `GET /subscriptions`

**Authentication:** Required  
**Authorization:** admin 可查看全部；普通用户仅查看自己的订阅

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Netflix",
      "price": 15.99,
      "currency": "USD",
      "frequency": "monthly",
      "category": "Entertainment",
      "startDate": "2025-01-01T00:00:00.000Z",
      "renewalDate": "2025-02-01T00:00:00.000Z",
      "status": "active",
      "paymentMethod": "Credit Card",
      "user": "507f1f77bcf86cd799439011",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Get Subscription by ID

Retrieve a specific subscription.

**Endpoint:** `GET /subscriptions/:id`

**Authentication:** Required  
**Authorization:** admin or owner

**URL Parameters:**
- `id` (string, required) - Subscription's MongoDB ObjectId

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Netflix",
    "price": 15.99,
    "currency": "USD",
    "frequency": "monthly",
    "category": "Entertainment",
    "startDate": "2025-01-01T00:00:00.000Z",
    "renewalDate": "2025-02-01T00:00:00.000Z",
    "status": "active",
    "paymentMethod": "Credit Card",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

---

### Get User's Subscriptions

Retrieve all subscriptions for a specific user.

**Endpoint:** `GET /subscriptions/user/:id`

**Authentication:** Required  
**Authorization:** admin 或 `:id` 等于当前用户

**URL Parameters:**
- `id` (string, required) - User's MongoDB ObjectId

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Netflix",
      "price": 15.99,
      "currency": "USD",
      "frequency": "monthly",
      "category": "Entertainment",
      "status": "active"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Spotify",
      "price": 9.99,
      "currency": "USD",
      "frequency": "monthly",
      "category": "Entertainment",
      "status": "active"
    }
  ]
}
```

---

### Create Subscription

Create a new subscription.

**Endpoint:** `POST /subscriptions`

**Authentication:** Required  
**Authorization:** 登录用户（自动绑定为当前用户；传入的 user 字段会被覆盖）

**Request Body:**
```json
{
  "name": "string (2-100 characters, required)",
  "price": "number (>= 0, required)",
  "currency": "string (EUR, USD, CNY, AUD, default: USD)",
  "frequency": "string (daily, weekly, monthly, yearly, required)",
  "category": "string (Food, Transport, Entertainment, Utilities, Rent, Health, Others, required)",
  "startDate": "date (ISO 8601, required)",
  "paymentMethod": "string (required)",
  "status": "string (active, cancelled, expired, default: active)",
  "renewalDate": "date (ISO 8601, optional - auto-calculated if not provided)",
  "user": "string (24-char hex ObjectId, optional)"
}
```

**Example Request:**
```json
{
  "name": "Netflix Premium",
  "price": 19.99,
  "currency": "USD",
  "frequency": "monthly",
  "category": "Entertainment",
  "startDate": "2025-01-01",
  "paymentMethod": "Credit Card"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Netflix Premium",
    "price": 19.99,
    "currency": "USD",
    "frequency": "monthly",
    "category": "Entertainment",
    "startDate": "2025-01-01T00:00:00.000Z",
    "renewalDate": "2025-02-01T00:00:00.000Z",
    "status": "active",
    "paymentMethod": "Credit Card",
    "user": "507f1f77bcf86cd799439011",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### Update Subscription

Update an existing subscription.

**Endpoint:** `PUT /subscriptions/:id`

**Authentication:** Required  
**Authorization:** admin or Owner

**URL Parameters:**
- `id` (string, required) - Subscription's MongoDB ObjectId

**Request Body:** (all fields optional)
```json
{
  "name": "string",
  "price": "number",
  "currency": "string",
  "frequency": "string",
  "category": "string",
  "startDate": "date",
  "renewalDate": "date",
  "paymentMethod": "string",
  "status": "string"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Subscription updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Netflix Premium HD",
    "price": 22.99,
    "updatedAt": "2025-01-02T00:00:00.000Z"
  }
}
```

---

### Cancel Subscription

Mark a subscription as cancelled.

**Endpoint:** `PUT /subscriptions/:id/cancel`

**Authentication:** Required  
**Authorization:** Owner or admin

**URL Parameters:**
- `id` (string, required) - Subscription's MongoDB ObjectId

**Success Response (200):**
```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Netflix",
    "status": "cancelled",
    "updatedAt": "2025-01-02T00:00:00.000Z"
  }
}
```

---

### Delete Subscription

Permanently delete a subscription.

**Endpoint:** `DELETE /subscriptions/:id`

**Authentication:** Required  
**Authorization:** admin 或订阅所属用户

**URL Parameters:**
- `id` (string, required) - Subscription's MongoDB ObjectId

**Success Response (200):**
```json
{
  "success": true,
  "message": "Subscription deleted successfully"
}
```

---

### Get Upcoming Renewals

Get subscriptions that are due for renewal soon.

**Endpoint:** `GET /subscriptions/upcoming-renewals`

**Authentication:** Required  
**Authorization:** admin 可指定 `userId` 查询任意用户；普通用户仅能查询自己

**Query Parameters:** （backend default: 7 - Number of days to look ahead）

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Netflix",
      "price": 15.99,
      "currency": "USD",
      "renewalDate": "2025-01-05T00:00:00.000Z",
      "daysUntilRenewal": 3
    }
  ]
}
```

---

### Get Total Subscription Cost

Get the total yearly subscription cost for a user (calculated by multiplying subscription prices by their frequency).

**Endpoint:** `GET /subscriptions/total`

**Authentication:** Required  
**Authorization:** admin 可指定 `userId` 查询任意用户；普通用户仅能查询自己

**Query Parameters:**
- `userId` (string, optional, admin only) - User's MongoDB ObjectId (admin can specify target user)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Total subscription fetched successfully",
  "data": {
    "total": 191.88
  }
}
```

**Notes:**
- Only includes active subscriptions
- Calculates yearly total by multiplying subscription prices by frequency multipliers:
  - daily: × 365
  - weekly: × 52
  - monthly: × 12
  - yearly: × 1

---
## Budgets API

### Get All Budgets for a specific month and year for a user
Retrieve all budgets for the authenticated user for a specific month and year. both month and year are required

**Endpoint:** GET /budgets  
**Authentication:** Required  
**Authorization:** admin 可通过 `?userId=` 查询任意用户；普通用户仅能查询自己的预算

**Query Parameters:**
- month (number, required)
- year (number, required)
- userId (string, optional, admin only — 指定目标用户)

**Success Response (200):**
``` json
{
  "success": true,
  "data": [
    {
      "category": "Food",
      "limit": 500,
      "currency": "USD",
      "month": 6,
      "year": 2025,
      "user": "507f1f77bcf86cd799439011",
      "createdAt": "2025-06-01T00:00:00.000Z",
      "updatedAt": "2025-06-01T00:00:00.000Z",
      "id": "507f1f77bcf86cd799439020"
    }
  ]
}
```
---


### Create Budget

Create a new budget for a category in a specific month and year.

**Endpoint:** POST /budgets  
**Authentication:** Required  
**Authorization:** 登录用户（预算归属当前用户；传入 user 将被忽略，admin 也默认归属自己）

**Request Body:**
``` json
{
  "category": "string (Food, Transport, Entertainment, Utilities, Rent, Health, Others)",
  "limit": "number (>= 0, required)",
  "currency": "string (EUR, USD, CNY, AUD, default: USD)",
  "month": "number (1–12, required)",
  "year": "number (>= 2025, required)"
}
```

**Example Request:**
``` json
{
  "category": "Transport",
  "limit": 500,
  "currency": "USD",
  "month": 6,
  "year": 2025
}
```

**Success Response (201):**
``` json
{
  "success": true,
  "message": "Budget created successfully",
  "data": {
    "user": "507f1f77bcf86cd799439011",
    "category": "Transport",
    "limit": 500,
    "currency": "USD",
    "month": 6,
    "year": 2025,
    "createdAt": "2025-06-01T00:00:00.000Z",
    "updatedAt": "2025-12-30T06:42:32.912Z",
    "id": "507f1f77bcf86cd799439021"
  }
}
```
---

### Update Budget

Update an existing budget.

**Endpoint:** PUT /budgets/:id  
**Authentication:** Required  
**Authorization:** (Must be owner or admin)

**URL Parameters:**
- id (string, required) – Budget’s MongoDB ObjectId

**Request Body (all fields optional):**
``` json
{
  "category": "string",
  "limit": "number",
  "currency": "string (EUR, USD, CNY, AUD)",
  "month": "number",
  "year": "number"
}
```
**Success Response (200):**
``` json
{
  "success": true,
  "message": "Budget updated successfully",
  "data": {
    "user": "69531ed5cf2358fa573d233d",
    "category": "Others",
    "limit": 300,
    "currency": "USD",
    "month": 6,
    "year": 2025,
    "createdAt": "2025-12-30T06:42:32.912Z",
    "updatedAt": "2025-12-30T06:44:56.115Z",
    "id": "695374588d3353590f36afd6"
  }
}
```
---

### Delete Budget

Delete a budget permanently.

**Endpoint:** DELETE /budgets/:id  
**Authentication:** Required

**URL Parameters:**
- id (string, required) – Budget’s MongoDB ObjectId

**Success Response (200):**
``` json
{
  "success": true,
  "message": "Budget deleted successfully"
}
```

---

### Get Budget Summary (Budget vs Expenses)

Get a full spending summary comparing budgets and expenses.

**Endpoint:** GET /budgets/summary/spending-summary  
**Authentication:** Required

**Query Parameters:**
- month (number, required)
- year (number, required)

**Success Response (200):**
``` json
{
  "success": true,
  "data": {
    "totalBudget": 1500,
    "totalExpenses": 46.25,
    "remainingBudget": 1453.75,
    "categoriesSummary": [
      {
        "category": "Food",
        "budget": 500,
        "remainingBudget": 500,
        "expenses": 0
      },
      {
        "category": "Transport",
        "budget": 500,
        "remainingBudget": 472.25,
        "expenses": 27.75
      },
      {
        "category": "Entertainment",
        "budget": 200,
        "remainingBudget": 181.5,
        "expenses": 18.5
      },
      {
        "category": "Others",
        "budget": 300,
        "remainingBudget": 300,
        "expenses": 0
      }
    ]
  }
} 
```
---

### Get Budget Categories

Retrieve all budget categories for a given month and year.

**Endpoint:** GET /budgets/summary/categories  
**Authentication:** Required

**Query Parameters:**
- month (number, required)
- year (number, required)

**Success Response (200):**
``` json
{
  "success": true,
  "data": [
    "Food",
    "Transport",
    "Entertainment"
  ]
}
```
```
---

## Currency API

### Get Exchange Rates

Get live currency exchange rates (Cached for 5 minutes).
**Data Source:** [ExchangeRate-API](https://www.exchangerate-api.com/)

**Endpoint:** `GET /currencies`

**Authentication:** Not required

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "EUR": 0.92,
    "GBP": 0.79,
    "JPY": 110.5,
    "CNY": 7.2
  },
  "cacheDuration": 300000,
  "nextUpdateTime": "2025-01-28T10:05:00.000Z"
}
```

---

### Get Historical Rates

Get historical exchange rate trends for a currency pair (Cached for 24 hours).
Supports server-side data aggregation for performance.
**Data Source:** [Frankfurter API](https://api.frankfurter.dev/) (ECB Data)

**Endpoint:** `GET /currencies/history`

**Authentication:** Not required

**Query Parameters:**
- `from` (string, required) - Base currency code (e.g., USD)
- `to` (string, required) - Target currency code (e.g., EUR)
- `start` (string, required) - Start date (YYYY-MM-DD)
- `end` (string, required) - End date (YYYY-MM-DD)
- `granularity` (string, optional) - Aggregation level: 'weekly' | 'monthly' | 'yearly' (default: 'monthly')

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "base": "USD",
    "target": "EUR",
    "startDate": "2023-01-01",
    "endDate": "2023-12-31",
    "granularity": "monthly",
    "series": [
      {
        "date": "2023-01-15",
        "rate": 0.92
      },
      {
        "date": "2023-02-15",
        "rate": 0.93
      }
    ]
  }
}
```

---

Notes:
- Budgets are unique per user + category + month + year
- All endpoints require authentication
- Designed for analytics dashboards and charts







---

## Income API

### Get All Incomes

Retrieve a list of income records. Supports filtering by date range or specific month/year.

**Endpoint:** `GET /income`

**Authentication:** Required  
**Authorization:** admin 可通过 `?userId=` 查询任意用户；普通用户仅能查询自己的收入

**Query Parameters:**
- `userId` (string, optional, admin only) - Specify user
- `startDate` (date, optional) - ISO 8601 date string
- `endDate` (date, optional) - ISO 8601 date string
- `month` (number, optional) - Filter by month (1-12)
- `year` (number, optional) - Filter by year

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "651f...",
      "amount": 5000,
      "source": "Main Job",
      "category": "Salary",
      "date": "2025-01-01T00:00:00.000Z",
      "notes": "January Salary",
      "user": "507f...",
      "createdAt": "2025-01-01T10:00:00.000Z",
      "updatedAt": "2025-01-01T10:00:00.000Z"
    }
  ]
}
```

---

### Get Income by ID

Retrieve a specific income record.

**Endpoint:** `GET /income/:id`

**Authentication:** Required  
**Authorization:** admin or owner

**URL Parameters:**
- `id` (string, required) - Income's MongoDB ObjectId

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "651f...",
    "amount": 5000,
    "source": "Main Job",
    "category": "Salary",
    "date": "2025-01-01T00:00:00.000Z",
    "notes": "January Salary",
    "user": "507f...",
    "createdAt": "2025-01-01T10:00:00.000Z",
    "updatedAt": "2025-01-01T10:00:00.000Z"
  }
}
```

---

### Create Income

Create a new income record.

**Endpoint:** `POST /income`

**Authentication:** Required  
**Authorization:** Login user (attributed to self)

**Request Body:**
```json
{
  "amount": "number (required, > 0)",
  "currency": "string (optional, enum: EUR, USD, CNY, AUD, default: USD)",
  "category": "string (required, enum: Salary, Freelance, Gift, Investment, Other)",
  "source": "string (optional)",
  "date": "date (required, default: now)",
  "notes": "string (optional)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Income created successfully",
  "data": {
    "_id": "651f...",
    "amount": 5000,
    "currency": "EUR",
    "amountUSD": 5500,
    "category": "Salary",
    ...
  }
}
```

---

### Update Income

Update an existing income record.

**Endpoint:** `PUT /income/:id`

**Authentication:** Required  
**Authorization:** admin or owner

**URL Parameters:**
- `id` (string, required) - Income's MongoDB ObjectId

**Request Body:**
```json
{
  "amount": "number",
  "currency": "string (enum: EUR, USD, CNY, AUD)",
  "category": "string",
  "source": "string",
  "date": "date",
  "notes": "string"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Income updated successfully",
  "data": { 
      "_id": "651f...",
      "amount": 5000,
      "currency": "EUR", 
      "amountUSD": 5500,
      ...
  }
}
```

---

### Delete Income

Delete an income record.

**Endpoint:** `DELETE /income/:id`

**Authentication:** Required  
**Authorization:** admin or owner

**URL Parameters:**
- `id` (string, required) - Income's MongoDB ObjectId

**Success Response (204):**
(No Content)

---

### Get Income Summary

Get total income and category breakdown for a specific month/year.

**Endpoint:** `GET /income/summary`

**Authentication:** Required  
**Authorization:** admin or owner

**Query Parameters:**
- `month` (number, required)
- `year` (number, required)
- `userId` (string, optional, admin only)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalIncome": 6000,
    "categoryBreakdown": [
      {
        "category": "Salary",
        "total": 5000,
        "count": 1
      },
      {
        "category": "Freelance",
        "total": 1000,
        "count": 2
      }
    ]
  }
}
```

---

## Error Responses

统一格式（由全局错误处理中间件返回）：

```json
{
  "success": false,
  "message": "Error description"
}
```

Common Error Codes：400/401/403/404/409/500

Validation Error Example：
```json
{
  "success": false,
  "message": "\"price\" must be greater than or equal to 0"
}
```

示例（未授权）：
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

示例（禁止访问）：
```json
{
  "success": false,
  "message": "Forbidden"
}
```

示例（未找到）：
```json
{
  "success": false,
  "message": "Resource not found"
}
```

---

## Request Examples

### Using cURL

#### Sign Up
```bash
curl -X POST http://localhost:5000/api/v1/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

#### Sign In
```bash
curl -X POST http://localhost:5000/api/v1/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

#### Create Subscription
```bash
curl -X POST http://localhost:5000/api/v1/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Netflix",
    "price": 15.99,
    "currency": "USD",
    "frequency": "monthly",
    "category": "Entertainment",
    "startDate": "2025-01-01",
    "paymentMethod": "Credit Card"
  }'
```

#### Get User's Subscriptions
```bash
curl -X GET http://localhost:5000/api/v1/subscriptions/user/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get Upcoming Renewals
```bash
curl -X GET http://localhost:5000/api/v1/subscriptions/upcoming-renewals \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Expenses API

All fee interfaces require authentication and follow roles/attributions:
- admin: can access/manage any user fees; the list can be viewed by `?userId=` for specified users
- Ordinary users: can only access/manage their own expenses

#### Create Expense
**POST** `/expenses`
```json
{
  "title": "Coffee",
  "amount": 4.5,
  "category": "Food",
  "date": "2025-01-01",
  "notes": "latte"
}
```
Response 201:
```json
{
  "title": "Coffee",
  "amount": 4.5,
  "category": "Food",
  "date": "2025-01-01T00:00:00.000Z",
  "user": "507f1f77bcf86cd799439011",
  "id": "65c...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

#### List Expenses
**GET** `/expenses`

**Query Parameters:**
- `userId` (string, optional, admin only) - Specify user
- `month` (number, optional) - Filter by month (1-12)
- `year` (number, optional) - Filter by year
- `category` (string, optional) - Filter by category

#### Get Expense by ID (must be owner or admin)
**GET** `/expenses/:id`

#### Update Expense (must be owner or admin)
**PUT** `/expenses/:id`

#### Delete Expense (must be owner or admin)
**DELETE** `/expenses/:id`

### Using JavaScript (Axios)

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Sign Up
const signUp = async (name, email, password) => {
  const response = await api.post('/auth/sign-up', {
    name,
    email,
    password,
  });
  return response.data;
};

// Sign In
const signIn = async (email, password) => {
  const response = await api.post('/auth/sign-in', {
    email,
    password,
  });
  // Store token
  localStorage.setItem('token', response.data.data.token);
  return response.data;
};

// Create Subscription
const createSubscription = async (subscriptionData) => {
  const response = await api.post('/subscriptions', subscriptionData);
  return response.data;
};

// Get User's Subscriptions
const getUserSubscriptions = async (userId) => {
  const response = await api.get(`/subscriptions/user/${userId}`);
  return response.data;
};

// Update Subscription
const updateSubscription = async (id, updates) => {
  const response = await api.put(`/subscriptions/${id}`, updates);
  return response.data;
};

// Cancel Subscription
const cancelSubscription = async (id) => {
  const response = await api.put(`/subscriptions/${id}/cancel`);
  return response.data;
};

// Delete Subscription
const deleteSubscription = async (id) => {
  const response = await api.delete(`/subscriptions/${id}`);
  return response.data;
};
```

---

---

## Admin API

Base path: `/api/admin`

### Get User Growth Trend

Get user registration growth data trend (new users vs total users).

**Endpoint:** `GET /users/growth`

**Authentication:** Required (Admin Token)

**Query Parameters:**
- `granularity` (string, optional) - 'monthly' (default), 'weekly', 'yearly'
- `count` (number, optional) - Number of periods to return (default: 12)

**Success Response (200):**
```json
{
  "success": true,
  "granularity": "monthly",
  "periodLabel": "month",
  "data": [
    {
      "period": "2025-01",
      "newUsers": 50,
      "totalUsers": 1200
    },
    {
      "period": "2025-02",
      "newUsers": 80,
      "totalUsers": 1280
    }
  ]
}
```

---

## Analytics API

All analytics endpoints require authentication.
Base path: `/analytics`

### Get Trend Data
**GET** `/analytics/trend`
Get income/expense trend data grouped by period.

**Query Parameters:**
- `granularity` (string, optional) - 'day', 'week', 'month'
- `count` (number, optional) - Number of periods

### Get Category Breakdown
**GET** `/analytics/category-breakdown`
Get expense/income breakdown by category.

**Query Parameters:**
- `month` (number, required)
- `year` (number, required)
- `type` (string, optional) - 'income' or 'expense'

### Get Monthly Comparison
**GET** `/analytics/monthly-comparison`
Compare income, expenses, and savings across months.

**Query Parameters:**
- `months` (number, optional) - Number of months to compare

### Get Budget Usage
**GET** `/analytics/budget-usage`
Get budget utilization per category.

**Query Parameters:**
- `month` (number, required)
- `year` (number, required)

---

## Data Models

### User Model

```typescript
interface User {
  _id: string;              // MongoDB ObjectId
  name: string;             // 2-30 characters
  email: string;            // Valid email, unique
  password: string;         // Hashed, min 6 characters
  createdAt: Date;          // Auto-generated
  updatedAt: Date;          // Auto-generated
}
```

### Subscription Model

```typescript
interface Subscription {
  _id: string;              // MongoDB ObjectId
  name: string;             // 2-100 characters
  price: number;            // >= 0
  currency: 'USD' | 'EUR' | 'GBP';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category: 'Food' | 'Transport' | 'Entertainment' | 'Utilities' | 
            'Rent' | 'Health' | 'Others';
  startDate: Date;
  renewalDate: Date;        // Auto-calculated based on frequency
  status: 'active' | 'cancelled' | 'expired';
  paymentMethod: string;
  user: string;             // User ObjectId reference
  createdAt: Date;          // Auto-generated
  updatedAt: Date;          // Auto-generated
}
```

### Income Model

```typescript
interface Income {
  _id: string;              // MongoDB ObjectId
  amount: number;           // > 0
  currency: 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CNY'; 
  amountUSD: number;        // Converted value in USD
  source: string;           // Optional source description
  category: 'Salary' | 'Freelance' | 'Gift' | 'Investment' | 'Other';
  date: Date;
  notes: string;            // Optional
  user: string;             // User ObjectId reference
  createdAt: Date;          // Auto-generated
  updatedAt: Date;          // Auto-generated
}
```

---

## Rate Limiting

The API uses Arcjet for rate limiting (optional):
- **Limit**: 100 requests per minute per IP
- **Burst**: 20 requests

When rate limit is exceeded, you'll receive a `429 Too Many Requests` response.

---

## Changelog

### Version 0.1.0 (Current)
- Initial API release
- Authentication endpoints
- User management
- Subscription CRUD operations
- Upcoming renewals feature

