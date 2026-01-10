import { describe, it, expect, vi, beforeEach } from 'vitest'
import { simpleCache } from '../../utils/simpleCache'
import api from '../../services/api'
import {
    createExpense,
    updateExpense,
    deleteExpense,
    listExpenses,
    getExpenseById,
} from '../../services/expenseService'

vi.mock('../../services/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}))

describe('expenseService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        simpleCache.clear()
    })

    describe('listExpenses - caching behavior', () => {
        it('should cache expense list by userId/month/year', async () => {
            api.get.mockResolvedValue({ data: [{ id: '1', title: 'Lunch' }] })

            await listExpenses({ month: 1, year: 2026, userId: 'user123' })
            await listExpenses({ month: 1, year: 2026, userId: 'user123' })

            expect(api.get).toHaveBeenCalledTimes(1)
        })

        it('should have separate cache entries for different months', async () => {
            api.get.mockResolvedValue({ data: [] })

            await listExpenses({ month: 1, year: 2026, userId: 'user123' })
            await listExpenses({ month: 2, year: 2026, userId: 'user123' })

            expect(api.get).toHaveBeenCalledTimes(2)
        })

        it('should have separate cache entries for different users', async () => {
            api.get
                .mockResolvedValueOnce({ data: [{ id: '1' }] })
                .mockResolvedValueOnce({ data: [{ id: '2' }] })

            const result1 = await listExpenses({ month: 1, year: 2026, userId: 'user1' })
            const result2 = await listExpenses({ month: 1, year: 2026, userId: 'user2' })

            expect(api.get).toHaveBeenCalledTimes(2)
            expect(result1[0].id).toBe('1')
            expect(result2[0].id).toBe('2')
        })

        it('should use "anon" in cache key when userId is not provided', async () => {
            api.get.mockResolvedValue({ data: [] })

            await listExpenses({ month: 1, year: 2026 })
            await listExpenses({ month: 1, year: 2026 })

            expect(api.get).toHaveBeenCalledTimes(1)
        })

        it('should return empty array if data is missing', async () => {
            api.get.mockResolvedValue({})

            const result = await listExpenses({ month: 1, year: 2026, userId: 'user123' })

            expect(result).toEqual([])
        })

        it('should not pass signal as URL param', async () => {
            const controller = new AbortController()
            api.get.mockResolvedValue({ data: [] })

            await listExpenses({ month: 1, year: 2026, userId: 'user123' }, { signal: controller.signal })

            // Signal should be in axios config, not in params
            expect(api.get).toHaveBeenCalledWith('/expenses', {
                params: { month: 1, year: 2026, userId: 'user123' },
                signal: controller.signal,
            })
        })
    })

    describe('cache invalidation on mutations', () => {
        it('should invalidate expense cache on createExpense', async () => {
            api.get.mockResolvedValue({ data: [] })
            api.post.mockResolvedValue({ data: { id: 'new-expense' } })

            await listExpenses({ month: 1, year: 2026, userId: 'user123' })
            expect(api.get).toHaveBeenCalledTimes(1)

            await createExpense({ title: 'Dinner', amount: 50 })

            await listExpenses({ month: 1, year: 2026, userId: 'user123' })
            expect(api.get).toHaveBeenCalledTimes(2)
        })

        it('should invalidate expense cache on updateExpense', async () => {
            api.get.mockResolvedValue({ data: [] })
            api.put.mockResolvedValue({ data: {} })

            await listExpenses({ month: 1, year: 2026, userId: 'user123' })
            await updateExpense('expense-id', { amount: 75 })
            await listExpenses({ month: 1, year: 2026, userId: 'user123' })

            expect(api.get).toHaveBeenCalledTimes(2)
        })

        it('should invalidate expense cache on deleteExpense', async () => {
            api.get.mockResolvedValue({ data: [] })
            api.delete.mockResolvedValue({ data: {} })

            await listExpenses({ month: 1, year: 2026, userId: 'user123' })
            await deleteExpense('expense-id')
            await listExpenses({ month: 1, year: 2026, userId: 'user123' })

            expect(api.get).toHaveBeenCalledTimes(2)
        })

        it('should also invalidate budget cache on expense mutations (expenses affect budget summary)', async () => {
            api.get.mockResolvedValue({ data: [] })
            api.post.mockResolvedValue({ data: {} })

            // Cache a budget summary
            await simpleCache.getOrSet('budget-summary-user1-1-2026', async () => ({ totalBudget: 1000 }))

            await createExpense({ title: 'Coffee', amount: 5 })

            // Budget cache should be invalidated
            const fetcher = vi.fn().mockResolvedValue({ totalBudget: 995 })
            const result = await simpleCache.getOrSet('budget-summary-user1-1-2026', fetcher)

            expect(fetcher).toHaveBeenCalledTimes(1)
            expect(result.totalBudget).toBe(995)
        })

        it('should not invalidate unrelated caches', async () => {
            api.get.mockResolvedValue({ data: [] })
            api.post.mockResolvedValue({ data: {} })

            // Cache subscription and income
            await simpleCache.getOrSet('subscription-total-user1', async () => ({ total: 50 }))
            await simpleCache.getOrSet('income-summary-1-2026', async () => ({ totalIncome: 5000 }))

            await createExpense({ title: 'Groceries', amount: 100 })

            // Subscription and income caches should still be valid
            const subFetcher = vi.fn().mockResolvedValue({ total: 999 })
            const subResult = await simpleCache.getOrSet('subscription-total-user1', subFetcher)
            expect(subFetcher).not.toHaveBeenCalled()
            expect(subResult.total).toBe(50)

            const incomeFetcher = vi.fn().mockResolvedValue({ totalIncome: 999 })
            const incomeResult = await simpleCache.getOrSet('income-summary-1-2026', incomeFetcher)
            expect(incomeFetcher).not.toHaveBeenCalled()
            expect(incomeResult.totalIncome).toBe(5000)
        })
    })

    describe('getExpenseById - non-cached', () => {
        it('should make API call each time', async () => {
            api.get.mockResolvedValue({ data: { id: 'expense-1', title: 'Test' } })

            await getExpenseById('expense-1')
            await getExpenseById('expense-1')

            expect(api.get).toHaveBeenCalledTimes(2)
        })
    })

    describe('cross-service cache isolation', () => {
        it('should not affect other service caches when invalidating expenses', async () => {
            api.delete.mockResolvedValue({ data: {} })

            // Pre-populate all service caches
            await simpleCache.getOrSet('expense-list-user1-1-2026', async () => [{ id: 'e1' }])
            await simpleCache.getOrSet('budget-summary-user1-1-2026', async () => ({ total: 1000 }))
            await simpleCache.getOrSet('income-summary-1-2026', async () => ({ total: 5000 }))
            await simpleCache.getOrSet('subscription-total-user1', async () => ({ total: 50 }))

            expect(simpleCache.size()).toBe(4)

            await deleteExpense('some-id')

            // Should invalidate expense and budget (2), keep income and subscription (2)
            expect(simpleCache.size()).toBe(2)
        })
    })
})
