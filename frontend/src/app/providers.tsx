'use client';

import { type PropsWithChildren, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BackendWakeup } from '@/components/BackendWakeup';

export function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
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
      })
  );
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AppErrorBoundary>{children}</AppErrorBoundary>
        </TooltipProvider>
        <Toaster position="top-right" richColors closeButton />
        <BackendWakeup />
      </AuthProvider>
    </QueryClientProvider>
  );
}
