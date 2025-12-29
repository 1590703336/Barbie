# Subscription Tracker - Backend API

Node.js + Express + MongoDB backend service

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Configure Environment Variables
Create a `.env.development.local` file:
```env
PORT=5500
NODE_ENV=development
DB_URI=your_mongodb_url
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
```

### Start the Service
```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

The server will start at `http://localhost:5000`

## 📚 API Documentation

For detailed API documentation, see [API.md](./API.md)

For complete project documentation, see the main [README.md](../../README.md)

## 🛠 Tech Stack

- **Node.js 20+** - JavaScript runtime
- **Express.js 4.16** - Web framework
- **MongoDB 7.0** - NoSQL database
- **Mongoose 9.0** - MongoDB ODM
- **JWT** - Authentication (jsonwebtoken 9.0)
- **Joi 18.0** - Data validation
- **bcryptjs 3.0** - Password encryption
- **Arcjet 1.0-beta** - API security (optional)

## 📁 Project Structure

```
backend/
├── src/
│   ├── app.js                    # Express application entry
│   ├── config/                   # Configuration files
│   │   ├── env.js               # Environment variables
│   │   └── arcjet.config.js     # Security configuration
│   ├── database/                 # Database configuration
│   │   └── mongodb.js           # MongoDB connection
│   ├── middlewares/              # Express middlewares
│   │   ├── auth.middleware.js   # JWT authentication
│   │   ├── error.middlewares.js # Error handling
│   │   └── validate.middleware.js # Data validation
│   ├── modules/                  # Business modules
│   │   ├── auth/                # Authentication module
│   │   ├── user/                # User management module
│   │   └── subscription/        # Subscription module
│   └── utils/                    # Utility functions
├── tests/                        # Test files
├── package.json                  # Dependencies
├── eslint.config.js             # ESLint configuration
└── README.md                     # This file
```

## 🔑 Key Features

- ✅ **Modular Architecture** - Domain-driven design with clear separation
- ✅ **Three-Layer Pattern** - Controller-Service-Model architecture
- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **Data Validation** - Joi schema validation for all inputs
- ✅ **Password Security** - bcrypt hashing with 10 salt rounds
- ✅ **Error Handling** - Centralized error handling middleware
- ✅ **MongoDB Integration** - Mongoose ODM with schema validation
- ✅ **API Security** - Arcjet protection (optional)

## 🔒 Security Features

1. **JWT Authentication** - Secure token-based auth with configurable expiry
2. **Password Hashing** - bcrypt with 10 rounds
3. **Input Validation** - Joi schemas for all requests
4. **NoSQL Injection Protection** - Mongoose automatic escaping
5. **CORS Configuration** - Controlled cross-origin access
6. **Rate Limiting** - Arcjet integration (optional)

## 🧪 Development

### Running Tests
```bash
npm test
```

### Code Linting
```bash
npm run lint
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `DB_URI` | MongoDB connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | Token expiry time | 7d |
| `ARCJET_KEY` | Arcjet API key | Optional |

## 📖 API Overview

### Base URL
```
http://localhost:5000/api/v1
```

### Modules
- **Authentication** (`/auth`) - User registration, login, logout
- **Users** (`/users`) - User management (CRUD)
- **Subscriptions** (`/subscriptions`) - Subscription management

For detailed endpoint documentation, see [API.md](./API.md)

## 🤝 Contributing

1. Follow the existing code structure
2. Use ES6+ module syntax
3. Validate all inputs with Joi
4. Handle errors properly
5. Write meaningful commit messages

## 📄 License

Private Project - All Rights Reserved
