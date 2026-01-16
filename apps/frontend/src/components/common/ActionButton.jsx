import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const variants = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800',
    danger: 'border border-rose-200 text-rose-700 hover:bg-rose-50',
    outline: 'border border-slate-200 text-slate-700 hover:bg-slate-50',
}

export function ActionButton({
    children,
    onClick,
    className = '',
    variant = 'primary',
    successText,
    disabled,
    type = 'button',
}) {
    const [status, setStatus] = useState('idle') // idle, loading, success, error

    const handleClick = async (e) => {
        if (type !== 'submit' && onClick) {
            e.preventDefault()
            setStatus('loading')
            try {
                await onClick(e)
                setStatus('success')
                setTimeout(() => setStatus('idle'), 2000)
            } catch (err) {
                setStatus('error')
                setTimeout(() => setStatus('idle'), 2000)
            }
        }
    }

    // Handle submit types specifically if they rely on form submission logic wrapping this
    // But for this component to hold state, it usually needs to control the trigger.
    // If type is submit, we might rely on the parent form's onSubmit. 
    // However, to animate THIS button based on the result, it's easier if this button triggers the action.
    // For CreateEntries, the form handles submit. We might need to adjust usage there.
    // Actually, standard usage for 'submit' buttons in React often detach the click from the form submit if we want local state.
    // OR we pass `isLoading` and `isSuccess` props if we want to control it externally.
    // BUT the plan said "ActionButton wrapper... handle internally".
    // Let's stick to the internal handling for "onClick" interactions (like Update/Delete in Records).
    // For Submit in Forms, we might need a slight variation or ensure we pass the async handler here.

    // If type is submit, we assume the parent handles the event via onSubmit, 
    // so this internal state might not trigger unless we hook into it.
    // To keep it simple and consistent: We will use this as a 'smart' button. 
    // If type='submit', we still want to show animations. 
    // Strategy: The form onSubmit is usually what we use. 
    // If we change type to 'button' and call onClick manually, we lose form validation (HTML5).
    // Better Strategy: `isLoading` and `isSuccess` props pattern is more robust for Forms.
    // BUT for "Update/Delete" buttons in lists, internal state is perfect.
    // Let's implement a hybrid: If `onClick` is provided, we use internal state. 
    // We can also expose `state` override via props if needed, but let's try to keep it self-contained for the "Update/Delete" use case first.
    // For "Submit", we might need to change the form to use this button's onClick instead of form onSubmit, OR accept "status" as a prop.

    // Let's refine: The prompt asked for specific effects.
    // Implementation Plan said: "User clicks -> State loading -> resolve -> Success".
    // This implies the button drives the action.

    return (
        <motion.button
            layout
            type={type}
            onClick={handleClick}
            disabled={disabled || status === 'loading' || status === 'success'}
            className={`relative overflow-hidden rounded-lg px-4 py-2 font-medium transition-all ${status === 'success'
                    ? 'bg-green-500 text-main border-transparent'
                    : status === 'error'
                        ? 'bg-rose-100 text-rose-700 border-rose-200'
                        : variants[variant]
                } ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            whileHover={status === 'idle' && !disabled ? { scale: 1.02 } : {}}
            whileTap={status === 'idle' && !disabled ? { scale: 0.98 } : {}}
            animate={status === 'error' ? { x: [0, -5, 5, -5, 5, 0] } : {}}
        >
            <AnimatePresence mode="wait" initial={false}>
                {status === 'loading' ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-center gap-2"
                    >
                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                        </svg>
                        <span>Processing...</span>
                    </motion.div>
                ) : status === 'success' ? (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="flex items-center justify-center gap-2"
                    >
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                        <span>{successText || 'Done!'}</span>
                    </motion.div>
                ) : (
                    <motion.span
                        key="idle"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        {children}
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    )
}
