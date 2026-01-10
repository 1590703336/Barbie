import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import {
    subscriptionKeys,
    useUserSubscriptions,
    useTotalSubscription,
    useCreateSubscription,
    useUpdateSubscription,
    useCancelSubscription,
    useDeleteSubscription,
} from '../../../hooks/queries/useSubscriptionQueries'
import * as subscriptionService from '../../../services/subscriptionService'

// Mock the subscription service
vi.mock('../../../services/subscriptionService', () => ({
    getUserSubscriptions: vi.fn(),
    getTotalSubscription: vi.fn(),
    createSubscription: vi.fn(),
    updateSubscription: vi.fn(),
    cancelSubscription: vi.fn(),
    deleteSubscription: vi.fn(),
}))

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    })
    return ({ children }) => createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('subscriptionKeys', () => {
    it('should generate correct query keys', () => {
        expect(subscriptionKeys.all).toEqual(['subscriptions'])
        expect(subscriptionKeys.lists()).toEqual(['subscriptions', 'list'])
        expect(subscriptionKeys.list('user123')).toEqual(['subscriptions', 'list', 'user123'])
        expect(subscriptionKeys.totals()).toEqual(['subscriptions', 'total'])
        expect(subscriptionKeys.total('user123')).toEqual(['subscriptions', 'total', 'user123'])
    })
})

describe('useUserSubscriptions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should fetch subscriptions when userId is provided', async () => {
        const mockSubs = [{ _id: '1', name: 'Netflix', price: 15 }]
        subscriptionService.getUserSubscriptions.mockResolvedValue(mockSubs)

        const { result } = renderHook(
            () => useUserSubscriptions('user123'),
            { wrapper: createWrapper() }
        )

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(result.current.data).toEqual(mockSubs)
    })

    it('should not fetch when userId is missing', async () => {
        const { result } = renderHook(
            () => useUserSubscriptions(null),
            { wrapper: createWrapper() }
        )

        expect(result.current.fetchStatus).toBe('idle')
        expect(subscriptionService.getUserSubscriptions).not.toHaveBeenCalled()
    })
})

describe('useTotalSubscription', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should fetch total subscription fee', async () => {
        subscriptionService.getTotalSubscription.mockResolvedValue(100)

        const { result } = renderHook(
            () => useTotalSubscription({ userId: 'user123' }),
            { wrapper: createWrapper() }
        )

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(result.current.data).toBe(100)
    })
})

describe('useCreateSubscription', () => {
    it('should create subscription and invalidate queries', async () => {
        subscriptionService.createSubscription.mockResolvedValue({ _id: '1', name: 'Netflix' })

        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        })
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

        const wrapper = ({ children }) =>
            createElement(QueryClientProvider, { client: queryClient }, children)

        const { result } = renderHook(() => useCreateSubscription(), { wrapper })

        result.current.mutate({ name: 'Netflix', price: 15 })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: subscriptionKeys.all })
    })
})

describe('useDeleteSubscription', () => {
    it('should delete subscription and invalidate queries', async () => {
        subscriptionService.deleteSubscription.mockResolvedValue({ success: true })

        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        })
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

        const wrapper = ({ children }) =>
            createElement(QueryClientProvider, { client: queryClient }, children)

        const { result } = renderHook(() => useDeleteSubscription(), { wrapper })

        result.current.mutate('1')

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: subscriptionKeys.all })
    })
})
