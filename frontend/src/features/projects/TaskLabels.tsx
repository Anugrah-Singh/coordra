'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Plus, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { labelApi } from './projects.api';
import { cn } from '@/lib/utils';
import type { Label } from '@/types/api';

export function TaskLabels({
  workspaceId,
  projectId,
  taskId,
  labels,
  canEdit,
}: {
  workspaceId: string;
  projectId: string;
  taskId: string;
  labels: Label[];
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const queryKey = ['task-labels', workspaceId, projectId, taskId] as const;
  const query = useQuery({
    queryKey,
    queryFn: () => labelApi.listForTask(workspaceId, projectId, taskId),
  });
  const selectedIds = new Set(query.data?.map((label) => label.id) ?? []);
  const mutation = useMutation({
    mutationFn: ({ label, selected }: { label: Label; selected: boolean }) => {
      const next = new Set(selectedIds);
      if (selected) next.delete(label.id);
      else next.add(label.id);
      return labelApi.replaceForTask(workspaceId, projectId, taskId, [...next]);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey }),
    onError: (error) => toast.error(error.message),
  });

  return (
    <section className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Tag size={15} /> Labels
      </div>
      <div className="flex flex-wrap gap-2">
        {labels.map((label) => {
          const selected = selectedIds.has(label.id);
          return (
            <button
              key={label.id}
              type="button"
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50 [&>span]:size-2 [&>span]:rounded-full',
                selected && 'border-primary bg-secondary text-secondary-foreground'
              )}
              disabled={!canEdit || mutation.isPending}
              onClick={() => mutation.mutate({ label, selected })}
            >
              <span style={{ backgroundColor: label.color }} />
              {label.name}
              {selected ? <Check size={13} /> : <Plus size={13} />}
            </button>
          );
        })}
        {labels.length === 0 ? <small>No workspace labels created yet.</small> : null}
      </div>
    </section>
  );
}
