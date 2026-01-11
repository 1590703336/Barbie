import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    getUserSubscriptions,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    cancelSubscription,
    getTotalSubscription,
} from '../../services/subscriptionService'

// Query keys
export const subscriptionKeys = {
    all: ['subscriptions'],
    lists: () => [...subscriptionKeys.all, 'list'],
    list: (userId) => [...subscriptionKeys.lists(), userId],
    totals: () => [...subscriptionKeys.all, 'total'],
    total: (userId) => [...subscriptionKeys.totals(), userId],
}

// Queries
export function useUserSubscriptions(userId) {
    return useQuery({
        queryKey: subscriptionKeys.list(userId),
        queryFn: () => getUserSubscriptions(userId),
        enabled: !!userId,
    })
}

export function useTotalSubscription({ userId }) {
    return useQuery({
        queryKey: subscriptionKeys.total(userId),
        queryFn: () => getTotalSubscription({ userId }),
        enabled: !!userId,
    })
}

// Mutations
export function useCreateSubscription() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createSubscription,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: subscriptionKeys.all })
        },
    })
}

export function useUpdateSubscription() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, payload }) => updateSubscription(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: subscriptionKeys.all })
        },
    })
}

export function useCancelSubscription() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: cancelSubscription,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: subscriptionKeys.all })
        },
    })
}

export function useDeleteSubscription() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteSubscription,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: subscriptionKeys.all })
        },
    })
}
