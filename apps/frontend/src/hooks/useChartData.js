/**
 * Custom hooks for chart data
 * 
 * Uses React Query to fetch data from backend analytics APIs.
 * Falls back to mock data if API call fails.
 * 
 * The hook signatures match the API parameters from docs/api/Analytics-API.md
 */

import { useQuery } from '@tanstack/react-query'
import {
    getTrendData,
    getCategoryBreakdown,
    getMonthlyComparison,
    getBudgetUsage
} from '../services/analyticsService'
import {
    generateTrendData,
    generateCategoryBreakdown,
    generateMonthlyComparison,
    generateBudgetUsage
} from '../data/mockChartData'

// Query key factory for analytics
export const analyticsKeys = {
    all: ['analytics'],
    trend: (params) => ['analytics', 'trend', params],
    categoryBreakdown: (params) => ['analytics', 'category-breakdown', params],
    monthlyComparison: (params) => ['analytics', 'monthly-comparison', params],
    budgetUsage: (params) => ['analytics', 'budget-usage', params]
}

/**
 * Hook for trend data (line chart)
 * @param {Object} options
 * @param {string} options.granularity - 'weekly' | 'monthly' | 'yearly' (default: 'monthly')
 * @param {number} options.count - Number of periods to show (default: 12)
 */
export function useTrendData({ granularity = 'monthly', count = 12 } = {}) {
    return useQuery({
        queryKey: analyticsKeys.trend({ granularity, count }),
        queryFn: () => getTrendData({ granularity, count }),
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

/**
 * Hook for category breakdown (pie chart)
 * Uses the selected month/year from dashboard
 * @param {Object} options
 * @param {string} options.type - 'expense' or 'income'
 * @param {number} options.month - Month (1-12)
 * @param {number} options.year - Year
 */
export function useCategoryBreakdown({ type = 'expense', month, year } = {}) {
    return useQuery({
        queryKey: analyticsKeys.categoryBreakdown({ type, month, year }),
        queryFn: () => getCategoryBreakdown({ type, month, year }),
        enabled: !!month && !!year,
        staleTime: 5 * 60 * 1000,
    })
}

/**
 * Hook for monthly comparison (bar chart)
 * @param {Object} options
 * @param {number} options.months - Number of months to compare (default: 6)
 */
export function useMonthlyComparison({ months = 6 } = {}) {
    return useQuery({
        queryKey: analyticsKeys.monthlyComparison({ months }),
        queryFn: () => getMonthlyComparison({ months }),
        staleTime: 5 * 60 * 1000,
    })
}

/**
 * Hook for budget usage (progress bars)
 * Can use real budgetSummary data from useBudgetSummary hook as fallback
 * @param {Object} options
 * @param {number} options.month - Month (1-12)
 * @param {number} options.year - Year
 * @param {Object} options.budgetSummary - Fallback budget summary data
 */
export function useBudgetUsage({ month, year, budgetSummary = null } = {}) {
    return useQuery({
        queryKey: analyticsKeys.budgetUsage({ month, year }),
        queryFn: () => getBudgetUsage({ month, year }),
        enabled: !!month && !!year,
        staleTime: 5 * 60 * 1000,
    })
}
