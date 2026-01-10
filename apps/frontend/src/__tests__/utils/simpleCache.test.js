import { describe, it, expect, beforeEach, vi } from 'vitest'
import { simpleCache } from '../../utils/simpleCache'

describe('simpleCache', () => {
    beforeEach(() => {
        // Clear cache before each test
        simpleCache.clear()
    })

    describe('getOrSet', () => {
        it('should fetch and cache data on first call', async () => {
            const fetcher = vi.fn().mockResolvedValue({ data: 'test' })

            const result = await simpleCache.getOrSet('test-key', fetcher)

            expect(result).toEqual({ data: 'test' })
            expect(fetcher).toHaveBeenCalledTimes(1)
        })

        it('should return cached data on subsequent calls within TTL', async () => {
            const fetcher = vi.fn().mockResolvedValue({ data: 'test' })

            // First call - should fetch
            await simpleCache.getOrSet('test-key', fetcher)

            // Second call - should use cache
            const result = await simpleCache.getOrSet('test-key', fetcher)

            expect(result).toEqual({ data: 'test' })
            expect(fetcher).toHaveBeenCalledTimes(1) // Still only 1 call
        })

        it('should deduplicate concurrent requests (request deduplication)', async () => {
            let resolvePromise
            const fetcher = vi.fn().mockImplementation(() =>
                new Promise(resolve => { resolvePromise = resolve })
            )

            // Start multiple concurrent requests
            const promise1 = simpleCache.getOrSet('test-key', fetcher)
            const promise2 = simpleCache.getOrSet('test-key', fetcher)
            const promise3 = simpleCache.getOrSet('test-key', fetcher)

            // Resolve the promise
            resolvePromise({ data: 'test' })

            const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3])

            // All should return the same data
            expect(result1).toEqual({ data: 'test' })
            expect(result2).toEqual({ data: 'test' })
            expect(result3).toEqual({ data: 'test' })

            // But only one fetch should have been made
            expect(fetcher).toHaveBeenCalledTimes(1)
        })

        it('should refetch after TTL expires', async () => {
            vi.useFakeTimers()
            const fetcher = vi.fn()
                .mockResolvedValueOnce({ data: 'first' })
                .mockResolvedValueOnce({ data: 'second' })

            // First call
            await simpleCache.getOrSet('test-key', fetcher, null, 1000)

            // Advance time past TTL
            vi.advanceTimersByTime(1001)

            // Second call - should refetch
            const result = await simpleCache.getOrSet('test-key', fetcher, null, 1000)

            expect(result).toEqual({ data: 'second' })
            expect(fetcher).toHaveBeenCalledTimes(2)

            vi.useRealTimers()
        })

        it('should remove cache entry on fetch failure', async () => {
            const error = new Error('Fetch failed')
            const fetcher = vi.fn()
                .mockRejectedValueOnce(error)
                .mockResolvedValueOnce({ data: 'success' })

            // First call - should fail
            await expect(simpleCache.getOrSet('test-key', fetcher)).rejects.toThrow('Fetch failed')

            // Second call - should retry (not use cached error)
            const result = await simpleCache.getOrSet('test-key', fetcher)

            expect(result).toEqual({ data: 'success' })
            expect(fetcher).toHaveBeenCalledTimes(2)
        })

        it('should pass signal to fetcher for abort handling', async () => {
            const controller = new AbortController()
            const fetcher = vi.fn().mockImplementation(async () => {
                // Simulate checking the signal in a real fetcher
                if (controller.signal.aborted) {
                    throw new DOMException('Aborted', 'AbortError')
                }
                return { data: 'test' }
            })

            // Abort before the fetch
            controller.abort()

            // Should throw AbortError
            await expect(
                simpleCache.getOrSet('test-key', fetcher, controller.signal)
            ).rejects.toThrow('Aborted')

            // Cache should be cleared on error, so next call should trigger new fetch
            const fetcher2 = vi.fn().mockResolvedValue({ data: 'test2' })
            const result = await simpleCache.getOrSet('test-key', fetcher2)

            expect(result).toEqual({ data: 'test2' })
            expect(fetcher2).toHaveBeenCalledTimes(1)
        })

        it('should use custom TTL when provided', async () => {
            vi.useFakeTimers()
            const fetcher = vi.fn()
                .mockResolvedValueOnce({ data: 'first' })
                .mockResolvedValueOnce({ data: 'second' })

            // First call with 500ms TTL
            await simpleCache.getOrSet('test-key', fetcher, null, 500)

            // Advance 400ms - should still be cached
            vi.advanceTimersByTime(400)
            await simpleCache.getOrSet('test-key', fetcher)
            expect(fetcher).toHaveBeenCalledTimes(1)

            // Advance 200ms more (total 600ms) - should refetch
            vi.advanceTimersByTime(200)
            await simpleCache.getOrSet('test-key', fetcher, null, 500)
            expect(fetcher).toHaveBeenCalledTimes(2)

            vi.useRealTimers()
        })
    })

    describe('delete', () => {
        it('should remove a specific cache entry', async () => {
            const fetcher1 = vi.fn().mockResolvedValue({ data: 'key1' })
            const fetcher2 = vi.fn().mockResolvedValue({ data: 'key2' })

            await simpleCache.getOrSet('key1', fetcher1)
            await simpleCache.getOrSet('key2', fetcher2)

            // Delete key1
            simpleCache.delete('key1')

            // key1 should refetch, key2 should use cache
            await simpleCache.getOrSet('key1', fetcher1)
            await simpleCache.getOrSet('key2', fetcher2)

            expect(fetcher1).toHaveBeenCalledTimes(2)
            expect(fetcher2).toHaveBeenCalledTimes(1)
        })
    })

    describe('invalidateByPrefix', () => {
        it('should invalidate all keys matching the prefix', async () => {
            const budgetFetcher = vi.fn().mockResolvedValue({ data: 'budget' })
            const expenseFetcher = vi.fn().mockResolvedValue({ data: 'expense' })

            // Cache multiple budget entries
            await simpleCache.getOrSet('budget-summary-user1-1-2026', budgetFetcher)
            await simpleCache.getOrSet('budget-summary-user1-2-2026', budgetFetcher)
            await simpleCache.getOrSet('expense-list-user1-1-2026', expenseFetcher)

            // Invalidate all budget entries
            simpleCache.invalidateByPrefix('budget-')

            // Budget entries should refetch
            await simpleCache.getOrSet('budget-summary-user1-1-2026', budgetFetcher)
            await simpleCache.getOrSet('budget-summary-user1-2-2026', budgetFetcher)

            // Expense entry should still use cache
            await simpleCache.getOrSet('expense-list-user1-1-2026', expenseFetcher)

            expect(budgetFetcher).toHaveBeenCalledTimes(4) // 2 initial + 2 refetch
            expect(expenseFetcher).toHaveBeenCalledTimes(1) // Only initial
        })

        it('should not invalidate keys that do not match prefix', async () => {
            const fetcher = vi.fn().mockResolvedValue({ data: 'test' })

            await simpleCache.getOrSet('subscription-total-user1', fetcher)

            // Invalidate budget prefix - should not affect subscription
            simpleCache.invalidateByPrefix('budget-')

            await simpleCache.getOrSet('subscription-total-user1', fetcher)

            expect(fetcher).toHaveBeenCalledTimes(1)
        })
    })

    describe('clear', () => {
        it('should remove all cache entries', async () => {
            const fetcher = vi.fn().mockResolvedValue({ data: 'test' })

            await simpleCache.getOrSet('key1', fetcher)
            await simpleCache.getOrSet('key2', fetcher)
            await simpleCache.getOrSet('key3', fetcher)

            expect(fetcher).toHaveBeenCalledTimes(3)

            // Clear all
            simpleCache.clear()

            // All should refetch
            await simpleCache.getOrSet('key1', fetcher)
            await simpleCache.getOrSet('key2', fetcher)
            await simpleCache.getOrSet('key3', fetcher)

            expect(fetcher).toHaveBeenCalledTimes(6)
        })
    })

    describe('size', () => {
        it('should return the number of cached entries', async () => {
            const fetcher = vi.fn().mockResolvedValue({ data: 'test' })

            expect(simpleCache.size()).toBe(0)

            await simpleCache.getOrSet('key1', fetcher)
            expect(simpleCache.size()).toBe(1)

            await simpleCache.getOrSet('key2', fetcher)
            expect(simpleCache.size()).toBe(2)

            simpleCache.delete('key1')
            expect(simpleCache.size()).toBe(1)

            simpleCache.clear()
            expect(simpleCache.size()).toBe(0)
        })
    })

    describe('cache key isolation (multi-user safety)', () => {
        it('should keep separate cache entries for different userIds', async () => {
            const fetcher1 = vi.fn().mockResolvedValue({ data: 'user1-data' })
            const fetcher2 = vi.fn().mockResolvedValue({ data: 'user2-data' })

            const result1 = await simpleCache.getOrSet('budget-summary-user1-1-2026', fetcher1)
            const result2 = await simpleCache.getOrSet('budget-summary-user2-1-2026', fetcher2)

            expect(result1).toEqual({ data: 'user1-data' })
            expect(result2).toEqual({ data: 'user2-data' })
            expect(fetcher1).toHaveBeenCalledTimes(1)
            expect(fetcher2).toHaveBeenCalledTimes(1)
        })

        it('should not return wrong user data when userId differs in cache key', async () => {
            const fetcher = vi.fn()
                .mockResolvedValueOnce({ userId: 'user1', total: 100 })
                .mockResolvedValueOnce({ userId: 'user2', total: 200 })

            const result1 = await simpleCache.getOrSet('subscription-total-user1', fetcher)
            const result2 = await simpleCache.getOrSet('subscription-total-user2', fetcher)

            expect(result1.userId).toBe('user1')
            expect(result2.userId).toBe('user2')
        })
    })
})
