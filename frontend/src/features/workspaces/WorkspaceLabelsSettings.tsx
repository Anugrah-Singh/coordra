'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Palette, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingButton } from '@/components/shared/LoadingButton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { labelApi } from '@/features/projects/projects.api';
import type { Label, WorkspaceRole } from '@/types/api';

export function WorkspaceLabelsSettings({
  workspaceId,
  role,
}: {
  workspaceId: string;
  role?: WorkspaceRole;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6d5dfc');
  const [editing, setEditing] = useState<Label | null>(null);
  const queryKey = ['labels', workspaceId] as const;
  const query = useQuery({ queryKey, queryFn: () => labelApi.list(workspaceId) });
  const reset = () => {
    setEditing(null);
    setName('');
    setColor('#6d5dfc');
  };
  const mutation = useMutation({
    mutationFn: () =>
      editing
        ? labelApi.update(workspaceId, editing.id, { name, color })
        : labelApi.create(workspaceId, { name, color }),
    onSuccess: () => {
      toast.success(editing ? 'Label updated' : 'Label created');
      reset();
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: (labelId: string) => labelApi.remove(workspaceId, labelId),
    onSuccess: () => {
      toast.success('Label deleted');
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => toast.error(error.message),
  });
  const canEdit = role !== 'VIEWER';
  return (
    <Card className="gap-5 p-5 shadow-xs [&>header]:flex [&>header]:items-start [&>header]:justify-between [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_p]:mt-1 [&_p]:text-sm [&_p]:text-muted-foreground">
      <header>
        <div>
          <h2>Workspace labels</h2>
          <p>Create a reusable visual language for task categorization.</p>
        </div>
        <Palette size={20} />
      </header>
      {canEdit ? (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <input
            className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
            value={name}
            maxLength={50}
            placeholder="Label name"
            onChange={(event) => setName(event.target.value)}
          />
          <input
            className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
          />
          <LoadingButton
            type="submit"
            size="sm"
            isLoading={mutation.isPending}
            disabled={!name.trim()}
          >
            {editing ? 'Update label' : 'Create label'}
          </LoadingButton>
          {editing ? (
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              Cancel
            </Button>
          ) : null}
        </form>
      ) : null}
      {(query.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="No labels yet"
          description="Create labels such as Bug, Frontend, Customer, or High impact."
        />
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {query.data?.map((label) => (
            <div
              className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-lg border p-3"
              key={label.id}
            >
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: label.color }}
              />
              <div>
                <strong className="block">{label.name}</strong>
                <small className="font-mono text-[10px] text-muted-foreground">
                  {label.color}
                </small>
              </div>
              {canEdit ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(label);
                    setName(label.name);
                    setColor(label.color);
                  }}
                >
                  Edit
                </Button>
              ) : null}
              {['OWNER', 'ADMIN', 'MANAGER'].includes(role ?? '') ? (
                <button
                  className="inline-flex size-9 items-center justify-center"
                  type="button"
                  onClick={() => remove.mutate(label.id)}
                  aria-label={`Delete ${label.name}`}
                >
                  <Trash2 size={15} />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
