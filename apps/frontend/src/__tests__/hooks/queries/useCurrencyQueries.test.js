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

describe('Currency mutations - Isolation test', () => {
    describe('useCreateConvertPair', () => {
        it('should ONLY invalidate convertPairs, NOT exchange rates', async () => {
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

            // Critical: pair mutations should NOT invalidate exchange rates
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: currencyKeys.convertPairs() })
            expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: currencyKeys.rates() })
            expect(invalidateSpy).toHaveBeenCalledTimes(1)
        })
    })

    describe('useUpdateConvertPair', () => {
        it('should ONLY invalidate convertPairs, NOT exchange rates', async () => {
            currencyService.updateConvertPair.mockResolvedValue({ data: { _id: '1' } })

            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false } },
            })
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

            const wrapper = ({ children }) =>
                createElement(QueryClientProvider, { client: queryClient }, children)

            const { result } = renderHook(() => useUpdateConvertPair(), { wrapper })

            result.current.mutate({ id: '1', payload: { fromCurrency: 'GBP' } })

            await waitFor(() => expect(result.current.isSuccess).toBe(true))

            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: currencyKeys.convertPairs() })
            expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: currencyKeys.rates() })
        })
    })

    describe('useDeleteConvertPair', () => {
        it('should ONLY invalidate convertPairs, NOT exchange rates', async () => {
            currencyService.deleteConvertPair.mockResolvedValue({ success: true })

            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false } },
            })
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

            const wrapper = ({ children }) =>
                createElement(QueryClientProvider, { client: queryClient }, children)

            const { result } = renderHook(() => useDeleteConvertPair(), { wrapper })

            result.current.mutate('1')

            await waitFor(() => expect(result.current.isSuccess).toBe(true))

            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: currencyKeys.convertPairs() })
            expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: currencyKeys.rates() })
        })
    })
})
