"use client";

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowUpRight, Building2, Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { workspaceApi } from '../api';
import { Button, Card, EmptyState, Modal } from '../components/ui';
import { formatDate } from '../lib/format';
import { queryClient } from '../lib/queryClient';
import { cn } from '../lib/utils';
import { useWorkspace } from '../providers/WorkspaceProvider';

export const WorkspaceListPage = () => {
  const { workspaces } = useWorkspace();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const createMutation = useMutation({
    mutationFn: () => workspaceApi.create(name),
    onSuccess: (workspace) => {
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace created');
      router.push(`/app/workspaces/${workspace.id}`);
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between [&_h1]:font-heading [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_p]:mt-1 [&_p]:max-w-2xl [&_p]:text-muted-foreground">
        <div>
          <span className="font-mono text-[10px] font-medium uppercase tracking-[.16em] text-primary">Team command centers</span>
          <h1>Your workspaces</h1>
          <p>Each workspace has isolated projects, members, roles, and activity.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={17} /> New workspace</Button>
      </header>

      {workspaces.length === 0 ? (
        <EmptyState
          icon={<Building2 size={28} />}
          title="Create your first workspace"
          description="Start with one workspace, then invite teammates and organize work into projects."
          action={<Button onClick={() => setOpen(true)}><Plus size={17} /> Create workspace</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((workspace, index) => (
            <Link className="group flex min-h-52 flex-col justify-between rounded-xl border bg-card p-5 text-card-foreground shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md" key={workspace.id} href={`/app/workspaces/${workspace.id}`}>
              <div className="flex items-start justify-between">
                <span className={cn(
                  'grid size-11 place-items-center rounded-xl font-heading text-lg font-bold',
                  ['bg-secondary text-secondary-foreground', 'bg-sky-100 text-sky-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700'][index % 4],
                )}>
                  {workspace.name.charAt(0).toUpperCase()}
                </span>
                <ArrowUpRight size={18} />
              </div>
              <div>
                <h2>{workspace.name}</h2>
                <p>{workspace.slug}</p>
              </div>
              <div className="flex items-center justify-between border-t pt-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>{workspace.role}</span>
                <span>Created {formatDate(workspace.createdAt)}</span>
              </div>
            </Link>
          ))}
          <button className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 p-5 text-center text-muted-foreground transition-colors hover:border-primary/50 hover:bg-secondary/60 hover:text-foreground" type="button" onClick={() => setOpen(true)}>
            <Sparkles size={25} />
            <h2>Launch another workspace</h2>
            <p>Keep client, product, or team work securely separated.</p>
          </button>
        </div>
      )}

      <Card className="grid gap-6 overflow-hidden border-primary/20 bg-primary text-primary-foreground md:grid-cols-[1fr_auto] md:items-center [&_h2]:mt-2 [&_h2]:font-heading [&_h2]:text-2xl [&_p]:mt-2 [&_p]:max-w-2xl [&_p]:text-primary-foreground/70">
        <div>
          <span className="font-mono text-[10px] font-medium uppercase tracking-[.16em] text-primary">Under the hood</span>
          <h2>Multi-tenant by design, not by convention.</h2>
          <p>Every project and task query is scoped to the active workspace and protected by hierarchical RBAC.</p>
        </div>
        <div className="flex max-w-md flex-wrap gap-2 [&>span]:rounded-full [&>span]:border [&>span]:border-primary-foreground/20 [&>span]:px-3 [&>span]:py-1.5 [&>span]:font-mono [&>span]:text-[10px] [&>span]:uppercase">
          <span>Express 5</span><span>Drizzle ORM</span><span>Neon branches</span><span>Socket.IO</span>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Create a workspace" size="sm">
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate();
          }}
        >
          <label className="flex flex-col gap-2 text-sm font-medium [&>small]:font-normal [&>small]:text-muted-foreground">
            <span>Workspace name</span>
            <input className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50" value={name} minLength={3} maxLength={50} onChange={(event) => setName(event.target.value)} autoFocus />
          </label>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createMutation.isPending} disabled={name.trim().length < 3}>Create workspace</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
