/**
 * Custom hooks for chart data
 * 
 * Currently returns mock data for development.
 * When backend APIs are ready, swap to use React Query with actual API calls.
 * 
 * The hook signatures match the API parameters from docs/api/Analytics-API.md
 */

import { useMemo } from 'react'
import {
    generateTrendData,
    generateCategoryBreakdown,
    generateMonthlyComparison,
    generateBudgetUsage
} from '../data/mockChartData'

/**
 * Hook for trend data (line chart)
 * @param {Object} options
 * @param {string} options.startDate - Start date (unused in mock, for API compatibility)
 * @param {string} options.endDate - End date (unused in mock, for API compatibility)
 * @param {number} options.months - Number of months (default: 6)
 */
export function useTrendData({ months = 6 } = {}) {
    // In production, this would be:
    // return useQuery({
    //   queryKey: ['analytics', 'trend', { startDate, endDate }],
    //   queryFn: () => api.getTrendData({ startDate, endDate }),
    // })

    const data = useMemo(() => generateTrendData(months), [months])

    return {
        data,
        isLoading: false,
        error: null
    }
}

/**
 * Hook for category breakdown (pie chart)
 * @param {Object} options
 * @param {string} options.type - 'expense' or 'income'
 */
export function useCategoryBreakdown({ type = 'expense' } = {}) {
    const data = useMemo(() => generateCategoryBreakdown(type), [type])

    return {
        data,
        isLoading: false,
        error: null
    }
}

/**
 * Hook for monthly comparison (bar chart)
 * @param {Object} options
 * @param {number} options.months - Number of months to compare
 */
export function useMonthlyComparison({ months = 4 } = {}) {
    const data = useMemo(() => generateMonthlyComparison(months), [months])

    return {
        data,
        isLoading: false,
        error: null
    }
}

/**
 * Hook for budget usage (progress bars)
 * Can use real budgetSummary data if available
 * @param {Object} options
 * @param {Object} options.budgetSummary - Existing budget summary from useBudgetSummary hook
 */
export function useBudgetUsage({ budgetSummary = null } = {}) {
    const data = useMemo(
        () => generateBudgetUsage(budgetSummary),
        [budgetSummary]
    )

    return {
        data,
        isLoading: false,
        error: null
    }
}
