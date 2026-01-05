import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import PageTransition from './components/common/PageTransition'
import NavBar from './components/common/NavBar'
import Footer from './components/common/Footer'
import ProtectedRoute from './components/common/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CreateEntries from './pages/CreateEntries'
import Records from './pages/Records'
import CurrencyRates from './pages/CurrencyRates'
import Profile from './pages/Profile'

function App() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <NavBar />
      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><Home /></PageTransition>} />
            <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
            <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
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
  )
}

export default App
