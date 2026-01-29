import { motion as Motion, AnimatePresence } from 'framer-motion'
import { ActionButton } from './ActionButton'
import { CategoryIcon } from './CategoryIcon'
import CurrencySelect from './CurrencySelect'

export default function RecordModal({
    isOpen,
    onClose,
    type,
    data,
    onChange,
    onSave,
    onDelete,
    options = {} // { categories, currencies, frequencies, statuses, paymentMethods }
}) {
    if (!isOpen) return null

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose()
    }

    // Common input styles
    const inputClass = "w-full rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none transition-colors"
    const labelClass = "block text-xs font-medium text-secondary mb-1 uppercase tracking-in-widest"

    const renderForm = () => {
        switch (type) {
            case 'budget':
                return (
                    <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Category</label>
                                <select
                                    className={inputClass}
                                    value={data.category ?? ''}
                                    onChange={(e) => onChange('category', e.target.value)}
                                >
                                    <option value="">Select category</option>
                                    {options.categories?.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Currency</label>
                                <CurrencySelect
                                    value={data.currency ?? ''}
                                    onChange={(value) => onChange('currency', value)}
                                    currencies={options.currencies}
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Monthly Limit</label>
                            <input
                                className={inputClass}
                                type="number"
                                min={0}
                                value={data.limit ?? ''}
                                onChange={(e) => onChange('limit', e.target.value)}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Month</label>
                                <select
                                    className={inputClass}
                                    value={data.month ?? ''}
                                    onChange={(e) => onChange('month', e.target.value)}
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                        <option key={m} value={m}>
                                            {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Year</label>
                                <select
                                    className={inputClass}
                                    value={data.year ?? ''}
                                    onChange={(e) => onChange('year', Number(e.target.value))}
                                >
                                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((y) => (
                                        <option key={y} value={y}>
                                            {y}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )

            case 'expense':
                return (
                    <div className="grid gap-4">
                        <div>
                            <label className={labelClass}>Title</label>
                            <input
                                className={inputClass}
                                value={data.title ?? ''}
                                onChange={(e) => onChange('title', e.target.value)}
                                placeholder="Expense title"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Amount</label>
                                <input
                                    className={inputClass}
                                    type="number"
                                    value={data.amount ?? ''}
                                    onChange={(e) => onChange('amount', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Currency</label>
                                <CurrencySelect
                                    value={data.currency ?? ''}
                                    onChange={(value) => onChange('currency', value)}
                                    currencies={options.currencies}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Category</label>
                                <select
                                    className={inputClass}
                                    value={data.category ?? ''}
                                    onChange={(e) => onChange('category', e.target.value)}
                                >
                                    <option value="">Select category</option>
                                    {options.categories?.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Date</label>
                                <input
                                    className={inputClass}
                                    type="date"
                                    value={data.date ?? ''}
                                    onChange={(e) => onChange('date', e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Notes</label>
                            <textarea
                                className={inputClass}
                                rows={3}
                                value={data.notes ?? ''}
                                onChange={(e) => onChange('notes', e.target.value)}
                                placeholder="Add details..."
                            />
                        </div>
                    </div>
                )

            case 'subscription':
                return (
                    <div className="grid gap-4">
                        <div>
                            <label className={labelClass}>Service Name</label>
                            <input
                                className={inputClass}
                                value={data.name ?? ''}
                                onChange={(e) => onChange('name', e.target.value)}
                                placeholder="Netflix, Spotify..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Price</label>
                                <input
                                    className={inputClass}
                                    type="number"
                                    value={data.price ?? ''}
                                    onChange={(e) => onChange('price', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Currency</label>
                                <CurrencySelect
                                    value={data.currency ?? ''}
                                    onChange={(value) => onChange('currency', value)}
                                    currencies={options.currencies}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Frequency</label>
                                <select
                                    className={inputClass}
                                    value={data.frequency ?? ''}
                                    onChange={(e) => onChange('frequency', e.target.value)}
                                >
                                    <option value="">Select frequency</option>
                                    {options.frequencies?.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Category</label>
                                <select
                                    className={inputClass}
                                    value={data.category ?? ''}
                                    onChange={(e) => onChange('category', e.target.value)}
                                >
                                    <option value="">Select category</option>
                                    {options.categories?.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Payment Method</label>
                                <input
                                    className={inputClass}
                                    value={data.paymentMethod ?? ''}
                                    onChange={(e) => onChange('paymentMethod', e.target.value)}
                                    placeholder="Visa ending 4242"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Status</label>
                                <select
                                    className={inputClass}
                                    value={data.status ?? ''}
                                    onChange={(e) => onChange('status', e.target.value)}
                                >
                                    <option value="">Select status</option>
                                    {options.statuses?.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Start Date</label>
                                <input
                                    className={inputClass}
                                    type="date"
                                    value={data.startDate ?? ''}
                                    onChange={(e) => onChange('startDate', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Renewal Date</label>
                                <input
                                    className={inputClass}
                                    type="date"
                                    value={data.renewalDate ?? ''}
                                    onChange={(e) => onChange('renewalDate', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )

            case 'income':
                return (
                    <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Amount</label>
                                <input
                                    className={inputClass}
                                    type="number"
                                    value={data.amount ?? ''}
                                    onChange={(e) => onChange('amount', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Currency</label>
                                <CurrencySelect
                                    value={data.currency ?? ''}
                                    onChange={(value) => onChange('currency', value)}
                                    currencies={options.currencies}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Source</label>
                                <input
                                    className={inputClass}
                                    value={data.source ?? ''}
                                    onChange={(e) => onChange('source', e.target.value)}
                                    placeholder="Employer, Client..."
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Category</label>
                                <select
                                    className={inputClass}
                                    value={data.category ?? ''}
                                    onChange={(e) => onChange('category', e.target.value)}
                                >
                                    <option value="">Select category</option>
                                    {options.categories?.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Date</label>
                            <input
                                className={inputClass}
                                type="date"
                                value={data.date ?? ''}
                                onChange={(e) => onChange('date', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Notes</label>
                            <textarea
                                className={inputClass}
                                rows={3}
                                value={data.notes ?? ''}
                                onChange={(e) => onChange('notes', e.target.value)}
                                placeholder="Add details..."
                            />
                        </div>
                    </div>
                )
            default:
                return null
        }
    }

    // Get title icon based on type
    const getHeaderIcon = () => {
        switch (type) {
            case 'expense': return data.category ? <CategoryIcon category={data.category} name={data.title} className="w-10 h-10" /> : <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">💸</div>
            case 'income': return <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">💰</div>
            case 'budget': return data.category ? <CategoryIcon category={data.category} className="w-10 h-10" /> : <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">📊</div>
            case 'subscription': return data.category ? <CategoryIcon category={data.category} name={data.name} className="w-10 h-10" /> : <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">🔄</div>
            default: return null
        }
    }

    const getTitle = () => {
        if (type === 'expense') return data.title || 'Edit Expense'
        if (type === 'income') return data.source || data.category || 'Edit Income'
        if (type === 'budget') return `${data.category || 'Budget'} Limit`
        if (type === 'subscription') return data.name || 'Edit Subscription'
        return 'Edit Record'
    }

    return (
        <AnimatePresence>
            <Motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={handleBackdropClick}
            >
                <Motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-lg rounded-2xl glass-card border border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-deep)]/50">
                        <div className="flex items-center gap-4">
                            {getHeaderIcon()}
                            <div>
                                <h3 className="text-lg font-semibold text-main">{getTitle()}</h3>
                                <p className="text-xs text-secondary uppercase tracking-wider">{type}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/10 text-secondary transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    {/* Error Message */}
                    {data.error && (
                        <div className="mx-6 mt-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-sm text-rose-500">
                            {data.error}
                        </div>
                    )}

                    {/* Form Content */}
                    <div className="p-6 overflow-y-auto">
                        {renderForm()}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-deep)]/50 flex justify-between items-center gap-4">
                        <ActionButton
                            variant="danger"
                            onClick={async () => {
                                await onDelete()
                                await new Promise(r => setTimeout(r, 1000))
                                onClose()
                            }}
                        >
                            Delete
                        </ActionButton>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-secondary hover:text-main hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <ActionButton
                                onClick={async () => {
                                    await onSave()
                                    // Wait a bit for the success animation to be visible
                                    await new Promise(r => setTimeout(r, 800))
                                    onClose()
                                }}
                                successText="Saved!"
                            >
                                Save Changes
                            </ActionButton>
                        </div>
                    </div>
                </Motion.div>
            </Motion.div>
        </AnimatePresence>
    )
}
