/**
 * CurrencyRateTrendChart - Currency Exchange Rate Trend Line Chart
 * 
 * Displays historical exchange rate for a currency pair with:
 * - Smooth line with gradient fill
 * - Animated line drawing on mount
 * - Interactive tooltips on hover
 * - Glassmorphism styled container
 * - Summary stats: current rate, high, low, change %
 */

import { useMemo, useState } from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    ComposedChart
} from 'recharts'
import { motion as Motion } from 'framer-motion'

// Currency chart color
const RATE_COLOR = '#8b5cf6' // violet-500

// Custom tooltip with glassmorphism styling
function CustomTooltip({ active, payload, label, fromCurrency, toCurrency }) {
    if (!active || !payload || !payload.length) return null

    const rate = payload[0]?.value

    return (
        <div className="chart-tooltip glass-card rounded-xl px-4 py-3 shadow-lg">
            <p className="text-sm font-semibold text-main mb-2">{label}</p>
            <div className="space-y-1">
                <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: RATE_COLOR }}
                        />
                        <span className="text-sm text-secondary">
                            1 {fromCurrency}
                        </span>
                    </span>
                    <span className="text-sm font-medium text-main">
                        {rate?.toFixed(4)} {toCurrency}
                    </span>
                </div>
            </div>
        </div>
    )
}

// Custom active dot with scale animation
function CustomActiveDot({ cx, cy, fill }) {
    return (
        <Motion.circle
            cx={cx}
            cy={cy}
            r={6}
            fill={fill}
            stroke="white"
            strokeWidth={2}
            initial={{ r: 4 }}
            animate={{ r: 6 }}
            transition={{ type: 'spring', stiffness: 300 }}
            style={{ filter: 'drop-shadow(0 0 6px ' + fill + ')' }}
        />
    )
}

export default function CurrencyRateTrendChart({
    data,
    fromCurrency,
    toCurrency,
    title = 'Exchange Rate Trend',
    height = 300,
    showGrid = true,
    animate = true,
    granularity = 'monthly'
}) {
    const [activeIndex, setActiveIndex] = useState(null)

    // Transform data for chart
    const chartData = useMemo(() => {
        if (!data?.series) return []
        return data.series.map(item => ({
            ...item,
            name: formatDate(item.date, granularity)
        }))
    }, [data, granularity])

    // Calculate stats
    const stats = useMemo(() => {
        if (!chartData.length) return null
        const rates = chartData.map(d => d.rate)
        const current = rates[rates.length - 1]
        const first = rates[0]
        const high = Math.max(...rates)
        const low = Math.min(...rates)
        const change = ((current - first) / first) * 100
        return { current, high, low, change }
    }, [chartData])

    if (!chartData.length) {
        return (
            <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-main mb-4">{title}</h3>
                <div className="h-[300px] flex items-center justify-center text-secondary">
                    No rate data available
                </div>
            </div>
        )
    }

    return (
        <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card rounded-2xl p-6"
        >
            <h3 className="text-lg font-semibold text-main mb-4">{title}</h3>

            <ResponsiveContainer width="100%" height={height}>
                <ComposedChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    onMouseMove={(e) => {
                        if (e.activeTooltipIndex !== undefined) {
                            setActiveIndex(e.activeTooltipIndex)
                        }
                    }}
                    onMouseLeave={() => setActiveIndex(null)}
                >
                    {/* Gradient definitions */}
                    <defs>
                        <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={RATE_COLOR} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={RATE_COLOR} stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    {showGrid && (
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.1)"
                            vertical={false}
                        />
                    )}

                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                        dy={10}
                        interval="preserveStartEnd"
                    />

                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                        tickFormatter={(value) => value.toFixed(2)}
                        width={60}
                        domain={['auto', 'auto']}
                    />

                    <Tooltip
                        content={<CustomTooltip fromCurrency={fromCurrency} toCurrency={toCurrency} />}
                        cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                    />

                    {/* Area fill */}
                    <Area
                        type="monotone"
                        dataKey="rate"
                        stroke="none"
                        fill="url(#rateGradient)"
                        animationDuration={animate ? 1500 : 0}
                    />

                    {/* Line */}
                    <Line
                        type="monotone"
                        dataKey="rate"
                        name="Rate"
                        stroke={RATE_COLOR}
                        strokeWidth={3}
                        dot={{ r: 3, fill: RATE_COLOR, strokeWidth: 0 }}
                        activeDot={<CustomActiveDot fill={RATE_COLOR} />}
                        animationDuration={animate ? 1500 : 0}
                        animationEasing="ease-out"
                    />
                </ComposedChart>
            </ResponsiveContainer>

            {/* Summary stats */}
            {stats && (
                <div className="flex flex-wrap justify-center gap-6 mt-4 pt-4 border-t border-white/10">
                    <div className="text-center">
                        <p className="text-xs text-muted uppercase tracking-wide">Current</p>
                        <p className="text-lg font-semibold" style={{ color: RATE_COLOR }}>
                            {stats.current.toFixed(4)}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-muted uppercase tracking-wide">High</p>
                        <p className="text-lg font-semibold text-emerald-400">
                            {stats.high.toFixed(4)}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-muted uppercase tracking-wide">Low</p>
                        <p className="text-lg font-semibold text-rose-400">
                            {stats.low.toFixed(4)}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-muted uppercase tracking-wide">Change</p>
                        <p
                            className="text-lg font-semibold"
                            style={{ color: stats.change >= 0 ? '#10b981' : '#f43f5e' }}
                        >
                            {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(2)}%
                        </p>
                    </div>
                </div>
            )}
        </Motion.div>
    )
}

// Helper to format date for display based on granularity
function formatDate(dateStr, granularity) {
    const date = new Date(dateStr)
    if (granularity === 'yearly') {
        // For yearly view, show "Jan 24" format
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    } else if (granularity === 'monthly') {
        // For monthly view, show "Jan 15" format
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else {
        // For weekly view, show "Jan 15" format
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
}

