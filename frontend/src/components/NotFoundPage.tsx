'use client';

import { ArrowLeft, Layers3 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const NotFoundPage = () => (
  <main className="grid min-h-screen place-items-center bg-background p-4">
    <Card className="w-full max-w-lg gap-5 p-8 text-center shadow-lg [&>strong]:font-heading [&>strong]:text-7xl [&>strong]:text-primary">
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Layers3 size={23} />
      </span>
      <strong>404</strong>
      <h1>This workspace route does not exist.</h1>
      <p>The link may be outdated, or you may not have access to the resource.</p>
      <Button asChild>
        <Link href="/app">
          <ArrowLeft size={16} /> Back to workspaces
        </Link>
      </Button>
    </Card>
  </main>
);
