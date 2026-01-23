import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../../store/store'
import ThemeToggle from './ThemeToggle'
import ChangelogButton from './ChangelogButton'

const MotionLink = motion(Link)

const navItems = [
  { to: '/', label: 'Home', protected: false },
  { to: '/dashboard', label: 'Dashboard', protected: true },
  { to: '/create', label: 'New entries', protected: true },
  { to: '/records', label: 'Records', protected: true },
  { to: '/rates', label: 'Exchange Rates', protected: true },
  { to: '/profile', label: 'Profile', protected: true },
]

function NavBar() {
  const [isOpen, setIsOpen] = useState(false)
  const isAuthenticated = useStore((state) => state.isAuthenticated)
  const user = useStore((state) => state.user)
  const logout = useStore((state) => state.logout)

  const filteredNavItems = navItems.filter((item) => {
    if (isAuthenticated && item.to === '/') return false
    return item.protected ? isAuthenticated : true
  })

  return (
    <header className="sticky top-0 z-20 glass border-b border-transparent">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 md:hidden text-secondary hover:text-main"
          aria-label="Toggle menu"
        >
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={isOpen ? "open" : "closed"}
          >
            <motion.path
              variants={{
                closed: { d: "M 4 6 L 20 6" },
                open: { d: "M 6 6 L 18 18" }
              }}
            />
            <motion.path
              d="M 4 12 L 20 12"
              variants={{
                closed: { opacity: 1 },
                open: { opacity: 0 }
              }}
              transition={{ duration: 0.1 }}
            />
            <motion.path
              variants={{
                closed: { d: "M 4 18 L 20 18" },
                open: { d: "M 6 18 L 18 6" }
              }}
            />
          </motion.svg>
        </button>

        {/* Logo - Centered on Mobile, Left on Desktop */}
        <Link
          to="/"
          className="text-xl font-semibold text-main absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0"
        >
          Barbie Cloud
        </Link>

        {/* Desktop Navigation - Centered */}
        <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-600">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative px-3 py-2 rounded-lg transition text-secondary hover:text-main`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg"
                      style={{ backgroundColor: 'var(--nav-active-bg)' }}
                      transition={{ type: 'spring', duration: 0.6 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Actions - Right */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <ThemeToggle />
          <ChangelogButton />
          {isAuthenticated ? (
            <>
              <span className="text-secondary">Hi, {user?.name ?? user?.email ?? 'User'}</span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-lg bg-slate-900 px-3 py-2 text-white hover:bg-slate-800"
                onClick={logout}
              >
                Logout
              </motion.button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-2 rounded-lg text-secondary hover:bg-white/10 hover:text-main"
              >
                Log in
              </Link>
              <MotionLink
                to="/register"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/30"
                style={{ color: 'rgba(255, 255, 255, 1)' }}
              >
                Sign up
              </MotionLink>
            </>
          )}
        </div>

        {/* Placeholder for right side on mobile to balance flex if needed, 
            but since logo is absolute, we don't strictly need it. 
            However, keeping DOM clean. */}
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
          >
            <div className="flex flex-col p-4 gap-4">
              <nav className="flex flex-col gap-2">
                {filteredNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `px-4 py-3 rounded-lg text-secondary hover:bg-slate-100 dark:hover:bg-slate-900 ${isActive ? 'bg-slate-100 dark:bg-slate-900 text-main font-medium' : ''
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-col gap-4">
                <div className="flex items-center justify-between px-4">
                  <span className="text-sm text-secondary">Dark Mode</span>
                  <ThemeToggle />
                </div>
                <div className="flex items-center justify-between px-4">
                  <span className="text-sm text-secondary">Changelog</span>
                  <ChangelogButton />
                </div>

                {isAuthenticated ? (
                  <div className="flex flex-col gap-3 mt-2">
                    <span className="text-sm text-center text-secondary">
                      Signed in as {user?.name ?? user?.email ?? 'User'}
                    </span>
                    <button
                      className="w-full rounded-lg bg-slate-900 px-4 py-3 text-white hover:bg-slate-800 text-center"
                      onClick={() => {
                        logout()
                        setIsOpen(false)
                      }}
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 mt-2">
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="w-full text-center px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 text-secondary hover:bg-slate-50 dark:hover:bg-slate-900"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsOpen(false)}
                      className="w-full text-center rounded-lg bg-indigo-600 px-4 py-3 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/30"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header >
  )
}

export default NavBar

