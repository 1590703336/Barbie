import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const MotionLink = motion(Link)

function Home() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-16 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <p className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
          Subscription & Expense Manager
        </p>
        <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
          Sign up or log in to manage your subscriptions and expenses
        </h1>
        <p className="text-base text-slate-600">
          DA/DS modules are hidden for now. Log in to view, update, and delete your expenses and subscriptions.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center justify-center gap-3 sm:flex-row"
      >
        <MotionLink
          to="/register"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="rounded-lg bg-slate-900 px-6 py-3 text-white hover:bg-slate-800"
          style={{ color: 'rgba(255, 255, 255, 1)' }}
        >
          Create Account
        </MotionLink>
        <MotionLink
          to="/login"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="rounded-lg border border-slate-200 px-6 py-3 text-slate-800 hover:border-slate-300"
        >
          Already have an account? Log in
        </MotionLink>
      </motion.div>
    </div>
  )
}

export default Home

