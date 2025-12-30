import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-16 text-center">
      <div className="space-y-4">
        <p className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
          Subscription & Expense Manager
        </p>
        <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
          Sign up or log in to manage your subscriptions and expenses
        </h1>
        <p className="text-base text-slate-600">
          DA/DS modules are hidden for now. Log in to view, update, and delete your expenses and subscriptions.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          to="/register"
          className="rounded-lg bg-slate-900 px-6 py-3 text-white hover:bg-slate-800"
        >
          Create Account
        </Link>
        <Link
          to="/login"
          className="rounded-lg border border-slate-200 px-6 py-3 text-slate-800 hover:border-slate-300"
        >
          Already have an account? Log in
        </Link>
      </div>
    </div>
  )
}

export default Home

