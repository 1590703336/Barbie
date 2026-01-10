import { describe, it, expect, vi, beforeEach } from 'vitest'
import { simpleCache } from '../../utils/simpleCache'
import api from '../../services/api'
import {
    createIncome,
    updateIncome,
    deleteIncome,
    getIncomeSummary,
    listIncomes,
} from '../../services/incomeService'

vi.mock('../../services/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}))

describe('incomeService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        simpleCache.clear()
    })

    describe('getIncomeSummary - caching behavior', () => {
        it('should cache income summary by month/year', async () => {
            const mockData = { data: { totalIncome: 5000 } }
            api.get.mockResolvedValue({ data: mockData })

            await getIncomeSummary({ month: 1, year: 2026 })
            await getIncomeSummary({ month: 1, year: 2026 })

            expect(api.get).toHaveBeenCalledTimes(1)
        })

        it('should have separate cache entries for different months', async () => {
            api.get.mockResolvedValue({ data: { data: {} } })

            await getIncomeSummary({ month: 1, year: 2026 })
            await getIncomeSummary({ month: 2, year: 2026 })

            expect(api.get).toHaveBeenCalledTimes(2)
        })

        it('should pass signal to API for abort support', async () => {
            const controller = new AbortController()
            api.get.mockResolvedValue({ data: { data: {} } })

            await getIncomeSummary({ month: 1, year: 2026 }, { signal: controller.signal })

            expect(api.get).toHaveBeenCalledWith('/income/summary', expect.objectContaining({
                signal: controller.signal,
            }))
        })

        it('should return null if data is missing', async () => {
            api.get.mockResolvedValue({ data: {} })

            const result = await getIncomeSummary({ month: 1, year: 2026 })

            expect(result).toBeNull()
        })
    })

    describe('cache invalidation on mutations', () => {
        it('should invalidate income cache on createIncome', async () => {
            api.get.mockResolvedValue({ data: { data: { totalIncome: 5000 } } })
            api.post.mockResolvedValue({ data: { id: 'new-income' } })

            await getIncomeSummary({ month: 1, year: 2026 })
            expect(api.get).toHaveBeenCalledTimes(1)

            await createIncome({ amount: 1000, source: 'Salary' })

            await getIncomeSummary({ month: 1, year: 2026 })
            expect(api.get).toHaveBeenCalledTimes(2)
        })

        it('should invalidate income cache on updateIncome', async () => {
            api.get.mockResolvedValue({ data: { data: {} } })
            api.put.mockResolvedValue({ data: { data: {} } })

            await getIncomeSummary({ month: 1, year: 2026 })
            await updateIncome('income-id', { amount: 2000 })
            await getIncomeSummary({ month: 1, year: 2026 })

            expect(api.get).toHaveBeenCalledTimes(2)
        })

        it('should invalidate income cache on deleteIncome', async () => {
            api.get.mockResolvedValue({ data: { data: {} } })
            api.delete.mockResolvedValue({ data: {} })

            await getIncomeSummary({ month: 1, year: 2026 })
            await deleteIncome('income-id')
            await getIncomeSummary({ month: 1, year: 2026 })

            expect(api.get).toHaveBeenCalledTimes(2)
        })

        it('should only invalidate income-prefixed cache', async () => {
            api.get.mockResolvedValue({ data: { data: {} } })
            api.post.mockResolvedValue({ data: {} })

            // Add other cache entries
            await simpleCache.getOrSet('budget-summary-user1-1-2026', async () => ({ data: 'budget' }))

            await createIncome({ amount: 1000 })

            // Budget cache should still be there
            const budgetResult = await simpleCache.getOrSet('budget-summary-user1-1-2026', async () => ({ data: 'new' }))
            expect(budgetResult.data).toBe('budget')
        })
    })

    describe('listIncomes - non-cached', () => {
        it('should make API call each time', async () => {
            api.get.mockResolvedValue({ data: { data: [{ id: '1' }] } })

            await listIncomes({ month: 1, year: 2026, userId: 'user123' })
            await listIncomes({ month: 1, year: 2026, userId: 'user123' })

            expect(api.get).toHaveBeenCalledTimes(2)
        })

        it('should return empty array if data is missing', async () => {
            api.get.mockResolvedValue({ data: {} })

            const result = await listIncomes({ month: 1, year: 2026 })

            expect(result).toEqual([])
        })
    })
})
