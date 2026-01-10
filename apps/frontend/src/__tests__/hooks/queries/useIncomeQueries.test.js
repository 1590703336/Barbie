import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import {
    incomeKeys,
    useIncomeList,
    useIncomeSummary,
    useCreateIncome,
    useUpdateIncome,
    useDeleteIncome,
} from '../../../hooks/queries/useIncomeQueries'
import * as incomeService from '../../../services/incomeService'

// Mock the income service
vi.mock('../../../services/incomeService', () => ({
    listIncomes: vi.fn(),
    getIncomeSummary: vi.fn(),
    createIncome: vi.fn(),
    updateIncome: vi.fn(),
    deleteIncome: vi.fn(),
}))

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    })
    return ({ children }) => createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('incomeKeys', () => {
    it('should generate correct query keys', () => {
        expect(incomeKeys.all).toEqual(['incomes'])
        expect(incomeKeys.lists()).toEqual(['incomes', 'list'])
        expect(incomeKeys.list({ month: 1, year: 2024 })).toEqual(['incomes', 'list', { month: 1, year: 2024 }])
        expect(incomeKeys.summaries()).toEqual(['incomes', 'summary'])
        expect(incomeKeys.summary({ month: 1, year: 2024 })).toEqual(['incomes', 'summary', { month: 1, year: 2024 }])
    })
})

describe('useIncomeList', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should fetch incomes when enabled', async () => {
        const mockIncomes = [{ _id: '1', amount: 5000, category: 'Salary' }]
        incomeService.listIncomes.mockResolvedValue(mockIncomes)

        const { result } = renderHook(
            () => useIncomeList({ month: 1, year: 2024, userId: 'user123' }),
            { wrapper: createWrapper() }
        )

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(result.current.data).toEqual(mockIncomes)
    })
})

describe('useIncomeSummary', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should fetch income summary when month and year provided', async () => {
        const mockSummary = { totalIncome: 5000 }
        incomeService.getIncomeSummary.mockResolvedValue(mockSummary)

        const { result } = renderHook(
            () => useIncomeSummary({ month: 1, year: 2024 }),
            { wrapper: createWrapper() }
        )

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(result.current.data).toEqual(mockSummary)
    })

    it('should not require userId (different from list)', async () => {
        incomeService.getIncomeSummary.mockResolvedValue({ totalIncome: 1000 })

        const { result } = renderHook(
            () => useIncomeSummary({ month: 1, year: 2024 }),
            { wrapper: createWrapper() }
        )

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        // Summary is user-scoped on backend via auth, not explicit userId
        expect(incomeService.getIncomeSummary).toHaveBeenCalledWith({ month: 1, year: 2024 })
    })
})

describe('useCreateIncome', () => {
    it('should create income and invalidate queries', async () => {
        incomeService.createIncome.mockResolvedValue({ _id: '1', amount: 5000 })

        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        })
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

        const wrapper = ({ children }) =>
            createElement(QueryClientProvider, { client: queryClient }, children)

        const { result } = renderHook(() => useCreateIncome(), { wrapper })

        result.current.mutate({ amount: 5000, category: 'Salary' })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: incomeKeys.all })
    })
})

describe('useUpdateIncome', () => {
    it('should update income and invalidate queries', async () => {
        incomeService.updateIncome.mockResolvedValue({ _id: '1', amount: 6000 })

        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        })
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

        const wrapper = ({ children }) =>
            createElement(QueryClientProvider, { client: queryClient }, children)

        const { result } = renderHook(() => useUpdateIncome(), { wrapper })

        result.current.mutate({ id: '1', payload: { amount: 6000 } })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: incomeKeys.all })
    })
})

describe('useDeleteIncome', () => {
    it('should delete income and invalidate queries', async () => {
        incomeService.deleteIncome.mockResolvedValue({ success: true })

        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        })
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

        const wrapper = ({ children }) =>
            createElement(QueryClientProvider, { client: queryClient }, children)

        const { result } = renderHook(() => useDeleteIncome(), { wrapper })

        result.current.mutate('1')

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: incomeKeys.all })
    })
})
