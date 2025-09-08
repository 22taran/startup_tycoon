import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes - increased for better performance
      gcTime: 15 * 60 * 1000, // 15 minutes - increased for better caching
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false
        }
        // Retry up to 2 times for other errors (reduced from 3)
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't refetch on component mount if data is fresh
      refetchOnReconnect: false, // Don't refetch on network reconnect
    },
    mutations: {
      retry: false,
    },
  },
})
