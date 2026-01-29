import { useState } from 'react'

function ForgotPasswordForm({ onSubmit, loading }) {
    const [email, setEmail] = useState('')

    const handleSubmit = (event) => {
        event.preventDefault()
        onSubmit?.({ email })
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4"
        >
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-muted">Email</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="you@example.com"
                />
            </div>
            <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-400 shadow-lg shadow-indigo-500/30"
            >
                {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
        </form>
    )
}

export default ForgotPasswordForm
