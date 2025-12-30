# Subscription Tracker Platform - Project Architecture

## Project Structure Overview

```
Barbie/
│
├── README.md                           # Main project documentation
├── QUICKSTART.md                       # Quick start guide
├── PROJECT_SUMMARY.md                  # Project migration summary
├── CHECKLIST.md                        # Setup verification checklist
├── package.json                        # Monorepo configuration
├── docker-compose.yml                  # Docker orchestration
├── .gitignore                          # Git ignore rules
│
├── apps/                               # Application services directory
│   │
│   ├── frontend/                       # React frontend application
│   │   ├── public/                     # Static assets
│   │   │   ├── index.html
│   │   │   └── favicon.ico
│   │   ├── src/
│   │   │   ├── components/             # React components
│   │   │   │   ├── common/            # Reusable common components
│   │   │   │   ├── auth/              # Authentication components
│   │   │   │   ├── subscription/      # Subscription management components
│   │   │   │   └── dashboard/         # Dashboard components
│   │   │   ├── pages/                 # Page components
│   │   │   │   ├── Home.jsx
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Register.jsx
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   └── Analytics.jsx
│   │   │   ├── services/              # API service layer
│   │   │   │   ├── api.js            # Axios configuration
│   │   │   │   ├── authService.js
│   │   │   │   ├── subscriptionService.js
│   │   │   │   └── analyticsService.js
│   │   │   ├── store/                 # State management (Zustand)
│   │   │   │   ├── slices/
│   │   │   │   └── store.js
│   │   │   ├── hooks/                 # Custom React hooks
│   │   │   ├── utils/                 # Utility functions
│   │   │   ├── styles/                # Style files
│   │   │   │   └── index.css
│   │   │   ├── App.jsx                # Main app component
│   │   │   └── main.jsx               # React entry point
│   │   ├── package.json               # Frontend dependencies
│   │   ├── vite.config.js             # Vite build configuration
│   │   ├── tailwind.config.js         # Tailwind CSS configuration
│   │   ├── postcss.config.js          # PostCSS configuration
│   │   ├── .eslintrc.cjs              # ESLint configuration
│   │   ├── .env.example               # Environment variables template
│   │   └── README.md                  # Frontend documentation
│   │
│   ├── backend/                        # Node.js + Express backend
│   │   ├── src/
│   │   │   ├── app.js                 # Express application entry
│   │   │   ├── config/                # Configuration files
│   │   │   │   ├── env.js            # Environment configuration
│   │   │   │   └── arcjet.config.js   # Arcjet security configuration
│   │   │   ├── database/              # Database configuration
│   │   │   │   └── mongodb.js         # MongoDB connection
│   │   │   ├── middlewares/           # Express middlewares
│   │   │   │   ├── auth.middleware.js      # JWT authentication
│   │   │   │   ├── arcjet.middleware.js    # Arcjet security
│   │   │   │   ├── error.middlewares.js    # Error handling
│   │   │   │   └── validate.middleware.js  # Joi validation
│   │   │   ├── modules/               # Business modules
│   │   │   │   ├── auth/              # Authentication module
│   │   │   │   │   ├── auth.controller.js
│   │   │   │   │   ├── auth.service.js
│   │   │   │   │   ├── auth.routes.js
│   │   │   │   │   └── auth.validation.js
│   │   │   │   ├── user/              # User management module
│   │   │   │   │   ├── user.controller.js
│   │   │   │   │   ├── user.service.js
│   │   │   │   │   ├── user.model.js
│   │   │   │   │   └── user.routes.js
│   │   │   │   └── subscription/      # Subscription module
│   │   │   │       ├── subscription.controller.js
│   │   │   │       ├── subscription.service.js
│   │   │   │       ├── subscription.model.js
│   │   │   │       ├── subscription.routes.js
│   │   │   │       └── subscription.validation.js
│   │   │   └── utils/                 # Utility functions
│   │   │       └── index.js
│   │   ├── tests/                     # Test files
│   │   ├── package.json               # Backend dependencies
│   │   ├── eslint.config.js           # ESLint configuration
│   │   ├── .env.example               # Environment variables template
│   │   └── README.md                  # Backend documentation
│   │
│   └── data-science/                   # Python + FastAPI ML service
│       ├── app/
│       │   ├── main.py                # FastAPI application entry
│       │   ├── __init__.py
│       │   ├── config/                # Configuration
│       │   │   ├── __init__.py
│       │   │   └── settings.py        # Settings configuration
│       │   ├── api/                   # API routes
│       │   │   ├── __init__.py
│       │   │   └── v1/
│       │   │       ├── __init__.py
│       │   │       ├── analytics.py   # Analytics endpoints
│       │   │       ├── predictions.py # Prediction endpoints
│       │   │       └── insights.py    # Insights endpoints
│       │   ├── services/              # Business logic layer
│       │   │   ├── __init__.py
│       │   │   ├── analytics_service.py
│       │   │   ├── ml_service.py      # Machine learning service
│       │   │   └── recommendation_service.py
│       │   ├── models/                # Data models
│       │   │   ├── __init__.py
│       │   │   ├── schemas.py         # Pydantic models
│       │   │   └── ml_models/         # ML model files
│       │   ├── core/                  # Core functionality
│       │   │   ├── __init__.py
│       │   │   ├── database.py        # Database connection
│       │   │   └── security.py        # Security utilities
│       │   └── utils/                 # Utility functions
│       │       ├── __init__.py
│       │       ├── data_processing.py
│       │       └── visualization.py
│       ├── notebooks/                 # Jupyter Notebooks
│       │   ├── exploratory_analysis.ipynb
│       │   ├── model_training.ipynb
│       │   └── data_visualization.ipynb
│       ├── tests/                     # Test files
│       │   ├── __init__.py
│       │   └── test_analytics.py
│       ├── requirements.txt           # Python dependencies
│       ├── pyproject.toml            # Poetry configuration (optional)
│       ├── Dockerfile                # Docker configuration
│       ├── .env.example              # Environment variables template
│       └── README.md                 # Data science documentation
│
├── packages/                          # Shared packages (optional)
│   ├── types/                        # TypeScript type definitions
│   │   ├── subscription.types.ts
│   │   ├── user.types.ts
│   │   └── package.json
│   └── constants/                    # Shared constants
│       ├── currencies.js
│       ├── categories.js
│       └── package.json
│
├── infrastructure/                   # Infrastructure configuration
│   ├── docker/                       # Docker files
│   │   ├── frontend.Dockerfile
│   │   ├── backend.Dockerfile
│   │   └── data-science.Dockerfile
│   ├── nginx/                        # Nginx configuration
│   │   └── nginx.conf               # Reverse proxy config
│   └── kubernetes/                  # K8s configuration (optional)
│       ├── frontend-deployment.yaml
│       ├── backend-deployment.yaml
│       └── data-science-deployment.yaml
│
├── docs/                            # Documentation directory
│   ├── api/                         # API documentation
│   │   ├── architecture.md          # This file
│   │   ├── backend-api.md
│   │   └── data-science-api.md
│   ├── ARCHITECTURE.md              # System architecture
│   └── deployment.md                # Deployment guide
│
└── scripts/                         # Automation scripts
    ├── setup.sh                    # Project initialization
    ├── dev.sh                      # Development environment startup
    └── deploy.sh                   # Deployment script
```

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      User Interface                      │
│                 React Frontend (:3000)                   │
└──────────────┬────────────────────────┬─────────────────┘
               │                        │
               │ HTTP/REST              │ HTTP/REST
               ↓                        ↓
┌──────────────────────────┐   ┌─────────────────────────┐
│   Business Logic API     │   │   Data Science API      │
│  Node.js + Express       │   │  Python + FastAPI       │
│       (:5000)            │←→│       (:8000)           │
│                          │   │                         │
│ • User Authentication    │   │ • Data Analytics        │
│ • Subscription CRUD      │   │ • Trend Prediction      │
│ • User Management        │   │ • Smart Recommendations │
└────────┬─────────────────┘   └────────┬────────────────┘
         │                              │
         ↓                              ↓
┌─────────────────────────────────────────────────────────┐
│                     Data Storage                         │
│  ┌──────────────┐        ┌──────────────┐              │
│  │   MongoDB    │        │  PostgreSQL  │ (optional)   │
│  │ (Primary DB) │        │ (Analytics)  │              │
│  └──────────────┘        └──────────────┘              │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend (Port: 3000)
- **Framework**: React 18.3
- **Build Tool**: Vite 5
- **UI Framework**: Tailwind CSS 3
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Charts**: Recharts
- **Date Handling**: date-fns
- **Icons**: Lucide React

### Backend (Port: 5000)
- **Runtime**: Node.js 20+
- **Framework**: Express.js 4.16
- **Database**: MongoDB 7.0 with Mongoose 9.0
- **Authentication**: JWT (jsonwebtoken 9.0)
- **Password Hashing**: bcryptjs 3.0
- **Data Validation**: Joi 18.0
- **Security**: Arcjet 1.0-beta (optional)
- **Logging**: Morgan
- **Environment**: dotenv

### Data Science (Port: 8000)
- **Language**: Python 3.11+
- **Framework**: FastAPI
- **Server**: Uvicorn (ASGI)
- **Data Processing**: Pandas, NumPy
- **Machine Learning**: scikit-learn
- **Database**: Motor (MongoDB async), pymongo
- **Validation**: Pydantic 2.0
- **Visualization**: Matplotlib, Seaborn, Plotly
- **HTTP Client**: httpx, aiohttp

## Module Architecture

### Backend Modules

Each backend module follows a consistent three-layer architecture:

```
Module/
├── controller.js    # HTTP request handling
├── service.js       # Business logic
├── model.js        # Data model (Mongoose schema)
├── routes.js       # Route definitions
└── validation.js   # Joi validation schemas
```

**Current Modules:**
1. **Auth Module** - User registration, login, logout
2. **User Module** - User CRUD operations
3. **Subscription Module** - Subscription management

### Frontend Components

```
components/
├── common/          # Reusable UI components
├── auth/           # Authentication components
├── subscription/   # Subscription management
└── dashboard/      # Dashboard widgets
```

### Data Science Services

```
services/
├── analytics_service.py        # Statistical analysis
├── ml_service.py              # Machine learning models
└── recommendation_service.py  # Recommendation engine
```

## API Design

### Backend REST API (`/api/v1`)

#### Authentication
- `POST /auth/sign-up` - User registration
- `POST /auth/sign-in` - User login
- `POST /auth/sign-out` - User logout

#### Users
- `GET /users` - List all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

#### Expeneses
- `GET    /expenses`           → Getting all user’s expenses
- `GET    /expenses/:id`       → Get single expense details
- `POST   /expenses`           → Create expense for logged in user
- `PUT    /expenses/:id`       → Update expense
- `DELETE /expenses/:id`       → Delete expense

#### Subscriptions
- `GET /subscriptions` - List all subscriptions
- `GET /subscriptions/:id` - Get subscription by ID
- `POST /subscriptions` - Create subscription
- `PUT /subscriptions/:id` - Update subscription
- `DELETE /subscriptions/:id` - Delete subscription
- `PUT /subscriptions/:id/cancel` - Cancel subscription
- `GET /subscriptions/user/:id` - Get user's subscriptions
- `GET /subscriptions/upcoming-renewals` - Get upcoming renewals

### Budgets
- `GET /budgets?month=<month>&year=<year>` - List all budgets for the authenticated user for the given month and year (both query params required)
- `POST /budgets` - Create a new budget
- `PUT /budgets/:id` - Update a budget by ID
- `DELETE /budgets/:id` - Delete a budget by ID

### Data Science API (`/api/v1`)

#### Analytics
- `GET /analytics/spending-summary` - Spending summary
- `GET /analytics/category-breakdown` - Category breakdown
- `GET /analytics/spending-trend` - Spending trend analysis

#### Predictions
- `GET /predictions/future-spending` - Predict future spending
- `GET /predictions/subscription-recommendations` - Get recommendations

#### Insights
- `GET /insights/cost-optimization` - Cost optimization suggestions
- `GET /insights/usage-patterns` - Usage pattern analysis

## Data Models

### User Schema
```javascript
{
  _id: ObjectId,
  name: String (2-30 chars),
  email: String (unique, validated),
  password: String (hashed with bcrypt),
  createdAt: Date,
  updatedAt: Date
}
```

### Subscription Schema
```javascript
{
  _id: ObjectId,
  name: String (2-100 chars),
  price: Number (>= 0),
  currency: String (USD, EUR, GBP, CNY),
  frequency: String (daily, weekly, monthly, yearly),
  category: String (sports, entertainment, lifestyle, etc.),
  startDate: Date,
  renewalDate: Date (auto-calculated),
  status: String (active, cancelled, expired),
  paymentMethod: String,
  user: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

## Deployment

### Development Environment
```
Local Development (localhost)
├── Frontend: http://localhost:3000
├── Backend: http://localhost:5000
├── Data Science: http://localhost:8000
└── MongoDB: mongodb://localhost:27017
```

### Docker Production
```
Docker Compose
├── frontend (node:20-alpine)
├── backend (node:20-alpine)
├── data-science (python:3.11-slim)
├── mongodb (mongo:7.0)
└── nginx (reverse proxy)
```

## Security Features

1. **Authentication**: JWT tokens with configurable expiry
2. **Password Security**: bcrypt hashing (10 rounds)
3. **Data Validation**: Joi schemas for all inputs
4. **CORS**: Configured allowed origins
5. **Rate Limiting**: Arcjet integration (optional)
6. **NoSQL Injection**: Mongoose automatic escaping
7. **XSS Protection**: React automatic escaping

## Development Workflow

### Starting Services

**Option 1: Automated Script**
```bash
./scripts/dev.sh
```

**Option 2: Docker**
```bash
docker-compose up
```

**Option 3: Manual**
```bash
# Terminal 1: Backend
cd apps/backend && npm run dev

# Terminal 2: Frontend
cd apps/frontend && npm run dev

# Terminal 3: Data Science
cd apps/data-science && uvicorn app.main:app --reload
```

## References

- [Main README](../../README.md)
- [Quick Start Guide](../../QUICKSTART.md)
- [Backend Documentation](../../apps/backend/README.md)
- [Frontend Documentation](../../apps/frontend/README.md)
- [Data Science Documentation](../../apps/data-science/README.md)
- [System Architecture](../ARCHITECTURE.md)

---

**Last Updated**: December 2025  
**Version**: 0.1.0  
**Status**: ✅ Structure Complete, Under Development
