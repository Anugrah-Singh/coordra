'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, Download, Filter, Plus, Settings2, Tag } from 'lucide-react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { AppDialog as Modal } from '@/components/shared/AppDialog';
import { LoadingButton } from '@/components/shared/LoadingButton';
import { LoadingState as Spinner } from '@/components/shared/LoadingState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { memberApi } from '@/features/collaboration/collaboration.api';
import { KanbanBoard } from '@/features/projects/KanbanBoard';
import { ProjectHealthBadge } from '@/features/projects/ProjectHealthBadge';
import { labelApi, projectApi, taskApi } from '@/features/projects/projects.api';
import { TaskModal } from '@/features/projects/TaskModal';
import { useWorkspace } from '@/features/workspaces/WorkspaceProvider';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProjectBoardHeader } from '@/features/projects/ProjectBoardHeader';
import type { Task, TaskFilters, TaskPriority, TaskStatus } from '@/types/api';

export const ProjectBoardPage = () => {
  const queryClient = useQueryClient();
  const { workspaceId = '', currentWorkspace } = useWorkspace();
  const projectId = useParams<{ projectId: string }>()?.projectId ?? '';
  const searchParams = useSearchParams();
  const selectedTaskId = searchParams?.get('task') ?? null;
  const pathname =
    usePathname() ?? `/app/workspaces/${workspaceId}/projects/${projectId}`;
  const router = useRouter();
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const [labelOpen, setLabelOpen] = useState(false);
  const [labelName, setLabelName] = useState('');
  const [labelColor, setLabelColor] = useState('#6d5dfc');
  const [priority, setPriority] = useState<TaskPriority | ''>('');
  const [assigneeId, setAssigneeId] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const canEdit = currentWorkspace?.role !== 'VIEWER';

  const filters = useMemo<TaskFilters>(
    () => ({
      ...(priority ? { priority } : {}),
      ...(assigneeId ? { assigneeId } : {}),
      ...(includeArchived ? { includeArchived: true } : {}),
    }),
    [assigneeId, includeArchived, priority]
  );

  const projectQuery = useQuery({
    queryKey: ['project', workspaceId, projectId],
    queryFn: () => projectApi.get(workspaceId, projectId),
  });

  const tasksKey = ['tasks', workspaceId, projectId, filters] as const;
  const tasksQuery = useQuery({
    queryKey: tasksKey,
    queryFn: () => taskApi.list(workspaceId, projectId, filters),
  });

  const membersQuery = useQuery({
    queryKey: ['members', workspaceId],
    queryFn: () => memberApi.list(workspaceId),
  });

  const labelsQuery = useQuery({
    queryKey: ['labels', workspaceId],
    queryFn: () => labelApi.list(workspaceId),
  });

  useEffect(() => {
    const match = tasksQuery.data?.find((task) => task.id === selectedTaskId);
    if (match) setSelectedTask(match);
  }, [selectedTaskId, tasksQuery.data]);

  const statusMutation = useMutation({
    mutationFn: ({ task, status }: { task: Task; status: TaskStatus }) =>
      taskApi.update(workspaceId, projectId, task.id, { status }),
    onMutate: async ({ task, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', workspaceId, projectId] });
      const snapshots = queryClient.getQueriesData<Task[]>({
        queryKey: ['tasks', workspaceId, projectId],
      });
      snapshots.forEach(([key, data]) => {
        if (data) {
          queryClient.setQueryData<Task[]>(
            key,
            data.map((item) => (item.id === task.id ? { ...item, status } : item))
          );
        }
      });
      return { snapshots };
    },
    onError: (error, _variables, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error(error.message);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId, projectId] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard-tasks', workspaceId] });
    },
  });

  const createLabelMutation = useMutation({
    mutationFn: () =>
      labelApi.create(workspaceId, { name: labelName, color: labelColor }),
    onSuccess: () => {
      toast.success('Label created');
      setLabelName('');
      setLabelOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['labels', workspaceId] });
    },
    onError: (error) => toast.error(error.message),
  });

  const closeTaskModal = () => {
    setSelectedTask(undefined);
    setCreateOpen(false);
    if (searchParams?.has('task')) {
      const next = new URLSearchParams(searchParams.toString());
      next.delete('task');
      router.replace(next.size ? `${pathname}?${next.toString()}` : pathname);
    }
  };

  if (projectQuery.isLoading || tasksQuery.isLoading || membersQuery.isLoading) {
    return <Spinner label="Loading project board" />;
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <ProjectBoardHeader
        project={projectQuery.data}
        tasks={tasksQuery.data ?? []}
        members={membersQuery.data ?? []}
        canEdit={canEdit}
        priority={priority}
        setPriority={setPriority}
        assigneeId={assigneeId}
        setAssigneeId={setAssigneeId}
        includeArchived={includeArchived}
        setIncludeArchived={setIncludeArchived}
        onNewLabel={() => setLabelOpen(true)}
        onCreateTask={() => setCreateOpen(true)}
      />

      <KanbanBoard
        tasks={tasksQuery.data ?? []}
        members={membersQuery.data ?? []}
        readOnly={!canEdit}
        onOpenTask={(task) => {
          setSelectedTask(task);
          router.replace(`${pathname}?task=${encodeURIComponent(task.id)}`);
        }}
        onMoveTask={(task, status) => statusMutation.mutate({ task, status })}
      />

      <TaskModal
        open={createOpen || Boolean(selectedTask)}
        onClose={closeTaskModal}
        workspaceId={workspaceId}
        projectId={projectId}
        {...(selectedTask ? { task: selectedTask } : {})}
        members={membersQuery.data ?? []}
        workspaceLabels={labelsQuery.data ?? []}
        canEdit={canEdit}
      />

      <Modal
        open={labelOpen}
        onClose={() => setLabelOpen(false)}
        title="Create a workspace label"
        description="Labels can be attached to tasks in any project in this workspace."
        size="sm"
      >
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            createLabelMutation.mutate();
          }}
        >
          <label className="flex flex-col gap-2 text-sm font-medium [&>small]:font-normal [&>small]:text-muted-foreground">
            <span>Label name</span>
            <input
              className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
              value={labelName}
              maxLength={50}
              onChange={(event) => setLabelName(event.target.value)}
              autoFocus
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium [&>small]:font-normal [&>small]:text-muted-foreground">
            <span>Label color</span>
            <div className="flex items-center gap-3">
              <input
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                type="color"
                value={labelColor}
                onChange={(event) => setLabelColor(event.target.value)}
              />
              <input
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                value={labelColor}
                pattern="^#[0-9A-Fa-f]{6}$"
                onChange={(event) => setLabelColor(event.target.value)}
              />
            </div>
          </label>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setLabelOpen(false)}>
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              disabled={!labelName.trim()}
              isLoading={createLabelMutation.isPending}
            >
              Create label
            </LoadingButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};
