"use client";

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Crown, ExternalLink, Palette, ShieldAlert, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { labelApi, memberApi, workspaceApi } from '../api';
import { Badge, Button, Card, EmptyState, Modal, Spinner } from '../components/ui';
import { Button as LinkButton } from '../components/ui/button';
import { queryClient } from '../lib/queryClient';
import type { Label } from '../types/api';
import { useWorkspace } from '../providers/WorkspaceProvider';

export const SettingsPage = () => {
  const { workspaceId = '', currentWorkspace } = useWorkspace();
  const router = useRouter();
  const [name, setName] = useState(currentWorkspace?.name ?? '');
  const [confirmation, setConfirmation] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [newOwnerMemberId, setNewOwnerMemberId] = useState('');
  const [labelName, setLabelName] = useState('');
  const [labelColor, setLabelColor] = useState('#6d5dfc');
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const role = currentWorkspace?.role;
  const canAdmin = ['OWNER', 'ADMIN'].includes(role ?? '');
  const isOwner = role === 'OWNER';

  useEffect(() => setName(currentWorkspace?.name ?? ''), [currentWorkspace?.name]);

  const labelsQuery = useQuery({
    queryKey: ['labels', workspaceId],
    queryFn: () => labelApi.list(workspaceId),
  });

  const membersQuery = useQuery({
    queryKey: ['members', workspaceId],
    queryFn: () => memberApi.list(workspaceId),
    enabled: isOwner,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    void queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
  };

  const updateMutation = useMutation({
    mutationFn: () => workspaceApi.update(workspaceId, name.trim()),
    onSuccess: () => { toast.success('Workspace updated'); refresh(); },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => workspaceApi.remove(workspaceId, confirmation),
    onSuccess: () => {
      toast.success('Workspace deleted');
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      router.replace('/app');
    },
    onError: (error) => toast.error(error.message),
  });

  const transferMutation = useMutation({
    mutationFn: () => workspaceApi.transferOwner(workspaceId, newOwnerMemberId),
    onSuccess: () => {
      toast.success('Workspace ownership transferred');
      setTransferOpen(false);
      refresh();
      void queryClient.invalidateQueries({ queryKey: ['members', workspaceId] });
    },
    onError: (error) => toast.error(error.message),
  });

  const labelMutation = useMutation({
    mutationFn: () =>
      editingLabel
        ? labelApi.update(workspaceId, editingLabel.id, { name: labelName, color: labelColor })
        : labelApi.create(workspaceId, { name: labelName, color: labelColor }),
    onSuccess: () => {
      toast.success(editingLabel ? 'Label updated' : 'Label created');
      setEditingLabel(null);
      setLabelName('');
      setLabelColor('#6d5dfc');
      void queryClient.invalidateQueries({ queryKey: ['labels', workspaceId] });
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteLabelMutation = useMutation({
    mutationFn: (labelId: string) => labelApi.remove(workspaceId, labelId),
    onSuccess: () => {
      toast.success('Label deleted');
      void queryClient.invalidateQueries({ queryKey: ['labels', workspaceId] });
    },
    onError: (error) => toast.error(error.message),
  });

  if (labelsQuery.isLoading) return <Spinner label="Loading workspace settings" />;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between [&_h1]:font-heading [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_p]:mt-1 [&_p]:max-w-2xl [&_p]:text-muted-foreground">
        <div><span className="font-mono text-[10px] font-medium uppercase tracking-[.16em] text-primary">Configuration</span><h1>Workspace settings</h1><p>Manage identity, reusable labels, ownership, and destructive actions.</p></div>
        <Badge tone="purple">{role}</Badge>
      </header>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="gap-5 p-5 shadow-xs [&>header]:flex [&>header]:items-start [&>header]:justify-between [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_p]:mt-1 [&_p]:text-sm [&_p]:text-muted-foreground">
          <header><div><h2>Workspace profile</h2><p>Visible to every active workspace member.</p></div></header>
          <form className="flex flex-col gap-5" onSubmit={(event) => { event.preventDefault(); updateMutation.mutate(); }}>
            <label className="flex flex-col gap-2 text-sm font-medium [&>small]:font-normal [&>small]:text-muted-foreground"><span>Workspace name</span><input className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50" value={name} minLength={3} maxLength={50} disabled={!canAdmin} onChange={(event) => setName(event.target.value)} /></label>
            <label className="flex flex-col gap-2 text-sm font-medium [&>small]:font-normal [&>small]:text-muted-foreground"><span>Workspace slug</span><input className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50" value={currentWorkspace?.slug ?? ''} disabled /><small>Slugs remain stable so shared links do not break.</small></label>
            {canAdmin ? <div className="flex flex-wrap items-center justify-end gap-2"><Button type="submit" disabled={!name.trim() || name === currentWorkspace?.name} isLoading={updateMutation.isPending}>Save profile</Button></div> : null}
          </form>
        </Card>

        <Card className="gap-5 p-5 shadow-xs [&>header]:flex [&>header]:items-start [&>header]:justify-between [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_p]:mt-1 [&_p]:text-sm [&_p]:text-muted-foreground">
          <header><div><h2>Developer access</h2><p>Inspect the documented API used by this frontend.</p></div></header>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/35 p-4 [&_strong]:block [&_span]:block [&_span]:text-sm [&_span]:text-muted-foreground">
            <div><strong>OpenAPI / Swagger UI</strong><span>Authentication, request examples, and endpoint groups.</span></div>
            <LinkButton asChild size="sm" variant="secondary"><a href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api-docs`} target="_blank" rel="noreferrer">Open docs <ExternalLink size={15} /></a></LinkButton>
          </div>
          {isOwner ? (
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 [&_span]:block [&_span]:text-sm [&_span]:text-amber-800">
              <Crown size={22} />
              <div><strong>Workspace ownership</strong><span>Transfer the owner role to another active member.</span></div>
              <Button variant="secondary" size="sm" onClick={() => setTransferOpen(true)}>Transfer</Button>
            </div>
          ) : null}
        </Card>
      </div>

      <Card className="gap-5 p-5 shadow-xs [&>header]:flex [&>header]:items-start [&>header]:justify-between [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_p]:mt-1 [&_p]:text-sm [&_p]:text-muted-foreground">
        <header><div><h2>Workspace labels</h2><p>Create a reusable visual language for task categorization.</p></div><Palette size={20} /></header>
        {canAdmin || role === 'MANAGER' || role === 'MEMBER' ? (
          <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); labelMutation.mutate(); }}>
            <input className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50" value={labelName} maxLength={50} placeholder="Label name" onChange={(event) => setLabelName(event.target.value)} />
            <input className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50" type="color" value={labelColor} onChange={(event) => setLabelColor(event.target.value)} />
            <Button type="submit" size="sm" isLoading={labelMutation.isPending} disabled={!labelName.trim()}>{editingLabel ? 'Update label' : 'Create label'}</Button>
            {editingLabel ? <Button type="button" variant="ghost" size="sm" onClick={() => { setEditingLabel(null); setLabelName(''); setLabelColor('#6d5dfc'); }}>Cancel</Button> : null}
          </form>
        ) : null}
        {(labelsQuery.data?.length ?? 0) === 0 ? (
          <EmptyState title="No labels yet" description="Create labels such as Bug, Frontend, Customer, or High impact." />
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {labelsQuery.data?.map((label) => (
              <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-lg border p-3 [&>span]:size-3 [&>span]:rounded-full [&_strong]:block [&_small]:font-mono [&_small]:text-[10px] [&_small]:text-muted-foreground" key={label.id}>
                <span style={{ backgroundColor: label.color }} />
                <div><strong>{label.name}</strong><small>{label.color}</small></div>
                {role !== 'VIEWER' ? <Button variant="ghost" size="sm" onClick={() => { setEditingLabel(label); setLabelName(label.name); setLabelColor(label.color); }}>Edit</Button> : null}
                {['OWNER', 'ADMIN', 'MANAGER'].includes(role ?? '') ? <button className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" type="button" onClick={() => deleteLabelMutation.mutate(label.id)} aria-label={`Delete ${label.name}`}><Trash2 size={15} /></button> : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      {isOwner ? (
        <Card className="flex flex-col gap-4 border-destructive/35 bg-destructive/5 p-5 sm:flex-row sm:items-center sm:justify-between [&>div]:flex [&>div]:gap-3 [&_h2]:font-heading [&_h2]:font-semibold [&_p]:mt-1 [&_p]:max-w-3xl [&_p]:text-sm [&_p]:text-muted-foreground">
          <div><ShieldAlert size={22} /><div><h2>Danger zone</h2><p>Deleting a workspace permanently removes its projects, tasks, comments, labels, memberships, notifications, invitations, and audit records.</p></div></div>
          <Button variant="danger" onClick={() => { setConfirmation(''); setDeleteOpen(true); }}><Trash2 size={16} /> Delete workspace</Button>
        </Card>
      ) : null}

      <Modal open={transferOpen} onClose={() => setTransferOpen(false)} title="Transfer workspace ownership" description="You will become an administrator after the transfer." size="sm">
        <form className="flex flex-col gap-5" onSubmit={(event) => { event.preventDefault(); transferMutation.mutate(); }}>
          <label className="flex flex-col gap-2 text-sm font-medium [&>small]:font-normal [&>small]:text-muted-foreground"><span>New owner</span><select className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50" value={newOwnerMemberId} onChange={(event) => setNewOwnerMemberId(event.target.value)}><option value="">Choose a member</option>{membersQuery.data?.filter((member) => member.role !== 'OWNER').map((member) => <option key={member.membershipId} value={member.membershipId}>{member.fullName} · {member.role}</option>)}</select></label>
          <div className="flex flex-wrap items-center justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setTransferOpen(false)}>Cancel</Button><Button type="submit" disabled={!newOwnerMemberId} isLoading={transferMutation.isPending}>Transfer ownership</Button></div>
        </form>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Permanently delete workspace" description={`Type “${currentWorkspace?.name}” to confirm. This cannot be undone.`} size="sm">
        <form className="flex flex-col gap-5" onSubmit={(event) => { event.preventDefault(); deleteMutation.mutate(); }}>
          <label className="flex flex-col gap-2 text-sm font-medium [&>small]:font-normal [&>small]:text-muted-foreground"><span>Confirmation</span><input className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoFocus /></label>
          <div className="flex flex-wrap items-center justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button type="submit" variant="danger" disabled={confirmation !== currentWorkspace?.name} isLoading={deleteMutation.isPending}>Delete forever</Button></div>
        </form>
      </Modal>
    </div>
  );
};
