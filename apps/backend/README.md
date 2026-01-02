# Subscription Tracker - Backend API

Node.js + Express + MongoDB backend service for the Subscription Tracker application.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- MongoDB 7.0+

### Install Dependencies
```bash
npm install
```

### Configure Environment Variables
Create a `.env.development.local` file (or `.env` for production):
```env
PORT=5500
NODE_ENV=development
DB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
ARCJET_KEY=your_arcjet_key (optional)
```

### Start the Service
```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

The server will start at `http://localhost:5500` (or your configured PORT).

## 📚 API Documentation

**Full API Definitions:** [Backend API Documentation](../../docs/api/Backend-api.md)

### Modules Overview
- **Authentication** (`/auth`) - Sign up, sign in, sign out.
- **Users** (`/users`) - User profile management.
- **Subscriptions** (`/subscriptions`) - Create, list, update, and cancel subscriptions.
- **Expenses** (`/expenses`) - Track one-off expenses.
- **Budgets** (`/budgets`) - Set and monitor monthly budgets.
- **Currency** (`/currencies`) - Live currency exchange rates.

## 🧪 Testing

Run the test suite using Jest:

```bash
npm test
```

## 📁 Project Structure

```
src/
├── app.js                    # Express app setup
├── config/                   # Config (env, arcjet)
├── database/                 # DB connection
├── middlewares/              # Auth, validation, error handling
├── modules/                  # Feature modules
│   ├── auth/                 # Auth logic
│   ├── budgets/              # Budget logic
│   ├── currency/             # Currency logic
│   ├── expenses/             # Expense logic
│   ├── subscription/         # Subscription logic
│   └── user/                 # User logic
└── utils/                    # Shared utilities
```

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Validation**: Joi
- **Auth**: JWT & bcryptjs
- **Security**: Arcjet
