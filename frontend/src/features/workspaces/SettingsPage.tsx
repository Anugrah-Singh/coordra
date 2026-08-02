'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AppDialog as Modal } from '@/components/shared/AppDialog';
import { LoadingButton } from '@/components/shared/LoadingButton';
import { StatusBadge as Badge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { memberApi } from '@/features/collaboration/collaboration.api';
import { useWorkspace } from '@/features/workspaces/WorkspaceProvider';
import { workspaceApi } from '@/features/workspaces/workspaces.api';
import { WorkspaceLabelsSettings } from './WorkspaceLabelsSettings';
import { WorkspaceGeneralSettings } from './WorkspaceGeneralSettings';
import { WorkspaceOwnershipSettings } from './WorkspaceOwnershipSettings';
import { WorkspaceDangerSettings } from './WorkspaceDangerSettings';

export const SettingsPage = () => {
  const queryClient = useQueryClient();
  const { workspaceId = '', currentWorkspace } = useWorkspace();
  const router = useRouter();
  const [name, setName] = useState(currentWorkspace?.name ?? '');
  const [confirmation, setConfirmation] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [newOwnerMemberId, setNewOwnerMemberId] = useState('');
  const role = currentWorkspace?.role;
  const canAdmin = ['OWNER', 'ADMIN'].includes(role ?? '');
  const isOwner = role === 'OWNER';

  useEffect(() => setName(currentWorkspace?.name ?? ''), [currentWorkspace?.name]);

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
    onSuccess: () => {
      toast.success('Workspace updated');
      refresh();
    },
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

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between [&_h1]:font-heading [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_p]:mt-1 [&_p]:max-w-2xl [&_p]:text-muted-foreground">
        <div>
          <span className="font-mono text-[10px] font-medium uppercase tracking-[.16em] text-primary">
            Configuration
          </span>
          <h1>Workspace settings</h1>
          <p>Manage identity, reusable labels, ownership, and destructive actions.</p>
        </div>
        <Badge tone="purple">{role}</Badge>
      </header>

      <div className="grid gap-4 xl:grid-cols-2">
        <WorkspaceGeneralSettings
          name={name}
          slug={currentWorkspace?.slug ?? ''}
          currentName={currentWorkspace?.name ?? ''}
          canEdit={canAdmin}
          saving={updateMutation.isPending}
          onNameChange={setName}
          onSave={() => updateMutation.mutate()}
        />
        <WorkspaceOwnershipSettings
          isOwner={isOwner}
          onTransfer={() => setTransferOpen(true)}
        />
      </div>

      <WorkspaceLabelsSettings workspaceId={workspaceId} role={role} />

      {isOwner ? (
        <WorkspaceDangerSettings
          onDelete={() => {
            setConfirmation('');
            setDeleteOpen(true);
          }}
        />
      ) : null}

      <Modal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="Transfer workspace ownership"
        description="You will become an administrator after the transfer."
        size="sm"
      >
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            transferMutation.mutate();
          }}
        >
          <label className="flex flex-col gap-2 text-sm font-medium [&>small]:font-normal [&>small]:text-muted-foreground">
            <span>New owner</span>
            <select
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
              value={newOwnerMemberId}
              onChange={(event) => setNewOwnerMemberId(event.target.value)}
            >
              <option value="">Choose a member</option>
              {membersQuery.data
                ?.filter((member) => member.role !== 'OWNER')
                .map((member) => (
                  <option key={member.membershipId} value={member.membershipId}>
                    {member.fullName} · {member.role}
                  </option>
                ))}
            </select>
          </label>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setTransferOpen(false)}>
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              disabled={!newOwnerMemberId}
              isLoading={transferMutation.isPending}
            >
              Transfer ownership
            </LoadingButton>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Permanently delete workspace"
        description={`Type “${currentWorkspace?.name}” to confirm. This cannot be undone.`}
        size="sm"
      >
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            deleteMutation.mutate();
          }}
        >
          <label className="flex flex-col gap-2 text-sm font-medium [&>small]:font-normal [&>small]:text-muted-foreground">
            <span>Confirmation</span>
            <input
              className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoFocus
            />
          </label>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              variant="danger"
              disabled={confirmation !== currentWorkspace?.name}
              isLoading={deleteMutation.isPending}
            >
              Delete forever
            </LoadingButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};
