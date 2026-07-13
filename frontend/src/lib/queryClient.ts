import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status =
          typeof error === 'object' && error !== null && 'status' in error
            ? Number(error.status)
            : 0;

        if (status >= 400 && status < 500) {
          return false;
        }

        return failureCount < 2;
      },
    },
  },
});
