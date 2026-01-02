# Subscription Tracker - Frontend

React + Vite frontend application for the Subscription Tracker.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+

### Install Dependencies
```bash
npm install
```

### Configure Environment Variables
Create a `.env` or `.env.local` file:
```env
VITE_API_URL=http://localhost:5500/api/v1
```

### Start Development Server
```bash
npm run dev
```
The app will open at `http://localhost:3000` (or similar).

## 🏗 Build & Deploy

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/               # Route pages (Dashboard, Login, etc.)
├── services/            # API integration (Axios)
├── store/               # State management (Zustand)
├── hooks/               # Custom React hooks
├── utils/               # Helper functions
└── styles/              # Global styles & Tailwind config
```

### Key Pages
- **Dashboard**: Overview of expenses and subscriptions.
- **Subscriptions**: Manage your recurring payments.
- **Expenses**: Log and track one-off costs.
- **Budgets**: Set monthly spending limits.
- **Profile**: Manage user settings.

## 🛠 Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Routing**: React Router
- **HTTP Client**: Axios
- **Charts**: Recharts (if applicable)
