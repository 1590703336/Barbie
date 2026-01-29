import { useState } from 'react'

/**
 * PasswordInput Component
 * 
 * A reusable password input with visibility toggle.
 * Features:
 * - Eye icon toggle for show/hide password
 * - Accessible with aria-labels and keyboard support
 * - Theme-aware styling following design system
 * - Flexible props for customization
 * 
 * @example
 * <PasswordInput
 *   id="password"
 *   value={password}
 *   onChange={(e) => setPassword(e.target.value)}
 *   required
 *   placeholder="••••••••"
 * />
 */
function PasswordInput({
    id,
    value,
    onChange,
    placeholder = '••••••••',
    required = false,
    minLength,
    disabled = false,
    className = '',
    inputClassName = '',
    label,
    labelClassName = '',
}) {
    const [isVisible, setIsVisible] = useState(false)

    const toggleVisibility = () => {
        setIsVisible(!isVisible)
    }

    // Eye icon (password hidden)
    const EyeIcon = () => (
        <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
        </svg>
    )

    // Eye-slash icon (password visible)
    const EyeSlashIcon = () => (
        <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
            />
        </svg>
    )

    const baseInputClasses = `mt-1 w-full rounded-lg bg-slate-800/50 border border-slate-700 
    px-3 py-2 pr-10 text-sm text-main 
    focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20`

    return (
        <div className={className}>
            {label && (
                <label
                    htmlFor={id}
                    className={`block text-sm font-medium text-muted ${labelClassName}`}
                >
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    id={id}
                    type={isVisible ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    minLength={minLength}
                    disabled={disabled}
                    className={`${baseInputClasses} ${inputClassName}`}
                />
                <button
                    type="button"
                    onClick={toggleVisibility}
                    disabled={disabled}
                    aria-label={isVisible ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 
            text-muted hover:text-main transition-colors
            focus:outline-none focus:ring-2 focus:ring-indigo-500/20 rounded
            disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isVisible ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
            </div>
        </div>
    )
}

export default PasswordInput
