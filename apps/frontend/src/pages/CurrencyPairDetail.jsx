/**
 * CurrencyPairDetail - Detailed view for a currency conversion pair
 * 
 * Shows historical exchange rate trend with interactive chart
 * and granularity selector (weekly/monthly/yearly)
 */

import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion as Motion } from 'framer-motion'
import { useConvertPairs, useHistoricalRates, useExchangeRates } from '../hooks/queries/useCurrencyQueries'
import CurrencyRateTrendChart from '../components/charts/CurrencyRateTrendChart'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ChartSkeleton from '../components/common/ChartSkeleton'

// Granularity options (same as Dashboard)
const GRANULARITY_OPTIONS = [
    { value: 'weekly', label: 'Weekly (12 weeks)' },
    { value: 'monthly', label: 'Monthly (12 months)' },
    { value: 'yearly', label: 'Yearly (5 years)' }
]

export default function CurrencyPairDetail() {
    const { pairId } = useParams()
    const navigate = useNavigate()
    const [granularity, setGranularity] = useState('monthly')
    const [amount, setAmount] = useState(100)

    // Fetch all pairs to find the current one
    const { data: pairsResponse, isLoading: pairsLoading } = useConvertPairs()
    const { data: ratesResponse, isLoading: ratesLoading } = useExchangeRates()

    // Find the current pair
    const pairs = pairsResponse?.data || []
    const pair = useMemo(() => pairs.find(p => p._id === pairId), [pairs, pairId])

    // Fetch historical rates
    const {
        data: historicalData,
        isLoading: historyLoading,
        error: historyError
    } = useHistoricalRates({
        fromCurrency: pair?.fromCurrency,
        toCurrency: pair?.toCurrency,
        granularity
    })

    // Get current rate for converter
    const rates = ratesResponse?.data || {}
    const currentRate = useMemo(() => {
        if (!pair || !rates[pair.fromCurrency] || !rates[pair.toCurrency]) return null
        // Convert: 1 fromCurrency in USD, then to toCurrency
        return rates[pair.toCurrency] / rates[pair.fromCurrency]
    }, [pair, rates])

    // Calculate converted amount
    const convertedAmount = useMemo(() => {
        if (!currentRate || isNaN(amount)) return null
        return (amount * currentRate).toFixed(2)
    }, [amount, currentRate])

    if (pairsLoading || ratesLoading) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-10">
                <LoadingSpinner />
            </div>
        )
    }

    if (!pair) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-10 text-center">
                <h1 className="text-2xl font-bold text-main mb-4">Pair Not Found</h1>
                <p className="text-secondary mb-6">The currency pair you're looking for doesn't exist.</p>
                <Link
                    to="/rates"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition"
                >
                    Back to Currency Rates
                </Link>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
            {/* Header with back button */}
            <Motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between flex-wrap gap-4"
            >
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/rates')}
                        className="p-2 rounded-lg hover:bg-white/10 transition text-secondary hover:text-main"
                        title="Back to Currency Rates"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-main">
                            {pair.fromCurrency} → {pair.toCurrency}
                        </h1>
                        <p className="text-sm text-secondary">
                            Historical exchange rate trend
                        </p>
                    </div>
                </div>

                {/* Granularity selector */}
                <select
                    className="rounded-lg px-3 py-2 text-sm bg-white/5 border border-white/10"
                    value={granularity}
                    onChange={(e) => setGranularity(e.target.value)}
                >
                    {GRANULARITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </Motion.div>

            {/* Current rate card */}
            <Motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-2xl p-6"
            >
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-secondary mb-1">Current Rate</p>
                        <p className="text-3xl font-bold text-main">
                            1 {pair.fromCurrency} = {currentRate?.toFixed(4) || '—'} {pair.toCurrency}
                        </p>
                    </div>

                    {/* Quick converter */}
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-24 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-main focus:outline-none focus:border-indigo-500"
                            placeholder="Amount"
                        />
                        <span className="text-secondary">{pair.fromCurrency}</span>
                        <span className="text-muted">=</span>
                        <div className="px-3 py-2 glass-panel rounded-lg text-sm font-semibold text-emerald-400 min-w-[80px]">
                            {convertedAmount || '—'}
                        </div>
                        <span className="text-secondary">{pair.toCurrency}</span>
                    </div>
                </div>
            </Motion.div>

            {/* Trend chart */}
            {historyLoading ? (
                <ChartSkeleton height={350} />
            ) : historyError ? (
                <div className="glass-card rounded-2xl p-6">
                    <div className="h-[350px] flex items-center justify-center text-rose-400">
                        Failed to load historical rates. Please try again.
                    </div>
                </div>
            ) : (
                <CurrencyRateTrendChart
                    data={historicalData?.data}
                    fromCurrency={pair.fromCurrency}
                    toCurrency={pair.toCurrency}
                    title={`${pair.fromCurrency}/${pair.toCurrency} Rate History`}
                    height={350}
                    granularity={granularity}
                />
            )}

            {/* Info note */}
            <Motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xs text-muted text-center"
            >
                Data sourced from Frankfurter API (European Central Bank reference rates)
            </Motion.p>
        </div>
    )
}
