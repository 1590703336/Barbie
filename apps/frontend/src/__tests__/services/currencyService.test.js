import { describe, it, expect, vi, beforeEach } from 'vitest'
import { simpleCache } from '../../utils/simpleCache'
import api from '../../services/api'
import {
    getExchangeRates,
    getAvailableCurrencies,
    getConvertPairs,
    createConvertPair,
    updateConvertPair,
    deleteConvertPair,
} from '../../services/currencyService'

vi.mock('../../services/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}))

describe('currencyService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        simpleCache.clear()
    })

    describe('getExchangeRates - caching behavior', () => {
        it('should cache exchange rates', async () => {
            const mockData = { success: true, data: { USD: 1, EUR: 0.85 } }
            api.get.mockResolvedValue({ data: mockData })

            await getExchangeRates()
            await getExchangeRates()

            expect(api.get).toHaveBeenCalledTimes(1)
        })

        it('should pass signal to API for abort support', async () => {
            const controller = new AbortController()
            api.get.mockResolvedValue({ data: { success: true, data: {} } })

            await getExchangeRates({ signal: controller.signal })

            expect(api.get).toHaveBeenCalledWith('/currencies', expect.objectContaining({
                signal: controller.signal,
            }))
        })
    })

    describe('getAvailableCurrencies - caching behavior', () => {
        it('should return sorted currency codes from rates', async () => {
            const mockData = { success: true, data: { EUR: 0.85, USD: 1, GBP: 0.75 } }
            api.get.mockResolvedValue({ data: mockData })

            const currencies = await getAvailableCurrencies()

            expect(currencies).toEqual(['EUR', 'GBP', 'USD'])
        })

        it('should share cache with getExchangeRates (same API call)', async () => {
            const mockData = { success: true, data: { USD: 1, EUR: 0.85 } }
            api.get.mockResolvedValue({ data: mockData })

            // Call both functions
            await getExchangeRates()
            await getAvailableCurrencies()

            // Should only make one API call (shared cache)
            expect(api.get).toHaveBeenCalledTimes(1)
        })
    })

    describe('getConvertPairs - caching behavior', () => {
        it('should cache convert pairs', async () => {
            api.get.mockResolvedValue({ data: { data: [{ _id: '1', fromCurrency: 'USD', toCurrency: 'EUR' }] } })

            await getConvertPairs()
            await getConvertPairs()

            expect(api.get).toHaveBeenCalledTimes(1)
        })
    })

    describe('cache invalidation on mutations', () => {
        it('should only invalidate convert-pairs cache on createConvertPair, NOT rates', async () => {
            const mockRates = { success: true, data: { USD: 1, EUR: 0.85 } }
            api.get
                .mockResolvedValueOnce({ data: mockRates }) // rates
                .mockResolvedValueOnce({ data: { data: [] } }) // pairs
                .mockResolvedValueOnce({ data: { data: [] } }) // pairs refetch
            api.post.mockResolvedValue({ data: { data: { _id: 'new-pair' } } })

            // Cache both rates and pairs
            await getExchangeRates()
            await getConvertPairs()
            expect(api.get).toHaveBeenCalledTimes(2)

            // Create a pair
            await createConvertPair({ fromCurrency: 'USD', toCurrency: 'EUR' })

            // Rates should still be cached, pairs should refetch
            await getExchangeRates()
            await getConvertPairs()

            // Rates: no new call (still cached), Pairs: 1 new call
            expect(api.get).toHaveBeenCalledTimes(3)
        })

        it('should only invalidate convert-pairs cache on updateConvertPair, NOT rates', async () => {
            const mockRates = { success: true, data: { USD: 1, EUR: 0.85 } }
            api.get
                .mockResolvedValueOnce({ data: mockRates })
                .mockResolvedValueOnce({ data: { data: [] } })
                .mockResolvedValueOnce({ data: { data: [] } })
            api.put.mockResolvedValue({ data: { data: {} } })

            await getExchangeRates()
            await getConvertPairs()

            await updateConvertPair('pair-id', { toCurrency: 'GBP' })

            await getExchangeRates()
            await getConvertPairs()

            // Rates: 1 call total, Pairs: 2 calls (initial + refetch after update)
            expect(api.get).toHaveBeenCalledTimes(3)
        })

        it('should only invalidate convert-pairs cache on deleteConvertPair, NOT rates', async () => {
            const mockRates = { success: true, data: { USD: 1, EUR: 0.85 } }
            api.get
                .mockResolvedValueOnce({ data: mockRates })
                .mockResolvedValueOnce({ data: { data: [] } })
                .mockResolvedValueOnce({ data: { data: [] } })
            api.delete.mockResolvedValue({ data: {} })

            await getExchangeRates()
            await getConvertPairs()

            await deleteConvertPair('pair-id')

            await getExchangeRates()
            await getConvertPairs()

            expect(api.get).toHaveBeenCalledTimes(3)
        })

        it('should not invalidate other service caches', async () => {
            api.get.mockResolvedValue({ data: { data: [] } })
            api.post.mockResolvedValue({ data: { data: {} } })

            // Add other cache entries
            await simpleCache.getOrSet('budget-summary-user1-1-2026', async () => ({ data: 'budget' }))
            await simpleCache.getOrSet('expense-list-user1-1-2026', async () => [{ id: '1' }])

            await createConvertPair({ fromCurrency: 'USD', toCurrency: 'EUR' })

            // Other caches should still be there
            const budgetResult = await simpleCache.getOrSet('budget-summary-user1-1-2026', async () => ({ data: 'new' }))
            expect(budgetResult.data).toBe('budget')
        })
    })
})
