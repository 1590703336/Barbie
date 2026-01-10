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
        it('should invalidate currency cache on createConvertPair', async () => {
            api.get.mockResolvedValue({ data: { data: [] } })
            api.post.mockResolvedValue({ data: { data: { _id: 'new-pair' } } })

            await getConvertPairs()
            expect(api.get).toHaveBeenCalledTimes(1)

            await createConvertPair({ fromCurrency: 'USD', toCurrency: 'EUR' })

            await getConvertPairs()
            expect(api.get).toHaveBeenCalledTimes(2)
        })

        it('should invalidate currency cache on updateConvertPair', async () => {
            api.get.mockResolvedValue({ data: { data: [] } })
            api.put.mockResolvedValue({ data: { data: {} } })

            await getConvertPairs()
            await updateConvertPair('pair-id', { toCurrency: 'GBP' })
            await getConvertPairs()

            expect(api.get).toHaveBeenCalledTimes(2)
        })

        it('should invalidate currency cache on deleteConvertPair', async () => {
            api.get.mockResolvedValue({ data: { data: [] } })
            api.delete.mockResolvedValue({ data: {} })

            await getConvertPairs()
            await deleteConvertPair('pair-id')
            await getConvertPairs()

            expect(api.get).toHaveBeenCalledTimes(2)
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
