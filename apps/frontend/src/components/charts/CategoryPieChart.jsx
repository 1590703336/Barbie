/**
 * CategoryPieChart - 支出分类环形图
 * 
 * Interactive donut chart showing expense/income breakdown by category:
 * - Animated segments with hover expansion
 * - Center displays total or hovered category detail
 * - Custom color palette matching theme
 * - Glassmorphism styled container
 */

import { useState, useCallback, useMemo } from 'react'
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Sector
} from 'recharts'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { CHART_COLORS } from '../../data/mockChartData'
import { formatCurrency } from '../../utils/formatCurrency'

// Render active (hovered) shape with expansion effect
const renderActiveShape = (props) => {
    const {
        cx, cy, innerRadius, outerRadius, startAngle, endAngle,
        fill, payload, percent, value
    } = props

    return (
        <g>
            {/* Outer expanded arc */}
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius - 4}
                outerRadius={outerRadius + 8}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                style={{
                    filter: `drop-shadow(0 0 12px ${fill})`,
                    transition: 'all 0.3s ease'
                }}
            />
            {/* Inner arc for donut effect */}
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 4}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                opacity={0.8}
            />
        </g>
    )
}

export default function CategoryPieChart({
    data,
    title = 'Expense Breakdown',
    height = 320,
    innerRadius = 60,
    outerRadius = 100,
    animate = true,
    currency = 'USD'
}) {
    const [activeIndex, setActiveIndex] = useState(null)

    // Transform data for chart
    const chartData = useMemo(() => {
        if (!data?.categories) return []
        return data.categories.map((item, index) => ({
            ...item,
            name: item.category,
            value: item.amount,
            color: CHART_COLORS.categories[index % CHART_COLORS.categories.length]
        }))
    }, [data])

    const onPieEnter = useCallback((_, index) => {
        setActiveIndex(index)
    }, [])

    const onPieLeave = useCallback(() => {
        setActiveIndex(null)
    }, [])

    // Get center content
    const centerContent = useMemo(() => {
        if (activeIndex !== null && chartData[activeIndex]) {
            const item = chartData[activeIndex]
            return {
                label: item.name,
                value: item.value,
                percentage: item.percentage,
                isActive: true
            }
        }
        return {
            label: 'Total',
            value: data?.total || 0,
            percentage: 100,
            isActive: false
        }
    }, [activeIndex, chartData, data])

    if (!chartData.length) {
        return (
            <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-main mb-4">{title}</h3>
                <div className="h-[320px] flex items-center justify-center text-secondary">
                    No category data available
                </div>
            </div>
        )
    }

    return (
        <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-card rounded-2xl p-6"
        >
            <h3 className="text-lg font-semibold text-main mb-2">{title}</h3>
            <p className="text-sm text-secondary mb-4">
                {data?.type === 'income' ? 'Income sources' : 'Spending by category'}
            </p>

            <div className="relative">
                <ResponsiveContainer width="100%" height={height}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={innerRadius}
                            outerRadius={outerRadius}
                            paddingAngle={2}
                            dataKey="value"
                            activeIndex={activeIndex}
                            activeShape={renderActiveShape}
                            onMouseEnter={onPieEnter}
                            onMouseLeave={onPieLeave}
                            animationDuration={animate ? 800 : 0}
                            animationEasing="ease-out"
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    style={{
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                {/* Center content */}
                <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{ top: '0', height: `${height}px` }}
                >
                    <AnimatePresence mode="wait">
                        <Motion.div
                            key={centerContent.label}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                            className="text-center"
                        >
                            <p className="text-sm text-muted mb-1">{centerContent.label}</p>
                            <p className="text-2xl font-bold text-main">
                                {formatCurrency(centerContent.value, currency)}
                            </p>
                            {centerContent.isActive && (
                                <p className="text-sm text-secondary mt-1">
                                    {centerContent.percentage.toFixed(1)}%
                                </p>
                            )}
                        </Motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 mt-4">
                {chartData.map((item, index) => (
                    <Motion.div
                        key={item.name}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer chart-item-hover ${activeIndex === index ? 'chart-item-active' : ''
                            }`}
                        onMouseEnter={() => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(null)}
                        whileHover={{ x: 4 }}
                    >
                        <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-secondary truncate flex-1">
                            {item.name}
                        </span>
                        <span className="text-sm font-medium text-main">
                            {item.percentage.toFixed(0)}%
                        </span>
                    </Motion.div>
                ))}
            </div>
        </Motion.div>
    )
}
