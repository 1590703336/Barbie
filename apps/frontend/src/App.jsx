import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'
import { queryClient } from './lib/queryClient'
import PageTransition from './components/common/PageTransition'
import NavBar from './components/common/NavBar'
import Footer from './components/common/Footer'
import ProtectedRoute from './components/common/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import CreateEntries from './pages/CreateEntries'
import Records from './pages/Records'
import CurrencyRates from './pages/CurrencyRates'
import CurrencyPairDetail from './pages/CurrencyPairDetail'
import Profile from './pages/Profile'

// Admin pages (lazy load for code-splitting)
import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminFinancials from './pages/admin/AdminFinancials'
import AdminSubscriptions from './pages/admin/AdminSubscriptions'
import AdminCurrency from './pages/admin/AdminCurrency'

function App() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  // Admin routes use a separate layout without NavBar/Footer
  if (isAdminRoute) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen">
          <Routes location={location}>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="financials" element={<AdminFinancials />} />
              <Route path="subscriptions" element={<AdminSubscriptions />} />
              <Route path="currency" element={<AdminCurrency />} />
            </Route>
            <Route path="/admin/*" element={<Navigate to="/admin/login" replace />} />
          </Routes>
        </div>
      </QueryClientProvider>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 relative">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageTransition><Home /></PageTransition>} />
              <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
              <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
              <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
              <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <PageTransition>
                      <Dashboard />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create"
                element={
                  <ProtectedRoute>
                    <PageTransition>
                      <CreateEntries />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/records"
                element={
                  <ProtectedRoute>
                    <PageTransition>
                      <Records />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rates"
                element={
                  <ProtectedRoute>
                    <PageTransition>
                      <CurrencyRates />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rates/:pairId"
                element={
                  <ProtectedRoute>
                    <PageTransition>
                      <CurrencyPairDetail />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <PageTransition>
                      <Profile />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    </QueryClientProvider>
  )
}

export default App
