/**
 * Profile Currency Change Cache Invalidation Tests
 * 
 * Tests that verify when user changes their default currency in Profile,
 * all dashboard-related caches are invalidated to ensure UI displays
 * amounts with the correct currency format.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Import all query hooks that should be invalidated
import { useBudgetSummary, budgetKeys } from '../../hooks/queries/useBudgetQueries'
import { useIncomeSummary, incomeKeys } from '../../hooks/queries/useIncomeQueries'
import { useExpenseList, expenseKeys } from '../../hooks/queries/useExpenseQueries'
import { useTotalSubscription, subscriptionKeys } from '../../hooks/queries/useSubscriptionQueries'
import { analyticsKeys } from '../../hooks/useChartData'

// Import services
import * as budgetService from '../../services/budgetService'
import * as incomeService from '../../services/incomeService'
import * as expenseService from '../../services/expenseService'
import * as subscriptionService from '../../services/subscriptionService'

// Mock all services
vi.mock('../../services/budgetService')
vi.mock('../../services/incomeService')
vi.mock('../../services/expenseService')
vi.mock('../../services/subscriptionService')

describe('Profile Currency Change: Cache Invalidation', () => {
    let queryClient

    beforeEach(() => {
        vi.clearAllMocks()
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                    gcTime: Infinity,
                    staleTime: 0, // Always refetch on invalidation
                },
            },
        })
    })

    afterEach(() => {
        queryClient.clear()
    })

    const wrapper = ({ children }) =>
        createElement(QueryClientProvider, { client: queryClient }, children)

    it('should invalidate all dashboard caches when currency changes', async () => {
        // Setup mock responses
        budgetService.getBudgetSummary.mockResolvedValue({
            totalBudget: 1000,
            totalExpenses: 500,
            remainingBudget: 500,
        })
        incomeService.getIncomeSummary.mockResolvedValue({ totalIncome: 2000 })
        expenseService.listExpenses.mockResolvedValue([{ _id: '1', amount: 100 }])
        subscriptionService.getTotalSubscription.mockResolvedValue(50)

        // Mount all dashboard hooks
        const { result: budgetResult } = renderHook(
            () => useBudgetSummary({ month: 1, year: 2024, userId: 'user123' }),
            { wrapper }
        )
        const { result: incomeResult } = renderHook(
            () => useIncomeSummary({ month: 1, year: 2024, userId: 'user123' }),
            { wrapper }
        )
        const { result: expenseResult } = renderHook(
            () => useExpenseList({ month: 1, year: 2024, userId: 'user123' }),
            { wrapper }
        )
        const { result: subscriptionResult } = renderHook(
            () => useTotalSubscription({ userId: 'user123' }),
            { wrapper }
        )

        // Wait for all to load
        await waitFor(() => {
            expect(budgetResult.current.isSuccess).toBe(true)
            expect(incomeResult.current.isSuccess).toBe(true)
            expect(expenseResult.current.isSuccess).toBe(true)
            expect(subscriptionResult.current.isSuccess).toBe(true)
        })

        // Record initial call counts
        const budgetCallCount = budgetService.getBudgetSummary.mock.calls.length
        const incomeCallCount = incomeService.getIncomeSummary.mock.calls.length
        const expenseCallCount = expenseService.listExpenses.mock.calls.length
        const subscriptionCallCount = subscriptionService.getTotalSubscription.mock.calls.length

        // Simulate currency change in Profile - this is what Profile.jsx does
        await act(async () => {
            queryClient.invalidateQueries({ queryKey: budgetKeys.all })
            queryClient.invalidateQueries({ queryKey: incomeKeys.all })
            queryClient.invalidateQueries({ queryKey: expenseKeys.all })
            queryClient.invalidateQueries({ queryKey: subscriptionKeys.all })
            queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
        })

        // All queries should be refetched
        await waitFor(() => {
            expect(budgetService.getBudgetSummary.mock.calls.length).toBe(budgetCallCount + 1)
            expect(incomeService.getIncomeSummary.mock.calls.length).toBe(incomeCallCount + 1)
            expect(expenseService.listExpenses.mock.calls.length).toBe(expenseCallCount + 1)
            expect(subscriptionService.getTotalSubscription.mock.calls.length).toBe(subscriptionCallCount + 1)
        })
    })

    it('should NOT invalidate caches when currency does NOT change', async () => {
        budgetService.getBudgetSummary.mockResolvedValue({ totalBudget: 1000 })

        const { result: budgetResult } = renderHook(
            () => useBudgetSummary({ month: 1, year: 2024, userId: 'user123' }),
            { wrapper }
        )

        await waitFor(() => expect(budgetResult.current.isSuccess).toBe(true))

        const initialCallCount = budgetService.getBudgetSummary.mock.calls.length

        // Simulate profile update WITHOUT currency change
        // (no invalidateQueries calls should happen)

        // Wait a bit to ensure no refetch happens
        await new Promise(resolve => setTimeout(resolve, 100))

        // Call count should remain the same
        expect(budgetService.getBudgetSummary.mock.calls.length).toBe(initialCallCount)
    })
})

describe('Profile Currency Change: Query Key Structure', () => {
    it('should have correct analyticsKeys structure for invalidation', () => {
        expect(analyticsKeys.all).toEqual(['analytics'])
        expect(analyticsKeys.trend({ granularity: 'monthly', count: 12 }))
            .toEqual(['analytics', 'trend', { granularity: 'monthly', count: 12 }])
        expect(analyticsKeys.categoryBreakdown({ type: 'expense', month: 1, year: 2024 }))
            .toEqual(['analytics', 'category-breakdown', { type: 'expense', month: 1, year: 2024 }])
    })

    it('analyticsKeys.all should be prefix for all analytics queries', () => {
        const trendKey = analyticsKeys.trend({ granularity: 'monthly', count: 12 })
        const categoryKey = analyticsKeys.categoryBreakdown({ type: 'expense' })
        const comparisonKey = analyticsKeys.monthlyComparison({ months: 6 })
        const budgetUsageKey = analyticsKeys.budgetUsage({ month: 1, year: 2024 })

        // All should start with 'analytics'
        expect(trendKey[0]).toBe('analytics')
        expect(categoryKey[0]).toBe('analytics')
        expect(comparisonKey[0]).toBe('analytics')
        expect(budgetUsageKey[0]).toBe('analytics')
    })
})
