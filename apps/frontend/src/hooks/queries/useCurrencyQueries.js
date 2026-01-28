import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    getExchangeRates,
    getAvailableCurrencies,
    getConvertPairs,
    createConvertPair,
    updateConvertPair,
    deleteConvertPair,
    getHistoricalRates,
} from '../../services/currencyService'

// Query keys
export const currencyKeys = {
    all: ['currency'],
    rates: () => [...currencyKeys.all, 'rates'],
    currencies: () => [...currencyKeys.all, 'currencies'],
    convertPairs: () => [...currencyKeys.all, 'convertPairs'],
    historicalRates: (params) => [...currencyKeys.all, 'historical', params],
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

/**
 * Hook for fetching historical exchange rates
 * @param {Object} options
 * @param {string} options.fromCurrency - Base currency
 * @param {string} options.toCurrency - Target currency
 * @param {string} options.granularity - 'weekly' | 'monthly' | 'yearly'
 */
export function useHistoricalRates({ fromCurrency, toCurrency, granularity = 'monthly' } = {}) {
    // Calculate date range based on granularity
    const getDateRange = () => {
        const end = new Date()
        const start = new Date()

        if (granularity === 'weekly') {
            start.setDate(start.getDate() - 84) // 12 weeks
        } else if (granularity === 'yearly') {
            start.setFullYear(start.getFullYear() - 5) // 5 years
        } else {
            start.setMonth(start.getMonth() - 12) // 12 months
        }

        return {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        }
    }

    const { startDate, endDate } = getDateRange()

    return useQuery({
        queryKey: currencyKeys.historicalRates({ fromCurrency, toCurrency, granularity }),
        queryFn: () => getHistoricalRates({ fromCurrency, toCurrency, startDate, endDate, granularity }),
        enabled: !!fromCurrency && !!toCurrency,
        staleTime: 60 * 60 * 1000, // 1 hour - historical data is stable
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

