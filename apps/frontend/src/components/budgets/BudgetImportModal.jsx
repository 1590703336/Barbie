import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useImportPreview, useImportBudgets, useBudgetList } from '../../hooks/queries/useBudgetQueries'
import { formatCurrency } from '../../utils/formatCurrency'
import { CategoryIcon } from '../common/CategoryIcon'
import useStore from '../../store/store'

export default function BudgetImportModal({ isOpen, onClose, targetMonth, targetYear, onImportComplete }) {
    const user = useStore((state) => state.user)
    const userId = user?._id || user?.id || user?.userId || null
    const currency = user?.defaultCurrency || 'USD'

    const [selectedBudgets, setSelectedBudgets] = useState({})
    const [editedAmounts, setEditedAmounts] = useState({})
    const [conflictStrategies, setConflictStrategies] = useState({}) // Per-item strategy for conflicts

    // Fetch preview data (budgets from last non-empty month)
    const { data: previewData, isLoading, error } = useImportPreview({
        month: targetMonth,
        year: targetYear,
        enabled: isOpen,
    })

    // Fetch existing budgets in target month to detect conflicts
    const { data: existingBudgets = [] } = useBudgetList({
        month: targetMonth,
        year: targetYear,
        userId,
    })

    const importMutation = useImportBudgets()

    // Determine which categories have conflicts
    const conflicts = useMemo(() => {
        if (!previewData?.budgets || !existingBudgets) return new Set()
        const existingCategories = existingBudgets.map(b => b.category)
        return new Set(
            previewData.budgets
                .map(b => b.category)
                .filter(cat => existingCategories.includes(cat))
        )
    }, [previewData, existingBudgets])

    // Create a map of existing budgets by category for easy lookup
    const existingBudgetMap = useMemo(() => {
        if (!existingBudgets) return new Map()
        return new Map(existingBudgets.map(b => [b.category, b]))
    }, [existingBudgets])

    // Initialize selections when preview data loads
    useEffect(() => {
        if (previewData?.budgets) {
            const initialSelections = {}
            const initialAmounts = {}
            const initialStrategies = {}

            previewData.budgets.forEach((budget) => {
                const key = budget.category
                initialSelections[key] = true // All selected by default
                initialAmounts[key] = budget.limit
                // Default strategy for conflicts is 'merge' (skip)
                if (conflicts.has(key)) {
                    initialStrategies[key] = 'merge'
                }
            })

            setSelectedBudgets(initialSelections)
            setEditedAmounts(initialAmounts)
            setConflictStrategies(initialStrategies)
        }
    }, [previewData, conflicts])

    const handleToggleCategory = (category) => {
        setSelectedBudgets((prev) => ({
            ...prev,
            [category]: !prev[category],
        }))
    }

    const handleSelectAll = () => {
        if (!previewData?.budgets) return

        // Check if all are currently selected
        const allSelected = previewData.budgets.every(b => selectedBudgets[b.category])

        const newSelections = {}
        previewData.budgets.forEach(b => {
            newSelections[b.category] = !allSelected // Toggle all
        })
        setSelectedBudgets(newSelections)
    }

    const handleAmountChange = (category, value) => {
        setEditedAmounts((prev) => ({
            ...prev,
            [category]: value,
        }))
    }

    const handleConflictStrategyChange = (category, strategy) => {
        setConflictStrategies((prev) => ({
            ...prev,
            [category]: strategy,
        }))
    }

    const handleImport = async () => {
        if (!previewData?.budgets) return

        // Separate budgets into conflict and non-conflict
        const selectedConflicts = previewData.budgets
            .filter((budget) => selectedBudgets[budget.category] && conflicts.has(budget.category))
            .map((budget) => ({
                category: budget.category,
                limit: parseFloat(editedAmounts[budget.category] || budget.limit),
                currency: budget.currency,
                thresholds: budget.thresholds,
                strategy: conflictStrategies[budget.category] || 'merge'
            }))

        const selectedNonConflicts = previewData.budgets
            .filter((budget) => selectedBudgets[budget.category] && !conflicts.has(budget.category))
            .map((budget) => ({
                category: budget.category,
                limit: parseFloat(editedAmounts[budget.category] || budget.limit),
                currency: budget.currency,
                thresholds: budget.thresholds,
            }))

        // Check if we need to replace any conflicts
        const hasReplacements = selectedConflicts.some(b => b.strategy === 'replace')

        if (selectedConflicts.length === 0 && selectedNonConflicts.length === 0) {
            alert('Please select at least one budget to import')
            return
        }

        try {
            // If we have replacements, use 'replace' strategy with all budgets
            // Otherwise use 'merge' strategy
            const strategy = hasReplacements ? 'replace' : 'merge'

            // For replace strategy, only include budgets marked for replacement
            // For merge strategy, include all non-conflicts and conflicts marked as merge (which will be skipped)
            let budgetsToImport
            if (strategy === 'replace') {
                // Include replacements and non-conflicts
                budgetsToImport = [
                    ...selectedConflicts.filter(b => b.strategy === 'replace'),
                    ...selectedNonConflicts
                ].map(({ strategy, ...budget }) => budget) // Remove strategy field
            } else {
                // Include everything (conflicts with merge strategy will be skipped by backend)
                budgetsToImport = [...selectedNonConflicts]
            }

            if (budgetsToImport.length === 0) {
                alert('No budgets to import. Conflicts set to "Skip" will not be imported.')
                return
            }

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
    const allSelected = previewData?.budgets?.every(b => selectedBudgets[b.category]) || false

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
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
                                {/* Budget List */}
                                <div className="mb-6 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-main">Select Budgets to Import</h3>
                                        <button
                                            onClick={handleSelectAll}
                                            className="px-3 py-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 border border-indigo-500/50 hover:border-indigo-400 rounded-lg transition-colors"
                                        >
                                            {allSelected ? 'Unselect All' : 'Select All'}
                                        </button>
                                    </div>

                                    {previewData.budgets.map((budget) => {
                                        const isSelected = selectedBudgets[budget.category]
                                        const hasConflict = conflicts.has(budget.category)
                                        const conflictStrategy = conflictStrategies[budget.category]
                                        const existingBudget = existingBudgetMap.get(budget.category)

                                        return (
                                            <div
                                                key={budget.category}
                                                className={`p-4 rounded-xl border transition-all ${hasConflict
                                                    ? isSelected
                                                        ? 'border-amber-500 bg-amber-500/10'
                                                        : 'border-amber-700/50 glass'
                                                    : isSelected
                                                        ? 'border-indigo-500 bg-indigo-500/10'
                                                        : 'border-slate-700 glass'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleToggleCategory(budget.category)}
                                                        className="w-5 h-5 mt-1"
                                                    />
                                                    <CategoryIcon
                                                        category={budget.category}
                                                        className="h-8 w-8 text-slate-300 mt-1"
                                                    />
                                                    <div className="flex-1 space-y-3">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-semibold text-main">{budget.category}</p>
                                                                {hasConflict && (
                                                                    <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 rounded">
                                                                        Conflict
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {hasConflict && existingBudget ? (
                                                            <div className="space-y-2">
                                                                {/* Current (Existing) Budget */}
                                                                <div
                                                                    className="p-3 rounded-lg"
                                                                    style={{
                                                                        backgroundColor: 'var(--conflict-current-bg)',
                                                                        borderWidth: '1px',
                                                                        borderStyle: 'solid',
                                                                        borderColor: 'var(--conflict-current-border)'
                                                                    }}
                                                                >
                                                                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--conflict-current-label)' }}>
                                                                        Current Budget
                                                                    </p>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm font-semibold" style={{ color: 'var(--conflict-current-text)' }}>
                                                                            {existingBudget.limit}
                                                                        </span>
                                                                        <span className="text-xs" style={{ color: 'var(--conflict-current-label)' }}>
                                                                            {existingBudget.currency}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* New (Import) Budget */}
                                                                <div
                                                                    className="p-3 rounded-lg"
                                                                    style={{
                                                                        backgroundColor: 'var(--conflict-new-bg)',
                                                                        borderWidth: '1px',
                                                                        borderStyle: 'solid',
                                                                        borderColor: 'var(--conflict-new-border)'
                                                                    }}
                                                                >
                                                                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--conflict-new-label)' }}>New Budget (from import)</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.01"
                                                                            value={editedAmounts[budget.category] ?? budget.limit}
                                                                            onChange={(e) => handleAmountChange(budget.category, e.target.value)}
                                                                            disabled={!isSelected}
                                                                            className={`w-32 px-3 py-2 text-sm rounded-lg border ${isSelected
                                                                                ? 'border-slate-300 bg-white text-slate-900'
                                                                                : 'border-slate-300 bg-slate-100 text-slate-400 cursor-not-allowed'
                                                                                }`}
                                                                        />
                                                                        <span className="text-xs" style={{ color: 'var(--conflict-new-label)' }}>{budget.currency}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
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
                                                        )}

                                                        {hasConflict && isSelected && (
                                                            <div className="flex items-center gap-3 pt-2">
                                                                <span className="text-xs text-secondary">Action:</span>
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <input
                                                                        type="radio"
                                                                        name={`strategy-${budget.category}`}
                                                                        value="merge"
                                                                        checked={conflictStrategy === 'merge'}
                                                                        onChange={(e) => handleConflictStrategyChange(budget.category, e.target.value)}
                                                                        className="w-3 h-3"
                                                                    />
                                                                    <span className="text-xs text-main">Skip (Keep current)</span>
                                                                </label>
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <input
                                                                        type="radio"
                                                                        name={`strategy-${budget.category}`}
                                                                        value="replace"
                                                                        checked={conflictStrategy === 'replace'}
                                                                        onChange={(e) => handleConflictStrategyChange(budget.category, e.target.value)}
                                                                        className="w-3 h-3"
                                                                    />
                                                                    <span className="text-xs text-main">Replace with new</span>
                                                                </label>
                                                            </div>
                                                        )}
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
