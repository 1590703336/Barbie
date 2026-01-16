import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import heroImg from '../assets/hero.png'
import subImg from '../assets/subscriptions.png'
import analyticsImg from '../assets/analytics.png'
import incomeImg from '../assets/income_features.png'
import currencyImg from '../assets/currency_features.png'

const MotionLink = motion(Link)

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.6, ease: "easeOut" }
}

const fadeInLeft = {
  initial: { opacity: 0, x: -50 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.7, ease: "easeOut" }
}

const fadeInRight = {
  initial: { opacity: 0, x: 50 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.7, ease: "easeOut" }
}

function Home() {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 lg:pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex-1 text-center lg:text-left"
            >
              <span className="inline-block rounded-full bg-slate-900/10 px-4 py-1.5 text-sm font-semibold text-slate-900 mb-6">
                Smart Financial Management
              </span>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl mb-6">
                Master your <span className="text-blue-600">Finances</span>
              </h1>
              <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0">
                The all-in-one platform to track income, manage expenses, and control subscriptions. Smart currency conversion and automated alerts help you stay on top of your money.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <MotionLink
                  to="/register"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-xl bg-slate-900 px-8 py-4 text-white font-semibold shadow-lg hover:bg-slate-800 hover:shadow-xl transition-all"
                  style={{ color: '#ffffff' }}
                >
                  Get Started Free
                </MotionLink>
                <MotionLink
                  to="/login"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-xl border border-slate-200 px-8 py-4 text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  Log In
                </MotionLink>
              </div>
            </motion.div>

            <motion.div
              style={{ y: heroY }}
              initial={{ opacity: 0, scale: 0.9, rotateY: 30 }}
              animate={{ opacity: 1, scale: 1, rotateY: -10 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="flex-1 perspective-1000"
            >
              <img
                src={heroImg}
                alt="Dashboard Mockup"
                className="w-full h-auto rounded-2xl shadow-2xl transform rotate-y-12 transition-transform duration-700 ease-out"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature 1: Subscriptions */}
      <section className="py-24 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div
              {...fadeInLeft}
              className="flex-1 order-2 lg:order-1"
            >
              <div className="glass-card p-2 rounded-2xl shadow-xl">
                <img
                  src={subImg}
                  alt="Subscription Tracking"
                  className="w-full h-auto rounded-xl"
                />
              </div>
            </motion.div>
            <motion.div
              {...fadeInRight}
              className="flex-1 order-1 lg:order-2"
            >
              <div className="inline-flex items-center justify-center p-3 glass rounded-xl mb-6 border border-blue-500/30">
                <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-main mb-4">Never Miss a Renewal</h2>
              <p className="text-lg text-secondary mb-6">
                Keep track of all your recurring payments in one organized dashboard. Set custom alerts to remind you before payments occur, giving you the chance to cancel unwanted services in time.
              </p>
              <ul className="space-y-3">
                {['Automatic Renewal Tracking', 'Custom Notification Alerts', 'Cancellation Reminders'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-muted">
                    <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature 2: Income Tracking */}
      <section className="py-24 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div
              {...fadeInLeft}
              className="flex-1"
            >
              <div className="inline-flex items-center justify-center p-3 glass rounded-xl mb-6 border border-purple-500/30">
                <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-main mb-4">Track Every Income Stream</h2>
              <p className="text-lg text-secondary mb-6">
                Whether it's your primary salary, freelance work, or investment returns, keep everything in one place. Understand your cash flow with detailed breakdowns.
              </p>
              <ul className="space-y-3">
                {['Multiple Income Sources', 'Monthly Income Analytics', 'Year-to-Date Tracking'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-muted">
                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              {...fadeInRight}
              className="flex-1"
            >
              <div className="glass-card p-2 rounded-2xl shadow-xl">
                <img
                  src={incomeImg}
                  alt="Income Tracking"
                  className="w-full h-auto rounded-xl"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature 3: Budgeting */}
      <section className="py-24 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div
              {...fadeInLeft}
              className="flex-1"
            >
              <div className="inline-flex items-center justify-center p-3 glass rounded-xl mb-6 border border-green-500/30">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-main mb-4">Visualize Your Growth</h2>
              <p className="text-lg text-secondary mb-6">
                Set comprehensive monthly budgets and visualize your spending habits. Our intuitive charts show you exactly where your money goes, helping you save more for what truly matters.
              </p>
              <ul className="space-y-3">
                {['Visual Spending Breakdown', 'Monthly Budget Goals', 'Smart Savings Insights'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-muted">
                    <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              {...fadeInRight}
              className="flex-1"
            >
              <div className="glass-card p-2 rounded-2xl shadow-xl">
                <img
                  src={analyticsImg}
                  alt="Budget Analytics"
                  className="w-full h-auto rounded-xl"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature 4: Global Currency */}
      <section className="py-24 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div
              {...fadeInLeft}
              className="flex-1"
            >
              <div className="glass-card p-2 rounded-2xl shadow-xl">
                <img
                  src={currencyImg}
                  alt="Global Currency Support"
                  className="w-full h-auto rounded-xl"
                />
              </div>
            </motion.div>
            <motion.div
              {...fadeInRight}
              className="flex-1"
            >
              <div className="inline-flex items-center justify-center p-3 glass rounded-xl mb-6 border border-indigo-500/30">
                <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-main mb-4">Global Currency Support</h2>
              <p className="text-lg text-secondary mb-6">
                Travel freely and manage finances across borders. We support real-time currency conversion for USD, EUR, CNY, and more.
              </p>
              <ul className="space-y-3">
                {['Real-time Exchange Rates', 'Multi-currency Wallets', 'Instant Conversion'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-muted">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature 3: Security / Benefits Grid */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            {...fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">Designed for security and privacy</h2>
            <p className="text-secondary max-w-2xl mx-auto">
              We prioritize your data security so you can manage your finances with peace of mind.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              {...fadeInUp}
              transition={{ delay: 0.1 }}
              className="bg-slate-800 p-8 rounded-2xl border border-slate-700"
            >
              <div className="bg-slate-700/50 w-12 h-12 rounded-lg flex items-center justify-center mb-6 text-2xl">
                🔒
              </div>
              <h3 className="text-xl font-bold mb-3">Bank-Grade Encryption</h3>
              <p className="text-secondary">
                Your data is encrypted at rest and in transit using industry-standard protocols.
              </p>
            </motion.div>

            <motion.div
              {...fadeInUp}
              transition={{ delay: 0.2 }}
              className="bg-slate-800 p-8 rounded-2xl border border-slate-700"
            >
              <div className="bg-slate-700/50 w-12 h-12 rounded-lg flex items-center justify-center mb-6 text-2xl">
                🛡️
              </div>
              <h3 className="text-xl font-bold mb-3">Private By Default</h3>
              <p className="text-secondary">
                We don't sell your data. Your financial information belongs to you and only you.
              </p>
            </motion.div>

            <motion.div
              {...fadeInUp}
              transition={{ delay: 0.3 }}
              className="bg-slate-800 p-8 rounded-2xl border border-slate-700"
            >
              <div className="bg-slate-700/50 w-12 h-12 rounded-lg flex items-center justify-center mb-6 text-2xl">
                ⚡
              </div>
              <h3 className="text-xl font-bold mb-3">Real-time Sync</h3>
              <p className="text-secondary">
                Access your data from any device. Updates are synced instantly for seamless management.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div >
  )
}

export default Home
