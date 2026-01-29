import { useState } from 'react'
import PasswordInput from '../common/PasswordInput'

function ResetPasswordForm({ onSubmit, loading }) {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const handleSubmit = (event) => {
        event.preventDefault()
        onSubmit?.({ password, confirmPassword })
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4"
        >
            <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-muted">New Password</label>
                <PasswordInput
                    id="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                />
            </div>
            <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-muted">Confirm Password</label>
                <PasswordInput
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                />
            </div>
            {password && confirmPassword && password !== confirmPassword && (
                <p className="text-sm text-rose-400">Passwords do not match</p>
            )}
            <button
                type="submit"
                disabled={loading || (password !== confirmPassword)}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-400 shadow-lg shadow-indigo-500/30"
            >
                {loading ? 'Resetting...' : 'Reset Password'}
            </button>
        </form>
    )
}

export default ResetPasswordForm
