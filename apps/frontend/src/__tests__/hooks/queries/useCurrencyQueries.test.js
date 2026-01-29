import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import {
    currencyKeys,
    useExchangeRates,
    useAvailableCurrencies,
    useConvertPairs,
    useCreateConvertPair,
    useUpdateConvertPair,
    useDeleteConvertPair,
} from '../../../hooks/queries/useCurrencyQueries'
import * as currencyService from '../../../services/currencyService'

// Mock the currency service
vi.mock('../../../services/currencyService', () => ({
    getExchangeRates: vi.fn(),
    getAvailableCurrencies: vi.fn(),
    getConvertPairs: vi.fn(),
    createConvertPair: vi.fn(),
    updateConvertPair: vi.fn(),
    deleteConvertPair: vi.fn(),
}))

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    })
    return ({ children }) => createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('currencyKeys', () => {
    it('should generate correct query keys', () => {
        expect(currencyKeys.all).toEqual(['currency'])
        expect(currencyKeys.rates()).toEqual(['currency', 'rates'])
        expect(currencyKeys.currencies()).toEqual(['currency', 'currencies'])
        expect(currencyKeys.convertPairs()).toEqual(['currency', 'convertPairs'])
    })
})

describe('useExchangeRates', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should fetch exchange rates', async () => {
        const mockRates = { success: true, data: { USD: 1, EUR: 0.85 } }
        currencyService.getExchangeRates.mockResolvedValue(mockRates)

        const { result } = renderHook(
            () => useExchangeRates(),
            { wrapper: createWrapper() }
        )

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(result.current.data).toEqual(mockRates)
    })
})

describe('useAvailableCurrencies', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should fetch available currencies', async () => {
        const mockCurrencies = ['USD', 'EUR', 'GBP', 'CNY']
        currencyService.getAvailableCurrencies.mockResolvedValue(mockCurrencies)

        const { result } = renderHook(
            () => useAvailableCurrencies(),
            { wrapper: createWrapper() }
        )

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(result.current.data).toEqual(mockCurrencies)
    })
})

describe('useConvertPairs', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should fetch user convert pairs', async () => {
        const mockPairs = { data: [{ _id: '1', fromCurrency: 'USD', toCurrency: 'EUR' }] }
        currencyService.getConvertPairs.mockResolvedValue(mockPairs)

        const { result } = renderHook(
            () => useConvertPairs(),
            { wrapper: createWrapper() }
        )

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(result.current.data).toEqual(mockPairs)
    })
})

describe('Currency mutations - Optimistic updates', () => {
    describe('useCreateConvertPair', () => {
        it('should optimistically add pair to cache before API response', async () => {
            // Simulate slow API
            currencyService.createConvertPair.mockImplementation(
                () => new Promise(resolve => setTimeout(() => resolve({ data: { _id: 'real-id' } }), 100))
            )

            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false } },
            })

            // Pre-populate cache with existing pairs
            queryClient.setQueryData(currencyKeys.convertPairs(), {
                data: [{ _id: '1', fromCurrency: 'EUR', toCurrency: 'GBP' }]
            })

            const wrapper = ({ children }) =>
                createElement(QueryClientProvider, { client: queryClient }, children)

            const { result } = renderHook(() => useCreateConvertPair(), { wrapper })

            // Start mutation
            result.current.mutate({ fromCurrency: 'USD', toCurrency: 'EUR' })

            // Check cache was updated optimistically (before API response)
            await waitFor(() => {
                const cached = queryClient.getQueryData(currencyKeys.convertPairs())
                expect(cached.data.length).toBe(2)
                expect(cached.data[0].fromCurrency).toBe('USD') // New pair added at front
            })
        })

        it('should invalidate convertPairs after mutation settles', async () => {
            currencyService.createConvertPair.mockResolvedValue({ data: { _id: '1' } })

            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false } },
            })
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

            const wrapper = ({ children }) =>
                createElement(QueryClientProvider, { client: queryClient }, children)

            const { result } = renderHook(() => useCreateConvertPair(), { wrapper })

            result.current.mutate({ fromCurrency: 'USD', toCurrency: 'EUR' })

            await waitFor(() => expect(result.current.isSuccess).toBe(true))

            // Should invalidate convertPairs via onSettled
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: currencyKeys.convertPairs() })
            expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: currencyKeys.rates() })
        })
    })

    describe('useUpdateConvertPair', () => {
        it('should optimistically update pair in cache', async () => {
            currencyService.updateConvertPair.mockImplementation(
                () => new Promise(resolve => setTimeout(() => resolve({ data: { _id: '1' } }), 100))
            )

            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false } },
            })

            // Pre-populate cache
            queryClient.setQueryData(currencyKeys.convertPairs(), {
                data: [{ _id: '1', fromCurrency: 'USD', toCurrency: 'EUR' }]
            })

            const wrapper = ({ children }) =>
                createElement(QueryClientProvider, { client: queryClient }, children)

            const { result } = renderHook(() => useUpdateConvertPair(), { wrapper })

            // Start mutation
            result.current.mutate({ id: '1', data: { fromCurrency: 'GBP' } })

            // Check cache was updated optimistically
            await waitFor(() => {
                const cached = queryClient.getQueryData(currencyKeys.convertPairs())
                expect(cached.data[0].fromCurrency).toBe('GBP')
            })
        })

        it('should rollback on error', async () => {
            currencyService.updateConvertPair.mockRejectedValue(new Error('API Error'))

            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false } },
            })

            // Pre-populate cache
            queryClient.setQueryData(currencyKeys.convertPairs(), {
                data: [{ _id: '1', fromCurrency: 'USD', toCurrency: 'EUR' }]
            })

            const wrapper = ({ children }) =>
                createElement(QueryClientProvider, { client: queryClient }, children)

            const { result } = renderHook(() => useUpdateConvertPair(), { wrapper })

            result.current.mutate({ id: '1', data: { fromCurrency: 'GBP' } })

            await waitFor(() => expect(result.current.isError).toBe(true))

            // Cache should be rolled back to original value
            const cached = queryClient.getQueryData(currencyKeys.convertPairs())
            expect(cached.data[0].fromCurrency).toBe('USD')
        })
    })

    describe('useDeleteConvertPair', () => {
        it('should optimistically remove pair from cache', async () => {
            currencyService.deleteConvertPair.mockImplementation(
                () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
            )

            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false } },
            })

            // Pre-populate cache with 2 pairs
            queryClient.setQueryData(currencyKeys.convertPairs(), {
                data: [
                    { _id: '1', fromCurrency: 'USD', toCurrency: 'EUR' },
                    { _id: '2', fromCurrency: 'GBP', toCurrency: 'JPY' }
                ]
            })

            const wrapper = ({ children }) =>
                createElement(QueryClientProvider, { client: queryClient }, children)

            const { result } = renderHook(() => useDeleteConvertPair(), { wrapper })

            result.current.mutate('1')

            // Check cache was updated optimistically (pair removed immediately)
            await waitFor(() => {
                const cached = queryClient.getQueryData(currencyKeys.convertPairs())
                expect(cached.data.length).toBe(1)
                expect(cached.data[0]._id).toBe('2')
            })
        })

        it('should rollback on delete error', async () => {
            currencyService.deleteConvertPair.mockRejectedValue(new Error('API Error'))

            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false } },
            })

            queryClient.setQueryData(currencyKeys.convertPairs(), {
                data: [{ _id: '1', fromCurrency: 'USD', toCurrency: 'EUR' }]
            })

            const wrapper = ({ children }) =>
                createElement(QueryClientProvider, { client: queryClient }, children)

            const { result } = renderHook(() => useDeleteConvertPair(), { wrapper })

            result.current.mutate('1')

            await waitFor(() => expect(result.current.isError).toBe(true))

            // Cache should be rolled back - pair restored
            const cached = queryClient.getQueryData(currencyKeys.convertPairs())
            expect(cached.data.length).toBe(1)
        })
    })
})

