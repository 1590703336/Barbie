import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000, // 60 seconds - data is fresh for 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes - garbage collect after 5 minutes
            retry: 1, // Only retry once on failure
            refetchOnWindowFocus: false, // Don't refetch when window regains focus
        },
    },
})
