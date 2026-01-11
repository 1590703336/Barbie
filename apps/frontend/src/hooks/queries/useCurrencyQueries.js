import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    getExchangeRates,
    getAvailableCurrencies,
    getConvertPairs,
    createConvertPair,
    updateConvertPair,
    deleteConvertPair,
} from '../../services/currencyService'

// Query keys
export const currencyKeys = {
    all: ['currency'],
    rates: () => [...currencyKeys.all, 'rates'],
    currencies: () => [...currencyKeys.all, 'currencies'],
    convertPairs: () => [...currencyKeys.all, 'convertPairs'],
}

// Queries
export function useExchangeRates() {
    return useQuery({
        queryKey: currencyKeys.rates(),
        queryFn: getExchangeRates,
        staleTime: 5 * 60 * 1000, // 5 minutes - rates don't change frequently
    })
}

export function useAvailableCurrencies() {
    return useQuery({
        queryKey: currencyKeys.currencies(),
        queryFn: getAvailableCurrencies,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

export function useConvertPairs() {
    return useQuery({
        queryKey: currencyKeys.convertPairs(),
        queryFn: getConvertPairs,
    })
}

// Mutations
export function useCreateConvertPair() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createConvertPair,
        onSuccess: () => {
            // Only invalidate convertPairs, NOT the exchange rates
            queryClient.invalidateQueries({ queryKey: currencyKeys.convertPairs() })
        },
    })
}

export function useUpdateConvertPair() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }) => updateConvertPair(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: currencyKeys.convertPairs() })
        },
    })
}

export function useDeleteConvertPair() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteConvertPair,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: currencyKeys.convertPairs() })
        },
    })
}
