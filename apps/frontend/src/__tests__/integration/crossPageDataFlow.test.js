/**
 * Cross-Page Integration Tests
 * 
 * These tests verify that:
 * 1. Creating data on one "page" invalidates cache so other "pages" see updates
 * 2. Data flows correctly between components that share query cache
 * 3. Cross-service dependencies work (e.g., expense creation updates budget)
 * 
 * Architecture:
 *   CreateEntries → createIncome() → invalidateQueries(incomeKeys.all)
 *                                           ↓
 *   Dashboard (useIncomeSummary) ← cache marked stale → auto-refetch
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { createElement } from 'react'

// Import all query hooks
import { useIncomeList, useIncomeSummary, incomeKeys } from '../../hooks/queries/useIncomeQueries'
import { useBudgetSummary, budgetKeys } from '../../hooks/queries/useBudgetQueries'
import { useExpenseList, expenseKeys } from '../../hooks/queries/useExpenseQueries'
import { useUserSubscriptions, useTotalSubscription, subscriptionKeys } from '../../hooks/queries/useSubscriptionQueries'

// Import services
import * as incomeService from '../../services/incomeService'
import * as budgetService from '../../services/budgetService'
import * as expenseService from '../../services/expenseService'
import * as subscriptionService from '../../services/subscriptionService'

// Mock all services
vi.mock('../../services/incomeService')
vi.mock('../../services/budgetService')
vi.mock('../../services/expenseService')
vi.mock('../../services/subscriptionService')

describe('Cross-Page Integration: Income', () => {
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

    it('should refetch income summary when income list is invalidated (simulating CreateEntries → Dashboard)', async () => {
        // Initial data that Dashboard would show
        incomeService.getIncomeSummary.mockResolvedValue({ totalIncome: 1000 })

        // Mount "Dashboard" - useIncomeSummary
        const { result: dashboardResult } = renderHook(
            () => useIncomeSummary({ month: 1, year: 2024 }),
            { wrapper }
        )

        await waitFor(() => expect(dashboardResult.current.isSuccess).toBe(true))
        expect(dashboardResult.current.data.totalIncome).toBe(1000)

        // Simulate "CreateEntries" creating new income
        // After creation, CreateEntries calls: queryClient.invalidateQueries({ queryKey: incomeKeys.all })
        incomeService.getIncomeSummary.mockResolvedValue({ totalIncome: 1500 }) // Updated value

        await act(async () => {
            queryClient.invalidateQueries({ queryKey: incomeKeys.all })
        })

        // Wait for refetch
        await waitFor(() => {
            expect(incomeService.getIncomeSummary).toHaveBeenCalledTimes(2)
        })

        // Dashboard should now show updated total
        expect(dashboardResult.current.data.totalIncome).toBe(1500)
    })

    it('should refetch income list on Records page when new income is created', async () => {
        // Initial data for Records page
        const initialIncomes = [{ _id: '1', amount: 500, category: 'Salary' }]
        incomeService.listIncomes.mockResolvedValue(initialIncomes)

        // Mount "Records" - useIncomeList
        const { result: recordsResult } = renderHook(
            () => useIncomeList({ month: 1, year: 2024, userId: 'user123' }),
            { wrapper }
        )

        await waitFor(() => expect(recordsResult.current.isSuccess).toBe(true))
        expect(recordsResult.current.data).toHaveLength(1)

        // Simulate creating new income and invalidating
        const updatedIncomes = [
            ...initialIncomes,
            { _id: '2', amount: 300, category: 'Gift' }
        ]
        incomeService.listIncomes.mockResolvedValue(updatedIncomes)

        await act(async () => {
            queryClient.invalidateQueries({ queryKey: incomeKeys.all })
        })

        // Wait for refetch
        await waitFor(() => {
            expect(recordsResult.current.data).toHaveLength(2)
        })

        expect(recordsResult.current.data[1].amount).toBe(300)
    })
})

describe('Cross-Page Integration: Expense → Budget (Cross-Service Dependency)', () => {
    let queryClient

    beforeEach(() => {
        vi.clearAllMocks()
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false, gcTime: Infinity, staleTime: 0 },
            },
        })
    })

    afterEach(() => {
        queryClient.clear()
    })

    const wrapper = ({ children }) =>
        createElement(QueryClientProvider, { client: queryClient }, children)

    it('should refetch budget summary when expense is created (cross-service invalidation)', async () => {
        // Dashboard shows budget summary
        budgetService.getBudgetSummary.mockResolvedValue({
            totalBudget: 1000,
            totalExpenses: 200,
            remainingBudget: 800,
        })

        const { result: dashboardResult } = renderHook(
            () => useBudgetSummary({ month: 1, year: 2024, userId: 'user123' }),
            { wrapper }
        )

        await waitFor(() => expect(dashboardResult.current.isSuccess).toBe(true))
        expect(dashboardResult.current.data.remainingBudget).toBe(800)

        // CreateEntries creates expense → invalidates BOTH expense AND budget keys
        budgetService.getBudgetSummary.mockResolvedValue({
            totalBudget: 1000,
            totalExpenses: 350, // +150 expense
            remainingBudget: 650,
        })

        await act(async () => {
            // This is what CreateEntries does after creating expense
            queryClient.invalidateQueries({ queryKey: expenseKeys.all })
            queryClient.invalidateQueries({ queryKey: budgetKeys.all })
        })

        await waitFor(() => {
            expect(dashboardResult.current.data.remainingBudget).toBe(650)
        })
    })

    it('should update both expense list and budget summary when expense is deleted', async () => {
        // Setup expenses on Records page
        const initialExpenses = [
            { _id: '1', title: 'Lunch', amount: 20 },
            { _id: '2', title: 'Coffee', amount: 5 },
        ]
        expenseService.listExpenses.mockResolvedValue(initialExpenses)

        // Setup budget summary on Dashboard
        budgetService.getBudgetSummary.mockResolvedValue({
            totalExpenses: 25,
            remainingBudget: 475,
        })

        // Mount both "pages"
        const { result: recordsResult } = renderHook(
            () => useExpenseList({ month: 1, year: 2024, userId: 'user123' }),
            { wrapper }
        )
        const { result: dashboardResult } = renderHook(
            () => useBudgetSummary({ month: 1, year: 2024, userId: 'user123' }),
            { wrapper }
        )

        await waitFor(() => {
            expect(recordsResult.current.isSuccess).toBe(true)
            expect(dashboardResult.current.isSuccess).toBe(true)
        })

        expect(recordsResult.current.data).toHaveLength(2)
        expect(dashboardResult.current.data.totalExpenses).toBe(25)

        // Delete expense on Records → invalidates both keys
        expenseService.listExpenses.mockResolvedValue([initialExpenses[0]]) // Only first
        budgetService.getBudgetSummary.mockResolvedValue({
            totalExpenses: 20,
            remainingBudget: 480,
        })

        await act(async () => {
            queryClient.invalidateQueries({ queryKey: expenseKeys.all })
            queryClient.invalidateQueries({ queryKey: budgetKeys.all })
        })

        await waitFor(() => {
            expect(recordsResult.current.data).toHaveLength(1)
            expect(dashboardResult.current.data.totalExpenses).toBe(20)
        })
    })
})

describe('Cross-Page Integration: Subscription', () => {
    let queryClient

    beforeEach(() => {
        vi.clearAllMocks()
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false, gcTime: Infinity, staleTime: 0 },
            },
        })
    })

    afterEach(() => {
        queryClient.clear()
    })

    const wrapper = ({ children }) =>
        createElement(QueryClientProvider, { client: queryClient }, children)

    it('should update total subscription on Dashboard when subscription is created', async () => {
        // Dashboard shows total subscription fee
        subscriptionService.getTotalSubscription.mockResolvedValue(50)

        const { result: dashboardResult } = renderHook(
            () => useTotalSubscription({ userId: 'user123' }),
            { wrapper }
        )

        await waitFor(() => expect(dashboardResult.current.isSuccess).toBe(true))
        expect(dashboardResult.current.data).toBe(50)

        // CreateEntries creates subscription
        subscriptionService.getTotalSubscription.mockResolvedValue(65) // +15 new sub

        await act(async () => {
            queryClient.invalidateQueries({ queryKey: subscriptionKeys.all })
        })

        await waitFor(() => {
            expect(dashboardResult.current.data).toBe(65)
        })
    })

    it('should update subscription list on Records when subscription is deleted', async () => {
        const initialSubs = [
            { _id: '1', name: 'Netflix', price: 15 },
            { _id: '2', name: 'Spotify', price: 10 },
        ]
        subscriptionService.getUserSubscriptions.mockResolvedValue(initialSubs)

        const { result: recordsResult } = renderHook(
            () => useUserSubscriptions('user123'),
            { wrapper }
        )

        await waitFor(() => expect(recordsResult.current.isSuccess).toBe(true))
        expect(recordsResult.current.data).toHaveLength(2)

        // Delete subscription
        subscriptionService.getUserSubscriptions.mockResolvedValue([initialSubs[0]])

        await act(async () => {
            queryClient.invalidateQueries({ queryKey: subscriptionKeys.all })
        })

        await waitFor(() => {
            expect(recordsResult.current.data).toHaveLength(1)
        })
    })
})

describe('Query Isolation: No Unnecessary Refetches', () => {
    let queryClient

    beforeEach(() => {
        vi.clearAllMocks()
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false, gcTime: Infinity, staleTime: 60000 },
            },
        })
    })

    afterEach(() => {
        queryClient.clear()
    })

    const wrapper = ({ children }) =>
        createElement(QueryClientProvider, { client: queryClient }, children)

    it('should NOT refetch budget when income is created (isolated services)', async () => {
        incomeService.listIncomes.mockResolvedValue([])
        budgetService.getBudgetSummary.mockResolvedValue({ totalBudget: 1000 })

        // Mount both hooks
        const { result: incomeResult } = renderHook(
            () => useIncomeList({ month: 1, year: 2024, userId: 'user123' }),
            { wrapper }
        )
        const { result: budgetResult } = renderHook(
            () => useBudgetSummary({ month: 1, year: 2024, userId: 'user123' }),
            { wrapper }
        )

        await waitFor(() => {
            expect(incomeResult.current.isSuccess).toBe(true)
            expect(budgetResult.current.isSuccess).toBe(true)
        })

        // Record initial call counts
        const incomeCallCount = incomeService.listIncomes.mock.calls.length
        const budgetCallCount = budgetService.getBudgetSummary.mock.calls.length

        // Invalidate ONLY income queries
        await act(async () => {
            queryClient.invalidateQueries({ queryKey: incomeKeys.all })
        })

        await waitFor(() => {
            // Income should be refetched
            expect(incomeService.listIncomes.mock.calls.length).toBe(incomeCallCount + 1)
        })

        // Budget should NOT be refetched
        expect(budgetService.getBudgetSummary.mock.calls.length).toBe(budgetCallCount)
    })
})
