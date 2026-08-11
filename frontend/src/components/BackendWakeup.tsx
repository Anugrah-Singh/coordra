'use client';

import { useEffect, useState } from 'react';
import { getApiBaseUrl } from '@/lib/api-client';
import { Loader2 } from 'lucide-react';

export function BackendWakeup() {
  const [isWaiting, setIsWaiting] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    const checkHealth = async () => {
      timeoutId = setTimeout(() => {
        if (isMounted) setIsWaiting(true);
      }, 1500); // 1.5 seconds delay before showing the loader

      try {
        // We don't use the standard apiClient wrapper because it has a 15s timeout
        // Render cold start might take ~50s.
        await fetch(`${getApiBaseUrl()}/health/live`);
      } catch (err) {
        // Ignore errors, if it fails completely it's fine to remove loader
      } finally {
        if (isMounted) {
          clearTimeout(timeoutId);
          setIsWaiting(false);
        }
      }
    };

    checkHealth();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  if (!isWaiting) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 text-center">
      <div className="bg-card text-card-foreground shadow-lg rounded-xl p-6 flex flex-col items-center gap-4 max-w-sm border">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Backend is waking up</h3>
          <p className="text-sm text-muted-foreground">
            Since this is hosted on a free tier (Render), it can take up to 50 seconds to spin up after inactivity. Please wait before interacting...
          </p>
        </div>
      </div>
    </div>
  );
}
