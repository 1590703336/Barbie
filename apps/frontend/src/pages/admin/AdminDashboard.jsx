/**
 * AdminDashboard Page
 * 
 * Main overview page for admin dashboard with platform KPIs and charts.
 * Uses recharts for User Growth and Total Volume trend charts.
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion as Motion } from 'framer-motion'
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts'
import {
    getPlatformOverview,
    getUserGrowthTrend,
    getPlatformFinancials,
} from '../../services/adminService'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatCurrency } from '../../utils/formatCurrency'

// Query keys for admin data
export const adminKeys = {
    overview: ['admin', 'overview'],
    userGrowth: (params) => ['admin', 'user-growth', params],
    financials: (params) => ['admin', 'financials', params],
}

// Custom tooltip for charts
function ChartTooltip({ active, payload, label, valueFormatter }) {
    if (!active || !payload?.length) return null
    return (
        <div className="glass-card rounded-xl px-4 py-3 shadow-lg border border-white/10">
            <p className="text-sm font-semibold text-main mb-2">{label}</p>
            <div className="space-y-1">
                {payload.map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-2">
                            <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-sm text-secondary">{entry.name}</span>
                        </span>
                        <span className="text-sm font-medium text-main">
                            {valueFormatter ? valueFormatter(entry.value) : entry.value.toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

function AdminDashboard() {
    // Fetch platform overview
    const { data: overview, isLoading: overviewLoading } = useQuery({
        queryKey: adminKeys.overview,
        queryFn: getPlatformOverview,
        staleTime: 60000,
    })

    // Fetch user growth trend
    const { data: userGrowth, isLoading: growthLoading } = useQuery({
        queryKey: adminKeys.userGrowth({ granularity: 'monthly', count: 12 }),
        queryFn: () => getUserGrowthTrend({ granularity: 'monthly', count: 12 }),
        staleTime: 60000,
    })

    // Fetch platform financials
    const { data: financials, isLoading: financialsLoading } = useQuery({
        queryKey: adminKeys.financials({ months: 12 }),
        queryFn: () => getPlatformFinancials({ months: 12 }),
        staleTime: 60000,
    })

    // Transform user growth data for chart
    const userGrowthData = useMemo(() => {
        const dataArray = userGrowth?.data || []
        if (!Array.isArray(dataArray) || dataArray.length === 0) return []
        return dataArray.map(item => ({
            period: item.period,
            newUsers: item.newUsers || 0,
            totalUsers: item.totalUsers || 0,
        }))
    }, [userGrowth])

    // Transform financials data for volume chart
    const volumeChartData = useMemo(() => {
        const dataArray = financials?.data || []
        if (!Array.isArray(dataArray) || dataArray.length === 0) return []
        return dataArray.map(item => ({
            period: item.period,
            income: item.income || 0,
            expense: item.expense || 0,
        }))
    }, [financials])

    const overviewData = overview

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-main">Platform Overview</h1>
                <p className="text-secondary mt-1">
                    Real-time analytics and insights across all users
                </p>
            </div>

            {/* KPI Cards */}
            {overviewLoading ? (
                <div className="flex justify-center py-12">
                    <LoadingSpinner />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Users */}
                    <Motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0 }}
                        className="glass-card rounded-2xl p-5"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-secondary">Total Users</p>
                                <p className="text-3xl font-bold text-main mt-1">
                                    {overviewData?.users?.total?.toLocaleString() ?? '-'}
                                </p>
                                <div className="flex items-center gap-2 mt-2 text-xs">
                                    <span className="text-purple-400">{overviewData?.users?.admins ?? 0} admins</span>
                                    <span className="text-muted">•</span>
                                    <span className="text-secondary">{overviewData?.users?.regular ?? 0} users</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                        </div>
                    </Motion.div>

                    {/* New Users This Month */}
                    <Motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card rounded-2xl p-5"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-secondary">New This Month</p>
                                <p className="text-3xl font-bold text-main mt-1">
                                    {overviewData?.users?.newThisMonth ?? '-'}
                                </p>
                                {overviewData?.users?.growthRate && (
                                    <p className={`text-xs mt-2 ${parseFloat(overviewData.users.growthRate) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {parseFloat(overviewData.users.growthRate) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(overviewData.users.growthRate))}% vs last month
                                    </p>
                                )}
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                            </div>
                        </div>
                    </Motion.div>

                    {/* Total Transaction Volume */}
                    <Motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card rounded-2xl p-5"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-secondary">Total Volume (USD)</p>
                                <p className="text-3xl font-bold text-main mt-1">
                                    {formatCurrency((overviewData?.volume?.totalIncomeUSD || 0) + (overviewData?.volume?.totalExpenseUSD || 0), 'USD')}
                                </p>
                                <p className="text-xs text-secondary mt-2">
                                    {overviewData?.transactions?.total?.toLocaleString() ?? 0} transactions
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </Motion.div>

                    {/* Net Cash Flow */}
                    <Motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-card rounded-2xl p-5"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-secondary">Net Cash Flow (USD)</p>
                                <p className={`text-3xl font-bold mt-1 ${(overviewData?.volume?.netCashFlowUSD || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {formatCurrency(overviewData?.volume?.netCashFlowUSD || 0, 'USD')}
                                </p>
                                <p className="text-xs text-secondary mt-2">
                                    {overviewData?.subscriptions?.active ?? 0} active subscriptions
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                        </div>
                    </Motion.div>
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth Trend */}
                <Motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-card rounded-2xl p-6"
                >
                    <h3 className="text-lg font-semibold text-main mb-4">User Growth Trend</h3>
                    {growthLoading ? (
                        <div className="h-64 flex items-center justify-center">
                            <LoadingSpinner />
                        </div>
                    ) : userGrowthData.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-secondary">
                            No user growth data available
                        </div>
                    ) : (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={userGrowthData}>
                                    <defs>
                                        <linearGradient id="newUsersGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="totalUsersGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                    <XAxis
                                        dataKey="period"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                                        width={40}
                                    />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Legend
                                        formatter={(value) => <span className="text-secondary text-sm">{value}</span>}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="totalUsers"
                                        name="Total Users"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        fill="url(#totalUsersGradient)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="newUsers"
                                        name="New Users"
                                        stroke="#a855f7"
                                        strokeWidth={2}
                                        fill="url(#newUsersGradient)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Motion.div>

                {/* Total Volume Trend */}
                <Motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass-card rounded-2xl p-6"
                >
                    <h3 className="text-lg font-semibold text-main mb-4">Total Volume Trend (USD)</h3>
                    {financialsLoading ? (
                        <div className="h-64 flex items-center justify-center">
                            <LoadingSpinner />
                        </div>
                    ) : volumeChartData.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-secondary">
                            No volume data available
                        </div>
                    ) : (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={volumeChartData}>
                                    <defs>
                                        <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                    <XAxis
                                        dataKey="period"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                                        tickFormatter={(value) => value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`}
                                        width={50}
                                    />
                                    <Tooltip
                                        content={<ChartTooltip valueFormatter={(v) => formatCurrency(v, 'USD')} />}
                                    />
                                    <Legend
                                        formatter={(value) => <span className="text-secondary text-sm">{value}</span>}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="income"
                                        name="Income"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        fill="url(#incomeGradient)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="expense"
                                        name="Expense"
                                        stroke="#f43f5e"
                                        strokeWidth={2}
                                        fill="url(#expenseGradient)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Motion.div>
            </div>
        </div>
    )
}

export default AdminDashboard
