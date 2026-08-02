'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AppDialog } from '@/components/shared/AppDialog';
import { LoadingButton } from '@/components/shared/LoadingButton';
import { Button } from '@/components/ui/button';
import { workspaceApi } from '@/features/workspaces/workspaces.api';

export function WorkspaceCreateDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const queryClient = useQueryClient();
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: () => workspaceApi.create(name),
    onSuccess: (workspace) => {
      toast.success('Workspace created');
      setName('');
      onClose();
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      router.push(`/app/workspaces/${workspace.id}`);
    },
    onError: (error) => toast.error(error.message),
  });
  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title="Create a workspace"
      description="A workspace keeps projects, members, roles, and activity isolated."
      size="sm"
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <label className="flex flex-col gap-2 text-sm font-medium">
          <span>Workspace name</span>
          <input
            className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
            value={name}
            minLength={3}
            maxLength={50}
            autoFocus
            placeholder="Product engineering"
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            isLoading={mutation.isPending}
            disabled={name.trim().length < 3}
          >
            Create workspace
          </LoadingButton>
        </div>
      </form>
    </AppDialog>
  );
}
