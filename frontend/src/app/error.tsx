'use client';
import { useEffect } from 'react';
import { ErrorPanel } from '@/components/shared/ErrorPanel';
import { Button } from '@/components/ui/button';
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-lg">
        <ErrorPanel
          message={error.message}
          action={<Button onClick={reset}>Try again</Button>}
        />
      </div>
    </main>
  );
}
