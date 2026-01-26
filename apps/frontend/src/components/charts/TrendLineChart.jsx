/**
 * TrendLineChart - 收支趋势折线图
 * 
 * Displays income vs expense trend over time with:
 * - Dual smooth lines with gradient fills
 * - Animated line drawing on mount
 * - Interactive tooltips on hover
 * - Glassmorphism styled container
 */

import { useMemo, useState } from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    ComposedChart
} from 'recharts'
import { motion as Motion } from 'framer-motion'
import { CHART_COLORS } from '../../data/mockChartData'
import { formatCurrency } from '../../utils/formatCurrency'

// Custom tooltip with glassmorphism styling
function CustomTooltip({ active, payload, label, currency = 'USD' }) {
    if (!active || !payload || !payload.length) return null

    const income = payload.find(p => p.dataKey === 'income')
    const expense = payload.find(p => p.dataKey === 'expense')
    const savings = income && expense ? income.value - expense.value : 0

    return (
        <div className="chart-tooltip glass-card rounded-xl px-4 py-3 shadow-lg">
            <p className="text-sm font-semibold text-main mb-2">{label}</p>
            <div className="space-y-1">
                {income && (
                    <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-2">
                            <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: CHART_COLORS.income }}
                            />
                            <span className="text-sm text-secondary">Income</span>
                        </span>
                        <span className="text-sm font-medium text-main">
                            {formatCurrency(income.value, currency)}
                        </span>
                    </div>
                )}
                {expense && (
                    <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-2">
                            <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: CHART_COLORS.expense }}
                            />
                            <span className="text-sm text-secondary">Expense</span>
                        </span>
                        <span className="text-sm font-medium text-main">
                            {formatCurrency(expense.value, currency)}
                        </span>
                    </div>
                )}
                <div className="border-t border-white/10 pt-1 mt-1">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-secondary">Savings</span>
                        <span
                            className="text-sm font-medium"
                            style={{ color: savings >= 0 ? CHART_COLORS.income : CHART_COLORS.expense }}
                        >
                            {savings >= 0 ? '+' : ''}{formatCurrency(Math.abs(savings), currency)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Custom legend
function CustomLegend({ payload }) {
    return (
        <div className="flex justify-center gap-6 mt-4">
            {payload?.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                    <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-secondary capitalize">{entry.value}</span>
                </div>
            ))}
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

export default function TrendLineChart({
    data,
    title = 'Income & Expense Trend',
    height = 300,
    showGrid = true,
    animate = true,
    currency = 'USD'
}) {
    const [activeIndex, setActiveIndex] = useState(null)

    // Transform data for chart
    const chartData = useMemo(() => {
        if (!data?.series) return []
        return data.series.map(item => ({
            ...item,
            name: item.monthName || item.date
        }))
    }, [data])

    if (!chartData.length) {
        return (
            <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-main mb-4">{title}</h3>
                <div className="h-[300px] flex items-center justify-center text-secondary">
                    No trend data available
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
                        <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CHART_COLORS.income} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={CHART_COLORS.income} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CHART_COLORS.expense} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={CHART_COLORS.expense} stopOpacity={0} />
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
                    />

                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                        tickFormatter={(value) => {
                            if (value >= 1000) {
                                // Use currency symbol prefix
                                const formatted = formatCurrency(value / 1000, currency)
                                // Extract just the symbol for compact display
                                const symbol = formatted.replace(/[\d,\.\s]/g, '')
                                return `${symbol}${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`
                            }
                            return formatCurrency(value, currency)
                        }}
                        width={50}
                    />

                    <Tooltip
                        content={<CustomTooltip currency={currency} />}
                        cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                    />

                    <Legend content={<CustomLegend />} />

                    {/* Area fills */}
                    <Area
                        type="monotone"
                        dataKey="income"
                        stroke="none"
                        fill="url(#incomeGradient)"
                        animationDuration={animate ? 1500 : 0}
                        legendType="none"
                    />
                    <Area
                        type="monotone"
                        dataKey="expense"
                        stroke="none"
                        fill="url(#expenseGradient)"
                        animationDuration={animate ? 1500 : 0}
                        legendType="none"
                    />

                    {/* Lines */}
                    <Line
                        type="monotone"
                        dataKey="income"
                        name="Income"
                        stroke={CHART_COLORS.income}
                        strokeWidth={3}
                        dot={{ r: 4, fill: CHART_COLORS.income, strokeWidth: 0 }}
                        activeDot={<CustomActiveDot fill={CHART_COLORS.income} />}
                        animationDuration={animate ? 1500 : 0}
                        animationEasing="ease-out"
                    />

                    <Line
                        type="monotone"
                        dataKey="expense"
                        name="Expense"
                        stroke={CHART_COLORS.expense}
                        strokeWidth={3}
                        dot={{ r: 4, fill: CHART_COLORS.expense, strokeWidth: 0 }}
                        activeDot={<CustomActiveDot fill={CHART_COLORS.expense} />}
                        animationDuration={animate ? 1500 : 0}
                        animationEasing="ease-out"
                    />
                </ComposedChart>
            </ResponsiveContainer>

            {/* Summary stats */}
            {data?.totals && (
                <div className="flex justify-center gap-8 mt-4 pt-4 border-t border-white/10">
                    <div className="text-center">
                        <p className="text-xs text-muted uppercase tracking-wide">Total Income</p>
                        <p className="text-lg font-semibold" style={{ color: CHART_COLORS.income }}>
                            {formatCurrency(data.totals.income, currency)}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-muted uppercase tracking-wide">Total Expense</p>
                        <p className="text-lg font-semibold" style={{ color: CHART_COLORS.expense }}>
                            {formatCurrency(data.totals.expense, currency)}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-muted uppercase tracking-wide">Net Savings</p>
                        <p
                            className="text-lg font-semibold"
                            style={{ color: data.totals.savings >= 0 ? CHART_COLORS.income : CHART_COLORS.expense }}
                        >
                            {data.totals.savings >= 0 ? '+' : '-'}{formatCurrency(Math.abs(data.totals.savings), currency)}
                        </p>
                    </div>
                </div>
            )}
        </Motion.div>
    )
}
