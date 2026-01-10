import { describe, it, expect, vi, beforeEach } from 'vitest'
import { simpleCache } from '../../utils/simpleCache'
import api from '../../services/api'
import {
    createSubscription,
    updateSubscription,
    cancelSubscription,
    deleteSubscription,
    getTotalSubscription,
    getSubscriptions,
    getUserSubscriptions,
} from '../../services/subscriptionService'

vi.mock('../../services/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}))

describe('subscriptionService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        simpleCache.clear()
    })

    describe('getTotalSubscription - caching behavior', () => {
        it('should cache total subscription by userId', async () => {
            api.get.mockResolvedValue({ data: { data: { total: 99.99 } } })

            await getTotalSubscription({ userId: 'user123' })
            await getTotalSubscription({ userId: 'user123' })

            expect(api.get).toHaveBeenCalledTimes(1)
        })

        it('should have separate cache entries for different users', async () => {
            api.get
                .mockResolvedValueOnce({ data: { data: { total: 50 } } })
                .mockResolvedValueOnce({ data: { data: { total: 100 } } })

            const result1 = await getTotalSubscription({ userId: 'user1' })
            const result2 = await getTotalSubscription({ userId: 'user2' })

            expect(api.get).toHaveBeenCalledTimes(2)
            expect(result1).toBe(50)
            expect(result2).toBe(100)
        })

        it('should use "anon" in cache key when userId is not provided', async () => {
            api.get.mockResolvedValue({ data: { data: { total: 25 } } })

            await getTotalSubscription({})
            await getTotalSubscription({})

            expect(api.get).toHaveBeenCalledTimes(1)
        })

        it('should return 0 if total is missing', async () => {
            api.get.mockResolvedValue({ data: { data: {} } })

            const result = await getTotalSubscription({ userId: 'user123' })

            expect(result).toBe(0)
        })

        it('should pass signal for abort support', async () => {
            const controller = new AbortController()
            api.get.mockResolvedValue({ data: { data: { total: 50 } } })

            await getTotalSubscription({ userId: 'user123', signal: controller.signal })

            expect(api.get).toHaveBeenCalledWith('/subscriptions/total', expect.objectContaining({
                signal: controller.signal,
            }))
        })
    })

    describe('cache invalidation on mutations', () => {
        it('should invalidate subscription cache on createSubscription', async () => {
            api.get.mockResolvedValue({ data: { data: { total: 50 } } })
            api.post.mockResolvedValue({ data: { data: { subscription: { id: 'new-sub' } } } })

            await getTotalSubscription({ userId: 'user123' })
            expect(api.get).toHaveBeenCalledTimes(1)

            await createSubscription({ name: 'Netflix', price: 15.99 })

            await getTotalSubscription({ userId: 'user123' })
            expect(api.get).toHaveBeenCalledTimes(2)
        })

        it('should invalidate subscription cache on updateSubscription', async () => {
            api.get.mockResolvedValue({ data: { data: { total: 50 } } })
            api.put.mockResolvedValue({ data: { data: {} } })

            await getTotalSubscription({ userId: 'user123' })
            await updateSubscription('sub-id', { price: 19.99 })
            await getTotalSubscription({ userId: 'user123' })

            expect(api.get).toHaveBeenCalledTimes(2)
        })

        it('should invalidate subscription cache on cancelSubscription', async () => {
            api.get.mockResolvedValue({ data: { data: { total: 50 } } })
            api.put.mockResolvedValue({ data: { data: {} } })

            await getTotalSubscription({ userId: 'user123' })
            await cancelSubscription('sub-id')
            await getTotalSubscription({ userId: 'user123' })

            expect(api.get).toHaveBeenCalledTimes(2)
        })

        it('should invalidate subscription cache on deleteSubscription', async () => {
            api.get.mockResolvedValue({ data: { data: { total: 50 } } })
            api.delete.mockResolvedValue({ data: {} })

            await getTotalSubscription({ userId: 'user123' })
            await deleteSubscription('sub-id')
            await getTotalSubscription({ userId: 'user123' })

            expect(api.get).toHaveBeenCalledTimes(2)
        })

        it('should only invalidate subscription-prefixed cache', async () => {
            api.get.mockResolvedValue({ data: { data: { total: 50 } } })
            api.post.mockResolvedValue({ data: { data: { subscription: {} } } })

            // Add other cache entries
            await simpleCache.getOrSet('budget-summary-user1-1-2026', async () => ({ data: 'budget' }))
            await simpleCache.getOrSet('income-summary-1-2026', async () => ({ data: 'income' }))

            await createSubscription({ name: 'Spotify', price: 9.99 })

            // Other caches should still be there
            const budgetResult = await simpleCache.getOrSet('budget-summary-user1-1-2026', async () => ({ data: 'new' }))
            const incomeResult = await simpleCache.getOrSet('income-summary-1-2026', async () => ({ data: 'new' }))

            expect(budgetResult.data).toBe('budget')
            expect(incomeResult.data).toBe('income')
        })
    })

    describe('non-cached operations', () => {
        it('getSubscriptions should make API call each time', async () => {
            api.get.mockResolvedValue({ data: { data: { subscriptions: [] } } })

            await getSubscriptions()
            await getSubscriptions()

            expect(api.get).toHaveBeenCalledTimes(2)
        })

        it('getUserSubscriptions should make API call each time', async () => {
            api.get.mockResolvedValue({ data: { data: { subscriptions: [] } } })

            await getUserSubscriptions('user123')
            await getUserSubscriptions('user123')

            expect(api.get).toHaveBeenCalledTimes(2)
        })
    })
})
