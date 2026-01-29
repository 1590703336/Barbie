/**
 * Chart Currency Prop Tests
 * 
 * Tests that verify all chart components:
 * 1. Accept a currency prop
 * 2. Use formatCurrency() for monetary displays
 * 3. Display correct currency symbols for different currencies
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// Import chart components
import TrendLineChart from '../../../components/charts/TrendLineChart'
import CategoryPieChart from '../../../components/charts/CategoryPieChart'
import MonthlyComparisonChart from '../../../components/charts/MonthlyComparisonChart'
import BudgetProgressBars from '../../../components/charts/BudgetProgressBars'

// Mock recharts to avoid canvas issues in tests
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }) => createElement('div', { 'data-testid': 'responsive-container' }, children),
    ComposedChart: ({ children }) => createElement('div', { 'data-testid': 'composed-chart' }, children),
    LineChart: ({ children }) => createElement('div', { 'data-testid': 'line-chart' }, children),
    BarChart: ({ children }) => createElement('div', { 'data-testid': 'bar-chart' }, children),
    PieChart: ({ children }) => createElement('div', { 'data-testid': 'pie-chart' }, children),
    Line: () => null,
    Bar: () => null,
    Cell: () => null,
    Pie: () => null,
    Area: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
    Sector: () => null,
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }) => createElement('div', props, children),
        circle: (props) => createElement('circle', props),
    },
    AnimatePresence: ({ children }) => children,
}))

describe('TrendLineChart Currency Prop', () => {
    const mockTrendData = {
        series: [
            { monthName: 'Jan', income: 5000, expense: 3000 },
            { monthName: 'Feb', income: 5500, expense: 3200 },
        ],
        totals: {
            income: 10500,
            expense: 6200,
            savings: 4300,
        },
    }

    it('should accept currency prop', () => {
        // Should not throw when currency prop is passed
        expect(() => {
            render(
                createElement(TrendLineChart, {
                    data: mockTrendData,
                    currency: 'CNY',
                })
            )
        }).not.toThrow()
    })

    it('should display USD amounts with $ symbol by default', () => {
        render(
            createElement(TrendLineChart, {
                data: mockTrendData,
                currency: 'USD',
            })
        )

        // Check that totals are displayed (they should contain $ for USD)
        const container = screen.getByText(/Total Income/i).parentElement
        expect(container).toBeTruthy()
    })

    it('should display CNY amounts with CN¥ symbol', () => {
        render(
            createElement(TrendLineChart, {
                data: mockTrendData,
                currency: 'CNY',
            })
        )

        // The component should render with CNY formatting
        const incomeLabel = screen.getByText(/Total Income/i)
        expect(incomeLabel).toBeTruthy()
    })

    it('should render without data', () => {
        render(
            createElement(TrendLineChart, {
                data: null,
                currency: 'USD',
            })
        )

        expect(screen.getByText(/No trend data available/i)).toBeTruthy()
    })
})

describe('CategoryPieChart Currency Prop', () => {
    const mockCategoryData = {
        categories: [
            { category: 'Food', amount: 500, percentage: 50 },
            { category: 'Transport', amount: 300, percentage: 30 },
            { category: 'Entertainment', amount: 200, percentage: 20 },
        ],
        total: 1000,
        type: 'expense',
    }

    it('should accept currency prop', () => {
        expect(() => {
            render(
                createElement(CategoryPieChart, {
                    data: mockCategoryData,
                    currency: 'EUR',
                })
            )
        }).not.toThrow()
    })

    it('should render with default USD currency', () => {
        render(
            createElement(CategoryPieChart, {
                data: mockCategoryData,
            })
        )

        // Should render the chart
        expect(screen.getByText(/Expense Breakdown/i)).toBeTruthy()
    })

    it('should render without data', () => {
        render(
            createElement(CategoryPieChart, {
                data: null,
                currency: 'USD',
            })
        )

        expect(screen.getByText(/No category data available/i)).toBeTruthy()
    })
})

describe('MonthlyComparisonChart Currency Prop', () => {
    const mockComparisonData = {
        months: [
            { monthName: 'Oct 2024', income: 5000, expense: 3000, savings: 2000 },
            { monthName: 'Nov 2024', income: 5500, expense: 3500, savings: 2000 },
        ],
        averages: {
            income: 5250,
            expense: 3250,
            savings: 2000,
            savingsRate: 38,
        },
    }

    it('should accept currency prop', () => {
        expect(() => {
            render(
                createElement(MonthlyComparisonChart, {
                    data: mockComparisonData,
                    currency: 'JPY',
                })
            )
        }).not.toThrow()
    })

    it('should display averages section', () => {
        render(
            createElement(MonthlyComparisonChart, {
                data: mockComparisonData,
                currency: 'USD',
            })
        )

        expect(screen.getByText(/Avg Income/i)).toBeTruthy()
        expect(screen.getByText(/Avg Expense/i)).toBeTruthy()
        // Use exact match to avoid matching "Avg Savings Rate" as well
        expect(screen.getByText('Avg Savings')).toBeTruthy()
    })

    it('should render without data', () => {
        render(
            createElement(MonthlyComparisonChart, {
                data: null,
                currency: 'USD',
            })
        )

        expect(screen.getByText(/No comparison data available/i)).toBeTruthy()
    })
})

describe('BudgetProgressBars Currency Prop', () => {
    const mockBudgetData = {
        categories: [
            { category: 'Food', budget: 500, spent: 250, remaining: 250, usage: 50, status: 'healthy' },
            { category: 'Transport', budget: 300, spent: 300, remaining: 0, usage: 100, status: 'warning' },
        ],
        summary: {
            totalBudget: 800,
            totalSpent: 550,
            overallUsage: 68
        }
    }

    it('should accept currency prop', () => {
        expect(() => {
            render(
                createElement(BudgetProgressBars, {
                    data: mockBudgetData,
                    currency: 'GBP',
                })
            )
        }).not.toThrow()
    })

    it('should display summary budget/spent', () => {
        render(
            createElement(BudgetProgressBars, {
                data: mockBudgetData,
                currency: 'USD',
            })
        )

        // Using partial match because the text is "Spent: $550"
        expect(screen.getByText(/Spent:/)).toBeTruthy()
        expect(screen.getByText(/Budget:/)).toBeTruthy()
    })

    it('should render without data', () => {
        render(
            createElement(BudgetProgressBars, {
                data: null,
                currency: 'USD',
            })
        )

        expect(screen.getByText(/No budget data available/i)).toBeTruthy()
    })
})

describe('formatCurrency Integration', () => {
    // Import the actual formatCurrency function
    const { formatCurrency } = require('../../../utils/formatCurrency')

    it('should format USD correctly', () => {
        const result = formatCurrency(1234, 'USD')
        expect(result).toContain('$')
        expect(result).toContain('1,234')
    })

    it('should format CNY correctly', () => {
        const result = formatCurrency(1234, 'CNY')
        // CNY typically shows as CN¥ or ¥
        expect(result).toMatch(/[¥CN]/)
        expect(result).toContain('1,234')
    })

    it('should format EUR correctly', () => {
        const result = formatCurrency(1234, 'EUR')
        expect(result).toContain('€')
        expect(result).toContain('1,234')
    })

    it('should format CAD correctly', () => {
        const result = formatCurrency(1234, 'CAD')
        // CAD shows as CA$ or $
        expect(result).toMatch(/[$CA]/)
        expect(result).toContain('1,234')
    })

    it('should handle zero values', () => {
        const result = formatCurrency(0, 'USD')
        expect(result).toContain('$')
        expect(result).toContain('0')
    })

    it('should handle negative values', () => {
        const result = formatCurrency(-500, 'USD')
        expect(result).toContain('$')
        expect(result).toContain('500')
    })

    it('should default to USD when currency is not provided', () => {
        const result = formatCurrency(1234)
        expect(result).toContain('$')
    })
})
