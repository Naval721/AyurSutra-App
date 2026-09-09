import { QueryClient } from '@tanstack/react-query';

/**
 * Single client for the whole app. Data is served from the mock layer today, so
 * the retry count is low and refetch-on-focus is left on for the real API.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});
