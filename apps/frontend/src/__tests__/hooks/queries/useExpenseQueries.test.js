import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import {
    expenseKeys,
    useExpenseList,
    useCreateExpense,
    useUpdateExpense,
    useDeleteExpense,
} from '../../../hooks/queries/useExpenseQueries'
import { budgetKeys } from '../../../hooks/queries/useBudgetQueries'
import * as expenseService from '../../../services/expenseService'

// Mock the expense service
vi.mock('../../../services/expenseService', () => ({
    listExpenses: vi.fn(),
    createExpense: vi.fn(),
    updateExpense: vi.fn(),
    deleteExpense: vi.fn(),
}))

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    })
    return ({ children }) => createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('expenseKeys', () => {
    it('should generate correct query keys', () => {
        expect(expenseKeys.all).toEqual(['expenses'])
        expect(expenseKeys.lists()).toEqual(['expenses', 'list'])
        expect(expenseKeys.list({ month: 1, year: 2024 })).toEqual(['expenses', 'list', { month: 1, year: 2024 }])
    })
})

describe('useExpenseList', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should fetch expenses when enabled', async () => {
        const mockExpenses = [{ _id: '1', title: 'Lunch', amount: 15 }]
        expenseService.listExpenses.mockResolvedValue(mockExpenses)

        const { result } = renderHook(
            () => useExpenseList({ month: 1, year: 2024, userId: 'user123' }),
            { wrapper: createWrapper() }
        )

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(result.current.data).toEqual(mockExpenses)
    })

    it('should not fetch when userId is missing', async () => {
        const { result } = renderHook(
            () => useExpenseList({ month: 1, year: 2024, userId: null }),
            { wrapper: createWrapper() }
        )

        expect(result.current.fetchStatus).toBe('idle')
        expect(expenseService.listExpenses).not.toHaveBeenCalled()
    })
})

describe('useCreateExpense - Cross-invalidation', () => {
    it('should invalidate BOTH expense and budget queries on success', async () => {
        const mockCreated = { _id: '1', title: 'Lunch', amount: 15 }
        expenseService.createExpense.mockResolvedValue(mockCreated)

        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        })
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

        const wrapper = ({ children }) =>
            createElement(QueryClientProvider, { client: queryClient }, children)

        const { result } = renderHook(() => useCreateExpense(), { wrapper })

        result.current.mutate({ title: 'Lunch', amount: 15 })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        // This is the critical test - expense mutations must invalidate budget queries too
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: expenseKeys.all })
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: budgetKeys.all })
        expect(invalidateSpy).toHaveBeenCalledTimes(2)
    })
})

describe('useUpdateExpense - Cross-invalidation', () => {
    it('should invalidate BOTH expense and budget queries on success', async () => {
        expenseService.updateExpense.mockResolvedValue({ _id: '1', amount: 20 })

        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        })
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

        const wrapper = ({ children }) =>
            createElement(QueryClientProvider, { client: queryClient }, children)

        const { result } = renderHook(() => useUpdateExpense(), { wrapper })

        result.current.mutate({ id: '1', payload: { amount: 20 } })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: expenseKeys.all })
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: budgetKeys.all })
    })
})

describe('useDeleteExpense - Cross-invalidation', () => {
    it('should invalidate BOTH expense and budget queries on success', async () => {
        expenseService.deleteExpense.mockResolvedValue({ success: true })

        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        })
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

        const wrapper = ({ children }) =>
            createElement(QueryClientProvider, { client: queryClient }, children)

        const { result } = renderHook(() => useDeleteExpense(), { wrapper })

        result.current.mutate('1')

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: expenseKeys.all })
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: budgetKeys.all })
    })
})
