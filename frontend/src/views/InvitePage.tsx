"use client";

import { useState } from 'react';
import { Check, Layers3, X } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { inviteApi } from '../api';
import { Button, Card } from '../components/ui';

export const InvitePage = () => {
  const token = useParams<{ token: string }>()?.token ?? '';
  const router = useRouter();
  const [action, setAction] = useState<'accept' | 'decline' | null>(null);

  const respond = async (nextAction: 'accept' | 'decline') => {
    setAction(nextAction);
    try {
      if (nextAction === 'accept') {
        await inviteApi.accept(token);
        toast.success('Invitation accepted');
        router.replace('/app');
      } else {
        await inviteApi.decline(token);
        toast.success('Invitation declined');
        router.replace('/app');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to process invitation');
    } finally {
      setAction(null);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-background p-4">
      <Card className="w-full max-w-xl gap-6 p-7 text-center shadow-lg">
        <Link className="inline-flex items-center gap-2.5 font-heading text-base font-bold tracking-tight" href="/app">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"><Layers3 size={20} /></span>
          <span>WorkspaceOS</span>
        </Link>
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-secondary text-secondary-foreground"><Check size={28} /></div>
        <h1>You have been invited to a workspace</h1>
        <p>
          Accept to add the workspace to your account, or decline to close the
          invitation. You must be signed in with the invited email address.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button isLoading={action === 'accept'} onClick={() => void respond('accept')}>
            <Check size={17} /> Accept invitation
          </Button>
          <Button variant="secondary" isLoading={action === 'decline'} onClick={() => void respond('decline')}>
            <X size={17} /> Decline
          </Button>
        </div>
      </Card>
    </main>
  );
};
