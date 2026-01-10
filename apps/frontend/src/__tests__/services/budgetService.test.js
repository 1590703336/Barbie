import { describe, it, expect, vi, beforeEach } from 'vitest'
import { simpleCache } from '../../utils/simpleCache'
import api from '../../services/api'
import {
    createBudget,
    updateBudget,
    deleteBudget,
    getBudgetSummary,
    listBudgets,
} from '../../services/budgetService'

// Mock the api module
vi.mock('../../services/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}))

describe('budgetService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        simpleCache.clear()
    })

    describe('getBudgetSummary - caching behavior', () => {
        it('should cache budget summary with userId in key', async () => {
            const mockData = { data: { totalBudget: 1000, totalExpenses: 500 } }
            api.get.mockResolvedValue({ data: mockData })

            // First call
            await getBudgetSummary({ month: 1, year: 2026, userId: 'user123' })

            // Second call with same params
            await getBudgetSummary({ month: 1, year: 2026, userId: 'user123' })

            // API should only be called once (cached)
            expect(api.get).toHaveBeenCalledTimes(1)
        })

        it('should have separate cache entries for different months', async () => {
            const mockData = { data: { totalBudget: 1000 } }
            api.get.mockResolvedValue({ data: mockData })

            await getBudgetSummary({ month: 1, year: 2026, userId: 'user123' })
            await getBudgetSummary({ month: 2, year: 2026, userId: 'user123' })

            expect(api.get).toHaveBeenCalledTimes(2)
        })

        it('should have separate cache entries for different users', async () => {
            api.get
                .mockResolvedValueOnce({ data: { data: { totalBudget: 100 } } })
                .mockResolvedValueOnce({ data: { data: { totalBudget: 200 } } })

            const result1 = await getBudgetSummary({ month: 1, year: 2026, userId: 'user1' })
            const result2 = await getBudgetSummary({ month: 1, year: 2026, userId: 'user2' })

            expect(api.get).toHaveBeenCalledTimes(2)
            expect(result1.totalBudget).toBe(100)
            expect(result2.totalBudget).toBe(200)
        })

        it('should pass signal to API call for abort support', async () => {
            const controller = new AbortController()
            api.get.mockResolvedValue({ data: { data: {} } })

            await getBudgetSummary({
                month: 1,
                year: 2026,
                userId: 'user123',
                signal: controller.signal
            })

            expect(api.get).toHaveBeenCalledWith(
                '/budgets/summary/spending-summary',
                expect.objectContaining({
                    signal: controller.signal,
                })
            )
        })
    })

    describe('cache invalidation on mutations', () => {
        it('should invalidate budget cache on createBudget', async () => {
            const mockSummary = { data: { totalBudget: 1000 } }
            api.get.mockResolvedValue({ data: mockSummary })
            api.post.mockResolvedValue({ data: { data: { id: 'new-budget' } } })

            // Cache the summary
            await getBudgetSummary({ month: 1, year: 2026, userId: 'user123' })
            expect(api.get).toHaveBeenCalledTimes(1)

            // Create new budget - should invalidate
            await createBudget({ category: 'Food', limit: 500 })

            // Fetch again - should make new API call
            await getBudgetSummary({ month: 1, year: 2026, userId: 'user123' })
            expect(api.get).toHaveBeenCalledTimes(2)
        })

        it('should invalidate budget cache on updateBudget', async () => {
            api.get.mockResolvedValue({ data: { data: {} } })
            api.put.mockResolvedValue({ data: { data: {} } })

            await getBudgetSummary({ month: 1, year: 2026, userId: 'user123' })
            await updateBudget('budget-id', { limit: 600 })
            await getBudgetSummary({ month: 1, year: 2026, userId: 'user123' })

            expect(api.get).toHaveBeenCalledTimes(2)
        })

        it('should invalidate budget cache on deleteBudget', async () => {
            api.get.mockResolvedValue({ data: { data: {} } })
            api.delete.mockResolvedValue({ data: {} })

            await getBudgetSummary({ month: 1, year: 2026, userId: 'user123' })
            await deleteBudget('budget-id')
            await getBudgetSummary({ month: 1, year: 2026, userId: 'user123' })

            expect(api.get).toHaveBeenCalledTimes(2)
        })

        it('should only invalidate budget-prefixed cache, not other services', async () => {
            api.get.mockResolvedValue({ data: { data: {} } })
            api.post.mockResolvedValue({ data: { data: {} } })

            // Simulate other cache entries
            await simpleCache.getOrSet('subscription-total-user123', async () => ({ total: 50 }))
            const initialSize = simpleCache.size()

            // Create budget
            await createBudget({ category: 'Food', limit: 500 })

            // Check subscription cache is still there
            const result = await simpleCache.getOrSet('subscription-total-user123', async () => ({ total: 999 }))
            expect(result.total).toBe(50) // Should be cached value, not new fetch
        })
    })

    describe('listBudgets - non-cached', () => {
        it('should make API call each time (not cached)', async () => {
            api.get.mockResolvedValue({ data: { data: [{ id: '1' }] } })

            await listBudgets({ month: 1, year: 2026, userId: 'user123' })
            await listBudgets({ month: 1, year: 2026, userId: 'user123' })

            expect(api.get).toHaveBeenCalledTimes(2)
        })

        it('should pass signal for abort support', async () => {
            const controller = new AbortController()
            api.get.mockResolvedValue({ data: { data: [] } })

            await listBudgets({
                month: 1,
                year: 2026,
                userId: 'user123',
                signal: controller.signal
            })

            expect(api.get).toHaveBeenCalledWith('/budgets', expect.objectContaining({
                signal: controller.signal,
            }))
        })
    })
})
