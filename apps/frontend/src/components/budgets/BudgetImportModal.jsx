import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useImportPreview, useImportBudgets } from '../../hooks/queries/useBudgetQueries'
import { formatCurrency } from '../../utils/formatCurrency'
import { CategoryIcon } from '../common/CategoryIcon'
import useStore from '../../store/store'

export default function BudgetImportModal({ isOpen, onClose, targetMonth, targetYear, onImportComplete }) {
    const user = useStore((state) => state.user)
    const currency = user?.defaultCurrency || 'USD'

    const [strategy, setStrategy] = useState('merge')
    const [selectedBudgets, setSelectedBudgets] = useState({})
    const [editedAmounts, setEditedAmounts] = useState({})

    // Fetch preview data
    const { data: previewData, isLoading, error } = useImportPreview({
        month: targetMonth,
        year: targetYear,
        enabled: isOpen,
    })

    const importMutation = useImportBudgets()

    // Initialize selections when preview data loads
    useEffect(() => {
        if (previewData?.budgets) {
            const initialSelections = {}
            const initialAmounts = {}
            previewData.budgets.forEach((budget) => {
                const key = budget.category
                initialSelections[key] = true // All selected by default
                initialAmounts[key] = budget.limit
            })
            setSelectedBudgets(initialSelections)
            setEditedAmounts(initialAmounts)
        }
    }, [previewData])

    const handleToggleCategory = (category) => {
        setSelectedBudgets((prev) => ({
            ...prev,
            [category]: !prev[category],
        }))
    }

    const handleAmountChange = (category, value) => {
        setEditedAmounts((prev) => ({
            ...prev,
            [category]: value,
        }))
    }

    const handleImport = async () => {
        if (!previewData?.budgets) return

        // Filter selected budgets and apply edited amounts
        const budgetsToImport = previewData.budgets
            .filter((budget) => selectedBudgets[budget.category])
            .map((budget) => ({
                category: budget.category,
                limit: parseFloat(editedAmounts[budget.category] || budget.limit),
                currency: budget.currency,
                thresholds: budget.thresholds,
            }))

        if (budgetsToImport.length === 0) {
            alert('Please select at least one budget to import')
            return
        }

        try {
            await importMutation.mutateAsync({
                targetMonth,
                targetYear,
                budgets: budgetsToImport,
                strategy,
            })
            onImportComplete?.()
            onClose()
        } catch (err) {
            console.error('Import failed:', err)
        }
    }

    if (!isOpen) return null

    const monthName = new Date(0, targetMonth - 1).toLocaleString('en-US', { month: 'long' })

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl glass-card p-6"
                    >
                        {/* Header */}
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-main mb-2">
                                Import Budgets to {monthName} {targetYear}
                            </h2>
                            {isLoading && (
                                <p className="text-sm text-secondary">Loading preview...</p>
                            )}
                            {error && (
                                <p className="text-sm text-error">Error loading preview: {error.message}</p>
                            )}
                            {!isLoading && !error && previewData && (
                                <>
                                    {previewData.budgets.length === 0 ? (
                                        <p className="text-sm text-secondary">
                                            No budgets found in the last 12 months to import.
                                        </p>
                                    ) : (
                                        <p className="text-sm text-secondary">
                                            Importing from{' '}
                                            {new Date(0, previewData.sourceMonth - 1).toLocaleString('en-US', {
                                                month: 'long',
                                            })}{' '}
                                            {previewData.sourceYear}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>

                        {!isLoading && !error && previewData?.budgets?.length > 0 && (
                            <>
                                {/* Strategy Selector */}
                                <div className="mb-6 p-4 rounded-xl glass border border-slate-700">
                                    <label className="block text-sm font-semibold text-main mb-2">
                                        Import Strategy
                                    </label>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="strategy"
                                                value="merge"
                                                checked={strategy === 'merge'}
                                                onChange={(e) => setStrategy(e.target.value)}
                                                className="w-4 h-4"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-main">Merge</span>
                                                <p className="text-xs text-secondary">
                                                    Only import categories that don't exist in {monthName}
                                                </p>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="strategy"
                                                value="replace"
                                                checked={strategy === 'replace'}
                                                onChange={(e) => setStrategy(e.target.value)}
                                                className="w-4 h-4"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-main">Replace</span>
                                                <p className="text-xs text-secondary">
                                                    Replace all existing budgets in {monthName} with selected ones
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Budget List */}
                                <div className="mb-6 space-y-3">
                                    <h3 className="text-sm font-semibold text-main">Select Budgets to Import</h3>
                                    {previewData.budgets.map((budget) => {
                                        const isSelected = selectedBudgets[budget.category]
                                        return (
                                            <div
                                                key={budget.category}
                                                className={`p-4 rounded-xl border transition-all ${isSelected
                                                        ? 'border-indigo-500 bg-indigo-500/10'
                                                        : 'border-slate-700 glass'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleToggleCategory(budget.category)}
                                                        className="w-5 h-5"
                                                    />
                                                    <CategoryIcon
                                                        category={budget.category}
                                                        className="h-8 w-8 text-slate-300"
                                                    />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-main">{budget.category}</p>
                                                        <p className="text-xs text-secondary">Currency: {budget.currency}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={editedAmounts[budget.category] ?? budget.limit}
                                                            onChange={(e) => handleAmountChange(budget.category, e.target.value)}
                                                            disabled={!isSelected}
                                                            className={`w-32 px-3 py-2 text-sm rounded-lg border ${isSelected
                                                                    ? 'border-slate-700 bg-slate-800/50 text-main'
                                                                    : 'border-slate-700 bg-slate-900/50 text-slate-500 cursor-not-allowed'
                                                                }`}
                                                        />
                                                        <span className="text-sm text-secondary">{budget.currency}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-2 rounded-lg text-sm font-medium text-main hover:bg-slate-800/50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleImport}
                                        disabled={importMutation.isPending}
                                        className="px-6 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {importMutation.isPending ? 'Importing...' : 'Import Budgets'}
                                    </button>
                                </div>

                                {importMutation.isError && (
                                    <p className="mt-3 text-sm text-error">
                                        Error: {importMutation.error?.response?.data?.message || importMutation.error?.message}
                                    </p>
                                )}
                            </>
                        )}

                        {!isLoading && !error && previewData?.budgets?.length === 0 && (
                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 rounded-lg text-sm font-medium text-main hover:bg-slate-800/50 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
