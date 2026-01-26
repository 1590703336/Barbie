import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    listIncomes,
    createIncome,
    updateIncome,
    deleteIncome,
    getIncomeSummary,
} from '../../services/incomeService'
import { analyticsKeys } from '../useChartData'

// Query keys
export const incomeKeys = {
    all: ['incomes'],
    lists: () => [...incomeKeys.all, 'list'],
    list: (filters) => [...incomeKeys.lists(), filters],
    summaries: () => [...incomeKeys.all, 'summary'],
    summary: (filters) => [...incomeKeys.summaries(), filters],
}

// Queries
export function useIncomeList({ month, year, userId }) {
    return useQuery({
        queryKey: incomeKeys.list({ month, year, userId }),
        queryFn: () => listIncomes({ month, year, userId }),
        enabled: !!userId && !!month && !!year,
    })
}

export function useIncomeSummary({ month, year, userId }) {
    return useQuery({
        queryKey: incomeKeys.summary({ month, year, userId }),
        queryFn: () => getIncomeSummary({ month, year }),
        enabled: !!month && !!year && !!userId,
    })
}

// Mutations
export function useCreateIncome() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createIncome,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: incomeKeys.all })
            queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
        },
    })
}

export function useUpdateIncome() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, payload }) => updateIncome(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: incomeKeys.all })
            queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
        },
    })
}

export function useDeleteIncome() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteIncome,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: incomeKeys.all })
            queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
        },
    })
}
