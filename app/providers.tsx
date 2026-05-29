'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';

function Fallback({ error, resetError }: { error: unknown; componentStack?: string; eventId?: string; resetError?: () => void }) {
  return (
    <div className="flex h-screen items-center justify-center bg-pashmina p-8">
      <div className="card max-w-md p-8 text-center">
        <div className="text-chinar text-4xl mb-4">!</div>
        <h1 className="font-serif text-xl font-bold mb-2">Something went wrong</h1>
        <p className="text-sm text-ink-2 mb-4">{error instanceof Error ? error.message : 'An unexpected error occurred.'}</p>
        <button className="btn btn-primary" onClick={() => resetError?.() ?? window.location.reload()}>
          Try again
        </button>
      </div>
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <Sentry.ErrorBoundary fallback={Fallback}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Sentry.ErrorBoundary>
  );
}
