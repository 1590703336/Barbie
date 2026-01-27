/**
 * AdminFinancials Page
 * 
 * Platform-wide financial analytics with charts.
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion as Motion } from 'framer-motion'
import {
    getPlatformFinancials,
    getCategoryDistribution,
    getBudgetCompliance,
} from '../../services/adminService'
import { TrendLineChart, CategoryPieChart, MonthlyComparisonChart } from '../../components/charts'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatCurrency } from '../../utils/formatCurrency'

function AdminFinancials() {
    const currentDate = new Date()
    const [month, setMonth] = useState(currentDate.getMonth() + 1)
    const [year, setYear] = useState(currentDate.getFullYear())

    // Fetch platform financials
    const { data: financials, isLoading: financialsLoading } = useQuery({
        queryKey: ['admin', 'financials', { months: 12 }],
        queryFn: () => getPlatformFinancials({ months: 12 }),
    })

    // Fetch category distribution
    const { data: expenseCategories } = useQuery({
        queryKey: ['admin', 'categories', 'expense', month, year],
        queryFn: () => getCategoryDistribution({ type: 'expense', month, year }),
    })

    const { data: incomeCategories } = useQuery({
        queryKey: ['admin', 'categories', 'income', month, year],
        queryFn: () => getCategoryDistribution({ type: 'income', month, year }),
    })

    // Fetch budget compliance
    const { data: compliance } = useQuery({
        queryKey: ['admin', 'budget-compliance', month, year],
        queryFn: () => getBudgetCompliance({ month, year }),
    })

    // Service returns unwrapped data: { data: [...], etc }
    const trendData = (financials?.data || []).map(item => ({
        period: item.period,
        income: item.income || 0,
        expense: item.expense || 0,
        savings: item.savings || 0,
    }))

    const expenseCategoryData = (expenseCategories?.data || []).map(item => ({
        category: item.category,
        amount: item.total,
        percentage: parseFloat(item.percentage),
    }))

    const complianceData = compliance

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-main">Financial Analytics</h1>
                    <p className="text-secondary mt-1">Platform-wide income, expenses, and budget tracking</p>
                </div>

                {/* Period Selector */}
                <div className="flex gap-2">
                    <select
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                        className="rounded-lg px-3 py-2 text-sm bg-slate-800/50 border border-slate-700"
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>
                                {new Date(0, m - 1).toLocaleString('en-US', { month: 'long' })}
                            </option>
                        ))}
                    </select>
                    <select
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        className="rounded-lg px-3 py-2 text-sm bg-slate-800/50 border border-slate-700"
                    >
                        {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Financial Trend Chart */}
            <Motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl p-6"
            >
                <h3 className="text-lg font-semibold text-main mb-4">Platform Financial Trends (12 Months)</h3>
                {financialsLoading ? (
                    <div className="h-80 flex items-center justify-center">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <div className="h-80">
                        <TrendLineChart data={trendData} currency="USD" />
                    </div>
                )}
            </Motion.div>

            {/* Categories and Budget Compliance Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expense Categories */}
                <Motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card rounded-2xl p-6"
                >
                    <h3 className="text-lg font-semibold text-main mb-4">
                        Expense Categories - {new Date(0, month - 1).toLocaleString('en-US', { month: 'long' })} {year}
                    </h3>
                    <div className="h-64">
                        <CategoryPieChart data={expenseCategoryData} currency="USD" />
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-sm text-secondary">
                            Total: <span className="text-main font-semibold">
                                {formatCurrency(expenseCategories?.grandTotal || 0, 'USD')}
                            </span>
                        </p>
                    </div>
                </Motion.div>

                {/* Budget Compliance */}
                <Motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card rounded-2xl p-6"
                >
                    <h3 className="text-lg font-semibold text-main mb-4">Budget Compliance</h3>
                    <div className="space-y-6">
                        {/* Compliance Rate */}
                        <div className="text-center">
                            <p className="text-5xl font-bold text-main">
                                {complianceData?.complianceRate ?? '-'}%
                            </p>
                            <p className="text-secondary mt-2">of budgets are within limit</p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-3 rounded-lg bg-slate-800/50">
                                <p className="text-2xl font-semibold text-main">{complianceData?.totalBudgets ?? 0}</p>
                                <p className="text-xs text-secondary">Total Budgets</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-emerald-500/10">
                                <p className="text-2xl font-semibold text-emerald-400">{complianceData?.withinBudget ?? 0}</p>
                                <p className="text-xs text-secondary">Within Budget</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-rose-500/10">
                                <p className="text-2xl font-semibold text-rose-400">{complianceData?.overBudget ?? 0}</p>
                                <p className="text-xs text-secondary">Over Budget</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        {complianceData?.totalBudgets > 0 && (
                            <div>
                                <div className="h-3 rounded-full bg-slate-700 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                                        style={{ width: `${complianceData.complianceRate}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </Motion.div>
            </div>
        </div>
    )
}

export default AdminFinancials
