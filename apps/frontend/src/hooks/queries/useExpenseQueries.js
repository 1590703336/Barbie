import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    listExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
} from '../../services/expenseService'
import { budgetKeys } from './useBudgetQueries'

// Query keys
export const expenseKeys = {
    all: ['expenses'],
    lists: () => [...expenseKeys.all, 'list'],
    list: (filters) => [...expenseKeys.lists(), filters],
}

// Queries
export function useExpenseList({ month, year, userId }) {
    return useQuery({
        queryKey: expenseKeys.list({ month, year, userId }),
        queryFn: () => listExpenses({ month, year, userId }),
        enabled: !!userId && !!month && !!year,
    })
}

// Mutations
export function useCreateExpense() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createExpense,
        onSuccess: () => {
            // Expenses affect budget summaries, so invalidate both
            queryClient.invalidateQueries({ queryKey: expenseKeys.all })
            queryClient.invalidateQueries({ queryKey: budgetKeys.all })
        },
    })
}

export function useUpdateExpense() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, payload }) => updateExpense(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: expenseKeys.all })
            queryClient.invalidateQueries({ queryKey: budgetKeys.all })
        },
    })
}

export function useDeleteExpense() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: expenseKeys.all })
            queryClient.invalidateQueries({ queryKey: budgetKeys.all })
        },
    })
}
