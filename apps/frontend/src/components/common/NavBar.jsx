import { Link, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import useStore from '../../store/store'

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
  const isAuthenticated = useStore((state) => state.isAuthenticated)
  const user = useStore((state) => state.user)
  const logout = useStore((state) => state.logout)

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-semibold text-slate-900">
          Barbie Cloud
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
          {navItems
            .filter((item) => (item.protected ? isAuthenticated : true))
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative px-3 py-2 rounded-lg transition text-slate-900 hover:text-slate-600`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 bg-white rounded-lg mix-blend-difference"
                        transition={{ type: 'spring', duration: 0.6 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          {isAuthenticated ? (
            <>
              <span className="text-slate-700">Hi, {user?.email ?? 'User'}</span>
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
                className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100"
              >
                Log in
              </Link>
              <MotionLink
                to="/register"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-lg bg-slate-900 px-3 py-2 text-white hover:bg-slate-800"
                style={{ color: 'rgba(255, 255, 255, 1)' }}
              >
                Sign up
              </MotionLink>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default NavBar

