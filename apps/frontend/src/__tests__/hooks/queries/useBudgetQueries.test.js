import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import {
    budgetKeys,
    useBudgetList,
    useBudgetSummary,
    useCreateBudget,
    useUpdateBudget,
    useDeleteBudget,
} from '../../../hooks/queries/useBudgetQueries'
import * as budgetService from '../../../services/budgetService'

// Mock the budget service
vi.mock('../../../services/budgetService', () => ({
    listBudgets: vi.fn(),
    getBudgetSummary: vi.fn(),
    createBudget: vi.fn(),
    updateBudget: vi.fn(),
    deleteBudget: vi.fn(),
}))

// Helper to create a wrapper with QueryClientProvider
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
            },
        },
    })
    return ({ children }) => createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('budgetKeys', () => {
    it('should generate correct query keys', () => {
        expect(budgetKeys.all).toEqual(['budgets'])
        expect(budgetKeys.lists()).toEqual(['budgets', 'list'])
        expect(budgetKeys.list({ month: 1, year: 2024 })).toEqual(['budgets', 'list', { month: 1, year: 2024 }])
        expect(budgetKeys.summaries()).toEqual(['budgets', 'summary'])
        expect(budgetKeys.summary({ month: 1, year: 2024 })).toEqual(['budgets', 'summary', { month: 1, year: 2024 }])
    })
})

describe('useBudgetList', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should fetch budgets when userId, month, year are provided', async () => {
        const mockBudgets = [
            { _id: '1', category: 'Food', limit: 500 },
            { _id: '2', category: 'Transport', limit: 200 },
        ]
        budgetService.listBudgets.mockResolvedValue(mockBudgets)

        const { result } = renderHook(
            () => useBudgetList({ month: 1, year: 2024, userId: 'user123' }),
            { wrapper: createWrapper() }
        )

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(budgetService.listBudgets).toHaveBeenCalledWith({
            month: 1,
            year: 2024,
            userId: 'user123',
        })
        expect(result.current.data).toEqual(mockBudgets)
    })

    it('should not fetch when userId is missing', async () => {
        const { result } = renderHook(
            () => useBudgetList({ month: 1, year: 2024, userId: null }),
            { wrapper: createWrapper() }
        )

        // Query should not be enabled
        expect(result.current.isLoading).toBe(false)
        expect(result.current.fetchStatus).toBe('idle')
        expect(budgetService.listBudgets).not.toHaveBeenCalled()
    })

    it('should not fetch when month is missing', async () => {
        const { result } = renderHook(
            () => useBudgetList({ month: null, year: 2024, userId: 'user123' }),
            { wrapper: createWrapper() }
        )

        expect(result.current.fetchStatus).toBe('idle')
        expect(budgetService.listBudgets).not.toHaveBeenCalled()
    })
})

describe('useBudgetSummary', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should fetch budget summary when enabled', async () => {
        const mockSummary = {
            totalBudget: 1000,
            totalExpenses: 500,
            remainingBudget: 500,
            categoriesSummary: [],
        }
        budgetService.getBudgetSummary.mockResolvedValue(mockSummary)

        const { result } = renderHook(
            () => useBudgetSummary({ month: 1, year: 2024, userId: 'user123' }),
            { wrapper: createWrapper() }
        )

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(budgetService.getBudgetSummary).toHaveBeenCalledWith({
            month: 1,
            year: 2024,
            userId: 'user123',
        })
        expect(result.current.data).toEqual(mockSummary)
    })
})

describe('useCreateBudget', () => {
    it('should create budget and invalidate queries', async () => {
        const mockCreated = { _id: '1', category: 'Food', limit: 500 }
        budgetService.createBudget.mockResolvedValue(mockCreated)

        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        })
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

        const wrapper = ({ children }) =>
            createElement(QueryClientProvider, { client: queryClient }, children)

        const { result } = renderHook(() => useCreateBudget(), { wrapper })

        result.current.mutate({ category: 'Food', limit: 500 })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(budgetService.createBudget).toHaveBeenCalled()
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: budgetKeys.all })
    })
})

describe('useUpdateBudget', () => {
    it('should update budget and invalidate queries', async () => {
        const mockUpdated = { _id: '1', category: 'Food', limit: 600 }
        budgetService.updateBudget.mockResolvedValue(mockUpdated)

        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        })
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

        const wrapper = ({ children }) =>
            createElement(QueryClientProvider, { client: queryClient }, children)

        const { result } = renderHook(() => useUpdateBudget(), { wrapper })

        result.current.mutate({ id: '1', payload: { limit: 600 } })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(budgetService.updateBudget).toHaveBeenCalledWith('1', { limit: 600 })
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: budgetKeys.all })
    })
})

describe('useDeleteBudget', () => {
    it('should delete budget and invalidate queries', async () => {
        budgetService.deleteBudget.mockResolvedValue({ success: true })

        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        })
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

        const wrapper = ({ children }) =>
            createElement(QueryClientProvider, { client: queryClient }, children)

        const { result } = renderHook(() => useDeleteBudget(), { wrapper })

        result.current.mutate('1')

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(budgetService.deleteBudget).toHaveBeenCalled()
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: budgetKeys.all })
    })
})
