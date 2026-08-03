'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { authApi } from '@/features/auth/auth.api';
import { useAuth } from '@/features/auth/AuthProvider';

export function LandingCta({ prominent = false }: { prominent?: boolean }) {
  const { user, isLoading, demo } = useAuth();
  const router = useRouter();
  const [demoLoading, setDemoLoading] = useState(false);

  const href = user ? '/app' : prominent ? '/register' : '/login';
  const label = user
    ? prominent
      ? 'Enter workspace'
      : 'Open workspace'
    : prominent
      ? 'Create an account'
      : 'Sign in';

  const handleGuestDemo = async () => {
    try {
      setDemoLoading(true);
      await demo();
      toast.success('Logged in as Guest Evaluator');
      router.push('/app');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Guest demo login failed');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        asChild
        size={prominent ? 'lg' : 'sm'}
        variant={prominent ? 'default' : 'secondary'}
      >
        <Link href={href} aria-disabled={isLoading}>
          {isLoading ? 'Checking session…' : label}{' '}
          <ArrowRight size={prominent ? 17 : 15} />
        </Link>
      </Button>
      {!user && prominent ? (
        <Button
          type="button"
          size="lg"
          variant="outline"
          disabled={demoLoading}
          onClick={handleGuestDemo}
          className="border-primary/40 bg-card/80 shadow-xs hover:border-primary hover:bg-card"
        >
          <Sparkles size={16} className="text-primary" />
          {demoLoading ? 'Launching demo…' : 'Try Live Guest Demo'}
        </Button>
      ) : null}
    </div>
  );
}
