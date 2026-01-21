/**
 * MonthlyComparisonChart - 月度对比柱状图
 * 
 * Grouped bar chart comparing income, expense, and savings:
 * - Side-by-side bars for each month
 * - Hover effects with scale animation
 * - Custom styled tooltips
 * - Glassmorphism container
 */

import { useMemo, useState } from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts'
import { motion as Motion } from 'framer-motion'
import { CHART_COLORS } from '../../data/mockChartData'

// Custom tooltip
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null

    const income = payload.find(p => p.dataKey === 'income')
    const expense = payload.find(p => p.dataKey === 'expense')
    const savings = payload.find(p => p.dataKey === 'savings')

    return (
        <div className="chart-tooltip glass-card rounded-xl px-4 py-3 shadow-lg">
            <p className="text-sm font-semibold text-main mb-2">{label}</p>
            <div className="space-y-1.5">
                {income && (
                    <div className="flex items-center justify-between gap-6">
                        <span className="flex items-center gap-2">
                            <span
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: CHART_COLORS.income }}
                            />
                            <span className="text-sm text-secondary">Income</span>
                        </span>
                        <span className="text-sm font-medium text-main">
                            ${income.value.toLocaleString()}
                        </span>
                    </div>
                )}
                {expense && (
                    <div className="flex items-center justify-between gap-6">
                        <span className="flex items-center gap-2">
                            <span
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: CHART_COLORS.expense }}
                            />
                            <span className="text-sm text-secondary">Expense</span>
                        </span>
                        <span className="text-sm font-medium text-main">
                            ${expense.value.toLocaleString()}
                        </span>
                    </div>
                )}
                {savings && (
                    <div className="flex items-center justify-between gap-6 pt-1.5 border-t border-white/10">
                        <span className="flex items-center gap-2">
                            <span
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: CHART_COLORS.savings }}
                            />
                            <span className="text-sm text-secondary">Savings</span>
                        </span>
                        <span
                            className="text-sm font-medium"
                            style={{ color: savings.value >= 0 ? CHART_COLORS.savings : CHART_COLORS.expense }}
                        >
                            {savings.value >= 0 ? '' : '-'}${Math.abs(savings.value).toLocaleString()}
                        </span>
                    </div>
                )}
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
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-secondary capitalize">{entry.value}</span>
                </div>
            ))}
        </div>
    )
}

// Custom bar shape with rounded top corners
function RoundedBar(props) {
    const { fill, x, y, width, height } = props
    const radius = 4

    if (height <= 0) return null

    return (
        <path
            d={`
        M${x},${y + height}
        L${x},${y + radius}
        Q${x},${y} ${x + radius},${y}
        L${x + width - radius},${y}
        Q${x + width},${y} ${x + width},${y + radius}
        L${x + width},${y + height}
        Z
      `}
            fill={fill}
            style={{ transition: 'all 0.3s ease' }}
        />
    )
}

export default function MonthlyComparisonChart({
    data,
    title = 'Monthly Comparison',
    height = 320,
    showSavings = true,
    animate = true
}) {
    const [activeIndex, setActiveIndex] = useState(null)

    // Transform data for chart
    const chartData = useMemo(() => {
        if (!data?.months) return []
        return data.months.map(item => ({
            ...item,
            name: item.monthName || item.month
        }))
    }, [data])

    // Calculate bar width based on data
    const barSize = useMemo(() => {
        const count = chartData.length
        if (count <= 3) return 24
        if (count <= 6) return 18
        return 14
    }, [chartData])

    if (!chartData.length) {
        return (
            <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-main mb-4">{title}</h3>
                <div className="h-[320px] flex items-center justify-center text-secondary">
                    No comparison data available
                </div>
            </div>
        )
    }

    return (
        <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass-card rounded-2xl p-6"
        >
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-main">{title}</h3>
                    <p className="text-sm text-secondary">
                        Compare your finances across months
                    </p>
                </div>
                {data?.averages && (
                    <div className="text-right">
                        <p className="text-xs text-muted uppercase tracking-wide">Avg Savings Rate</p>
                        <p
                            className="text-xl font-bold"
                            style={{
                                color: data.averages.savingsRate >= 0
                                    ? CHART_COLORS.savings
                                    : CHART_COLORS.expense
                            }}
                        >
                            {data.averages.savingsRate.toFixed(0)}%
                        </p>
                    </div>
                )}
            </div>

            <ResponsiveContainer width="100%" height={height}>
                <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
                    barGap={2}
                    barCategoryGap="15%"
                    onMouseMove={(e) => {
                        if (e.activeTooltipIndex !== undefined) {
                            setActiveIndex(e.activeTooltipIndex)
                        }
                    }}
                    onMouseLeave={() => setActiveIndex(null)}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.1)"
                        vertical={false}
                    />

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
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        width={50}
                    />

                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />

                    <Legend content={<CustomLegend />} />

                    <Bar
                        dataKey="income"
                        name="Income"
                        fill={CHART_COLORS.income}
                        barSize={barSize}
                        shape={<RoundedBar />}
                        animationDuration={animate ? 1000 : 0}
                        animationEasing="ease-out"
                    >
                        {chartData.map((_, index) => (
                            <Cell
                                key={index}
                                style={{
                                    filter: activeIndex === index ? `drop-shadow(0 0 8px ${CHART_COLORS.income})` : 'none',
                                    transform: activeIndex === index ? 'scaleY(1.02)' : 'scaleY(1)',
                                    transformOrigin: 'bottom',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        ))}
                    </Bar>

                    <Bar
                        dataKey="expense"
                        name="Expense"
                        fill={CHART_COLORS.expense}
                        barSize={barSize}
                        shape={<RoundedBar />}
                        animationDuration={animate ? 1000 : 0}
                        animationBegin={200}
                        animationEasing="ease-out"
                    >
                        {chartData.map((_, index) => (
                            <Cell
                                key={index}
                                style={{
                                    filter: activeIndex === index ? `drop-shadow(0 0 8px ${CHART_COLORS.expense})` : 'none',
                                    transform: activeIndex === index ? 'scaleY(1.02)' : 'scaleY(1)',
                                    transformOrigin: 'bottom',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        ))}
                    </Bar>

                    {showSavings && (
                        <Bar
                            dataKey="savings"
                            name="Savings"
                            fill={CHART_COLORS.savings}
                            barSize={barSize}
                            shape={<RoundedBar />}
                            animationDuration={animate ? 1000 : 0}
                            animationBegin={400}
                            animationEasing="ease-out"
                        >
                            {chartData.map((_, index) => (
                                <Cell
                                    key={index}
                                    style={{
                                        filter: activeIndex === index ? `drop-shadow(0 0 8px ${CHART_COLORS.savings})` : 'none',
                                        transform: activeIndex === index ? 'scaleY(1.02)' : 'scaleY(1)',
                                        transformOrigin: 'bottom',
                                        transition: 'all 0.3s ease'
                                    }}
                                />
                            ))}
                        </Bar>
                    )}
                </BarChart>
            </ResponsiveContainer>

            {/* Averages summary */}
            {data?.averages && (
                <div className="flex justify-center gap-8 mt-4 pt-4 border-t border-white/10">
                    <div className="text-center">
                        <p className="text-xs text-muted uppercase tracking-wide">Avg Income</p>
                        <p className="text-base font-semibold" style={{ color: CHART_COLORS.income }}>
                            ${data.averages.income.toLocaleString()}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-muted uppercase tracking-wide">Avg Expense</p>
                        <p className="text-base font-semibold" style={{ color: CHART_COLORS.expense }}>
                            ${data.averages.expense.toLocaleString()}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-muted uppercase tracking-wide">Avg Savings</p>
                        <p
                            className="text-base font-semibold"
                            style={{ color: data.averages.savings >= 0 ? CHART_COLORS.savings : CHART_COLORS.expense }}
                        >
                            ${data.averages.savings.toLocaleString()}
                        </p>
                    </div>
                </div>
            )}
        </Motion.div>
    )
}
