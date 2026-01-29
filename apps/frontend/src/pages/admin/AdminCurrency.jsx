/**
 * AdminCurrency Page
 * 
 * Currency analytics showing popular currency pairs and conversion trends.
 */

import { useQuery } from '@tanstack/react-query'
import { motion as Motion } from 'framer-motion'
import { getCurrencyStats } from '../../services/adminService'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { CHART_COLORS } from '../../data/mockChartData'

function AdminCurrency() {
    const { data: currencyData, isLoading, error } = useQuery({
        queryKey: ['admin', 'currency', 'stats'],
        queryFn: getCurrencyStats,
    })

    // Calculate total conversions for progress bars
    const totalConversions = currencyData?.popularPairs?.reduce((sum, pair) => sum + pair.count, 0) || 1

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-main">Currency Analytics</h1>
                <p className="text-secondary mt-1">Platform-wide currency usage and conversion trends</p>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex justify-center py-12">
                    <LoadingSpinner />
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="glass-card rounded-2xl p-6 text-center">
                    <p className="text-rose-400">Failed to load currency data</p>
                    <p className="text-sm text-muted mt-2">{error.message}</p>
                </div>
            )}

            {/* Data loaded successfully */}
            {!isLoading && !error && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Total Unique Currencies */}
                        <Motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-secondary">Unique Currencies</p>
                                    <p className="text-3xl font-bold text-main mt-1">
                                        {currencyData?.uniqueCurrencies ?? '-'}
                                    </p>
                                    <p className="text-xs text-muted mt-2">In use across platform</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </Motion.div>

                        {/* Total Convert Pairs */}
                        <Motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-card rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-secondary">Custom Pairs</p>
                                    <p className="text-3xl font-bold text-main mt-1">
                                        {currencyData?.totalPairs ?? '-'}
                                    </p>
                                    <p className="text-xs text-muted mt-2">User-created conversion pairs</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                </div>
                            </div>
                        </Motion.div>

                        {/* Most Popular Currency */}
                        <Motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass-card rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-secondary">Top Currency</p>
                                    <p className="text-3xl font-bold text-main mt-1">
                                        {currencyData?.mostPopular ?? 'USD'}
                                    </p>
                                    <p className="text-xs text-muted mt-2">Most used as default</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                </div>
                            </div>
                        </Motion.div>
                    </div>

                    {/* Popular Currency Pairs */}
                    <Motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-card rounded-2xl p-6"
                    >
                        <h3 className="text-lg font-semibold text-main mb-4">Popular Conversion Pairs</h3>
                        {(!currencyData?.popularPairs || currencyData.popularPairs.length === 0) ? (
                            <p className="text-center text-muted py-8">No conversion pairs data available</p>
                        ) : (
                            <div className="space-y-4">
                                {currencyData.popularPairs.map((pair, index) => {
                                    const percentage = (pair.count / totalConversions) * 100

                                    return (
                                        <div key={`${pair.from}-${pair.to}`} className="flex items-center gap-4">
                                            {/* Pair Name */}
                                            <div className="w-28 flex items-center gap-2">
                                                <span className="font-mono text-sm font-medium text-main">{pair.from}</span>
                                                <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                </svg>
                                                <span className="font-mono text-sm font-medium text-main">{pair.to}</span>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="flex-1">
                                                <div className="h-6 rounded-full bg-slate-700 overflow-hidden">
                                                    <Motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${percentage}%` }}
                                                        transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: CHART_COLORS.categories[index % CHART_COLORS.categories.length] }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Count and Percentage */}
                                            <div className="w-24 text-right">
                                                <span className="text-sm font-medium text-main">{pair.count}</span>
                                                <span className="text-xs text-muted ml-1">({percentage.toFixed(1)}%)</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </Motion.div>

                    {/* Default Currency Distribution */}
                    <Motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass-card rounded-2xl p-6"
                    >
                        <h3 className="text-lg font-semibold text-main mb-4">User Default Currencies</h3>
                        {(!currencyData?.defaultCurrencies || currencyData.defaultCurrencies.length === 0) ? (
                            <p className="text-center text-muted py-8">No default currency data available</p>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {currencyData.defaultCurrencies.map((item, index) => (
                                    <Motion.div
                                        key={item.currency}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.5 + index * 0.05 }}
                                        className="p-4 rounded-xl bg-slate-800/50 text-center"
                                    >
                                        <p className="text-lg font-bold text-main">{item.currency}</p>
                                        <p className="text-sm text-purple-400">{item.count} users</p>
                                        <p className="text-xs text-muted">{item.percentage ?? 0}%</p>
                                    </Motion.div>
                                ))}
                            </div>
                        )}
                    </Motion.div>
                </>
            )}
        </div>
    )
}

export default AdminCurrency
