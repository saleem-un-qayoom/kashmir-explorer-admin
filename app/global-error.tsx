'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="antialiased bg-pashmina">
        <div className="flex h-screen items-center justify-center p-8">
          <div className="card max-w-md p-8 text-center">
            <div className="text-chinar text-4xl mb-4">!</div>
            <h1 className="font-serif text-xl font-bold mb-2">Something went wrong</h1>
            <p className="text-sm text-ink-2 mb-4">{error.message}</p>
            <button className="btn btn-primary" onClick={() => reset()}>
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
