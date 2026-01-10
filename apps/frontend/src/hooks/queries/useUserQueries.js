import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUser, updateUser, deleteUser } from '../../services/userService'

// Query keys
export const userKeys = {
    all: ['users'],
    detail: (userId) => [...userKeys.all, 'detail', userId],
}

// Queries
export function useUser(userId) {
    return useQuery({
        queryKey: userKeys.detail(userId),
        queryFn: () => getUser(userId),
        enabled: !!userId,
    })
}

// Mutations
export function useUpdateUser() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ userId, payload }) => updateUser(userId, payload),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.userId) })
        },
    })
}

export function useDeleteUser() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all })
        },
    })
}
