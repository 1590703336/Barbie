import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    listBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    getBudgetSummary,
    getImportPreview,
    importBudgets,
} from '../../services/budgetService'
import { analyticsKeys } from '../useChartData'

// Query keys
export const budgetKeys = {
    all: ['budgets'],
    lists: () => [...budgetKeys.all, 'list'],
    list: (filters) => [...budgetKeys.lists(), filters],
    summaries: () => [...budgetKeys.all, 'summary'],
    summary: (filters) => [...budgetKeys.summaries(), filters],
}

// Queries
export function useBudgetList({ month, year, userId }) {
    return useQuery({
        queryKey: budgetKeys.list({ month, year, userId }),
        queryFn: () => listBudgets({ month, year, userId }),
        enabled: !!userId && !!month && !!year,
    })
}

export function useBudgetSummary({ month, year, userId }) {
    return useQuery({
        queryKey: budgetKeys.summary({ month, year, userId }),
        queryFn: () => getBudgetSummary({ month, year, userId }),
        enabled: !!userId && !!month && !!year,
    })
}

// Mutations
export function useCreateBudget() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createBudget,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: budgetKeys.all })
            queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
        },
    })
}

export function useUpdateBudget() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, payload }) => updateBudget(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: budgetKeys.all })
            queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
        },
    })
}

export function useDeleteBudget() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteBudget,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: budgetKeys.all })
            queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
        },
    })
}

// Import queries and mutations
export function useImportPreview({ month, year, enabled = true }) {
    return useQuery({
        queryKey: [...budgetKeys.all, 'import-preview', { month, year }],
        queryFn: () => getImportPreview({ month, year }),
        enabled: enabled && !!month && !!year,
    })
}

export function useImportBudgets() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: importBudgets,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: budgetKeys.all })
            queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
        },
    })
}
