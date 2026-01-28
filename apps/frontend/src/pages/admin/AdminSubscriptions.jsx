/**
 * AdminSubscriptions Page
 * 
 * Subscription analytics for platform-wide subscription health.
 */

import { useQuery } from '@tanstack/react-query'
import { motion as Motion } from 'framer-motion'
import { getSubscriptionHealth } from '../../services/adminService'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatCurrency } from '../../utils/formatCurrency'
import { CHART_COLORS } from '../../data/mockChartData'

function AdminSubscriptions() {
    // Service returns unwrapped data directly: { byStatus, byCategory, ... }
    const { data: healthData, isLoading } = useQuery({
        queryKey: ['admin', 'subscriptions', 'health'],
        queryFn: getSubscriptionHealth,
    })

    // Calculate totals
    const statusData = healthData?.byStatus ?? {}
    const totalActive = statusData.active?.count ?? 0
    const totalCancelled = statusData.cancelled?.count ?? 0
    const totalExpired = statusData.expired?.count ?? 0
    const totalAll = totalActive + totalCancelled + totalExpired

    const categoryData = healthData?.byCategory ?? []

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-main">Subscription Analytics</h1>
                <p className="text-secondary mt-1">Platform-wide subscription health and metrics</p>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <LoadingSpinner />
                </div>
            ) : (
                <>
                    {/* Status Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Active */}
                        <Motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-secondary">Active</p>
                                    <p className="text-3xl font-bold text-emerald-400 mt-1">{totalActive}</p>
                                    <p className="text-xs text-secondary mt-2">
                                        {formatCurrency(statusData.active?.totalValueUSD || 0, 'USD')}/period
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </Motion.div>

                        {/* Cancelled */}
                        <Motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-card rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-secondary">Cancelled</p>
                                    <p className="text-3xl font-bold text-amber-400 mt-1">{totalCancelled}</p>
                                    <p className="text-xs text-secondary mt-2">
                                        {totalAll > 0 ? ((totalCancelled / totalAll) * 100).toFixed(1) : 0}% churn rate
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                </div>
                            </div>
                        </Motion.div>

                        {/* Expired */}
                        <Motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass-card rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-secondary">Expired</p>
                                    <p className="text-3xl font-bold text-rose-400 mt-1">{totalExpired}</p>
                                    <p className="text-xs text-secondary mt-2">
                                        {formatCurrency(statusData.expired?.totalValueUSD || 0, 'USD')} lost revenue
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </Motion.div>
                    </div>

                    {/* Status Distribution */}
                    <Motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-card rounded-2xl p-6"
                    >
                        <h3 className="text-lg font-semibold text-main mb-4">Status Distribution</h3>
                        <div className="h-6 rounded-full bg-slate-700 overflow-hidden flex">
                            {totalAll > 0 && (
                                <>
                                    <div
                                        className="h-full bg-emerald-500 transition-all"
                                        style={{ width: `${(totalActive / totalAll) * 100}%` }}
                                        title={`Active: ${totalActive}`}
                                    />
                                    <div
                                        className="h-full bg-amber-500 transition-all"
                                        style={{ width: `${(totalCancelled / totalAll) * 100}%` }}
                                        title={`Cancelled: ${totalCancelled}`}
                                    />
                                    <div
                                        className="h-full bg-rose-500 transition-all"
                                        style={{ width: `${(totalExpired / totalAll) * 100}%` }}
                                        title={`Expired: ${totalExpired}`}
                                    />
                                </>
                            )}
                        </div>
                        <div className="flex justify-center gap-6 mt-4 text-sm">
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="text-secondary">Active</span>
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-amber-500" />
                                <span className="text-secondary">Cancelled</span>
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-rose-500" />
                                <span className="text-secondary">Expired</span>
                            </span>
                        </div>
                    </Motion.div>

                    {/* Subscriptions by Category */}
                    <Motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass-card rounded-2xl p-6"
                    >
                        <h3 className="text-lg font-semibold text-main mb-4">Active Subscriptions by Category</h3>
                        {categoryData.length === 0 ? (
                            <p className="text-center text-muted py-8">No subscription data available</p>
                        ) : (
                            <div className="space-y-3">
                                {categoryData.map((item, index) => {
                                    const maxValue = Math.max(...categoryData.map(c => c.totalValueUSD || 0))
                                    const percentage = maxValue > 0 ? (item.totalValueUSD / maxValue) * 100 : 0

                                    return (
                                        <div key={item.category} className="flex items-center gap-4">
                                            <div className="w-28 text-sm text-secondary">{item.category}</div>
                                            <div className="flex-1">
                                                <div className="h-6 rounded-full bg-slate-700 overflow-hidden">
                                                    <Motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${percentage}%` }}
                                                        transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: CHART_COLORS.categories[index % CHART_COLORS.categories.length] }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="w-20 text-right">
                                                <span className="text-sm font-medium text-main">{item.count}</span>
                                                <span className="text-xs text-muted ml-1">subs</span>
                                            </div>
                                            <div className="w-24 text-right text-sm text-secondary">
                                                {formatCurrency(item.totalValueUSD || 0, 'USD')}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </Motion.div>
                </>
            )}
        </div>
    )
}

export default AdminSubscriptions
