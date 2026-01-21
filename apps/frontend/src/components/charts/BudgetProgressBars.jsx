/**
 * BudgetProgressBars - 预算使用进度条
 * 
 * Horizontal progress bars showing budget usage per category:
 * - Color gradient based on usage percentage (green → yellow → red)
 * - Animated fill on mount
 * - Hover shows exact spent/remaining values
 * - Glassmorphism styled container
 */

import { useMemo, useState } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { CHART_COLORS } from '../../data/mockChartData'
import { CategoryIcon } from '../common/CategoryIcon'

// Get color based on usage percentage
function getProgressColor(usage, status) {
    return CHART_COLORS.status[status] || CHART_COLORS.status.healthy
}

// Single progress bar component
function ProgressBar({
    category,
    budget,
    spent,
    remaining,
    usage,
    status,
    index,
    formatCurrency,
    isHovered,
    onHover
}) {
    const color = getProgressColor(usage, status)
    const clampedUsage = Math.min(usage, 100)

    return (
        <Motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className={`p-4 rounded-xl cursor-pointer chart-item-hover ${isHovered ? 'chart-item-active' : ''
                }`}
            onMouseEnter={() => onHover(index)}
            onMouseLeave={() => onHover(null)}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <CategoryIcon category={category} className="w-6 h-6 text-slate-300" />
                    <span className="text-sm font-medium text-main">{category}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span
                        className="text-sm font-semibold"
                        style={{ color }}
                    >
                        {usage.toFixed(0)}%
                    </span>
                    {status === 'exceeded' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                            Over
                        </span>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-3 rounded-full bg-white/10 overflow-hidden">
                <Motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                        backgroundColor: color,
                        boxShadow: isHovered ? `0 0 12px ${color}` : 'none'
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${clampedUsage}%` }}
                    transition={{
                        duration: 1,
                        delay: index * 0.1 + 0.3,
                        ease: 'easeOut'
                    }}
                />
                {/* Overflow indicator for exceeded budgets */}
                {usage > 100 && (
                    <Motion.div
                        className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-r from-transparent to-red-500/50"
                        initial={{ width: 0 }}
                        animate={{ width: '20%' }}
                        transition={{ duration: 0.5, delay: index * 0.1 + 1 }}
                    />
                )}
            </div>

            {/* Details - shown on hover */}
            <AnimatePresence>
                {isHovered && (
                    <Motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="flex justify-between mt-3 pt-3 border-t border-white/10">
                            <div>
                                <p className="text-xs text-muted">Budget</p>
                                <p className="text-sm font-medium text-main">
                                    {formatCurrency(budget)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted">Spent</p>
                                <p className="text-sm font-medium" style={{ color }}>
                                    {formatCurrency(spent)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted">Remaining</p>
                                <p className={`text-sm font-medium ${remaining >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                    }`}>
                                    {remaining >= 0 ? '' : '-'}{formatCurrency(Math.abs(remaining))}
                                </p>
                            </div>
                        </div>
                    </Motion.div>
                )}
            </AnimatePresence>
        </Motion.div>
    )
}

export default function BudgetProgressBars({
    data,
    title = 'Budget Usage',
    currency = 'CAD'
}) {
    const [hoveredIndex, setHoveredIndex] = useState(null)

    // Format currency helper
    const formatCurrency = useMemo(() => {
        return (value) => {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(value)
        }
    }, [currency])

    const categories = data?.categories || []
    const summary = data?.summary || {}

    if (!categories.length) {
        return (
            <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-main mb-4">{title}</h3>
                <div className="h-[200px] flex items-center justify-center text-secondary">
                    No budget data available
                </div>
            </div>
        )
    }

    return (
        <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-card rounded-2xl p-6"
        >
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-main">{title}</h3>
                    <p className="text-sm text-secondary">
                        Track your spending against budgets
                    </p>
                </div>
                {summary.overallUsage !== undefined && (
                    <div className="text-right">
                        <p className="text-xs text-muted uppercase tracking-wide">Overall</p>
                        <p
                            className="text-xl font-bold"
                            style={{
                                color: getProgressColor(summary.overallUsage,
                                    summary.overallUsage >= 100 ? 'exceeded' :
                                        summary.overallUsage >= 90 ? 'critical' :
                                            summary.overallUsage >= 70 ? 'warning' : 'healthy'
                                )
                            }}
                        >
                            {summary.overallUsage?.toFixed(0)}%
                        </p>
                    </div>
                )}
            </div>

            {/* Summary bar */}
            {summary.totalBudget > 0 && (
                <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-secondary">
                            Spent: {formatCurrency(summary.totalSpent)}
                        </span>
                        <span className="text-secondary">
                            Budget: {formatCurrency(summary.totalBudget)}
                        </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <Motion.div
                            className="h-full rounded-full"
                            style={{
                                backgroundColor: getProgressColor(summary.overallUsage,
                                    summary.overallUsage >= 100 ? 'exceeded' :
                                        summary.overallUsage >= 90 ? 'critical' :
                                            summary.overallUsage >= 70 ? 'warning' : 'healthy'
                                )
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(summary.overallUsage || 0, 100)}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                        />
                    </div>
                </div>
            )}

            {/* Category progress bars */}
            <div className="space-y-2">
                {categories.map((cat, index) => (
                    <ProgressBar
                        key={cat.category}
                        {...cat}
                        index={index}
                        formatCurrency={formatCurrency}
                        isHovered={hoveredIndex === index}
                        onHover={setHoveredIndex}
                    />
                ))}
            </div>
        </Motion.div>
    )
}
