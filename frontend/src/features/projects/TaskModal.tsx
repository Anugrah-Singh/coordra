'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Archive, Copy, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { AppDialog as Modal } from '@/components/shared/AppDialog';
import { LoadingButton } from '@/components/shared/LoadingButton';
import { Button } from '@/components/ui/button';
import { TaskComments } from './TaskComments';
import { TaskLabels } from './TaskLabels';
import { taskApi } from '@/features/projects/projects.api';
import { formatDateTime, humanize, toDateTimeLocal } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Label, Task, TaskPriority, TaskStatus, WorkspaceMember } from '@/types/api';

const statuses: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'];
const priorities: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

type TaskDraft = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  dueDate: string;
};

const emptyDraft: TaskDraft = {
  title: '',
  description: '',
  status: 'BACKLOG',
  priority: 'MEDIUM',
  assigneeId: '',
  dueDate: '',
};

const taskToDraft = (task?: Task): TaskDraft =>
  task
    ? {
        title: task.title,
        description: task.description ?? '',
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId ?? '',
        dueDate: toDateTimeLocal(task.dueDate),
      }
    : emptyDraft;

export const TaskModal = ({
  open,
  onClose,
  workspaceId,
  projectId,
  task,
  members,
  workspaceLabels,
  canEdit,
}: {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  projectId: string;
  task?: Task;
  members: WorkspaceMember[];
  workspaceLabels: Label[];
  canEdit: boolean;
}) => {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<TaskDraft>(() => taskToDraft(task));

  useEffect(() => {
    setDraft(taskToDraft(task));
  }, [task, open]);

  const taskKey = ['tasks', workspaceId, projectId];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        status: draft.status,
        priority: draft.priority,
        assigneeId: draft.assigneeId || null,
        dueDate: draft.dueDate ? new Date(draft.dueDate).toISOString() : null,
      };

      return task
        ? taskApi.update(workspaceId, projectId, task.id, payload)
        : taskApi.create(workspaceId, projectId, payload);
    },
    onSuccess: () => {
      toast.success(task ? 'Task updated' : 'Task created');
      void queryClient.invalidateQueries({ queryKey: taskKey });
      void queryClient.invalidateQueries({ queryKey: ['dashboard-tasks', workspaceId] });
      onClose();
    },
    onError: (error) => toast.error(error.message),
  });

  const archiveMutation = useMutation({
    mutationFn: () =>
      taskApi.update(workspaceId, projectId, task?.id ?? '', {
        archived: !task?.archivedAt,
      }),
    onSuccess: () => {
      toast.success(task?.archivedAt ? 'Task restored' : 'Task archived');
      void queryClient.invalidateQueries({ queryKey: taskKey });
      onClose();
    },
    onError: (error) => toast.error(error.message),
  });

  const duplicateMutation = useMutation({
    mutationFn: () => taskApi.duplicate(workspaceId, projectId, task?.id ?? ''),
    onSuccess: () => {
      toast.success('Task duplicated');
      void queryClient.invalidateQueries({ queryKey: taskKey });
      onClose();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? task.title : 'Create a task'}
      description={
        task
          ? `Task #${task.id.slice(0, 8)} · Updated ${formatDateTime(task.updatedAt)}`
          : 'Add a work item to this project board.'
      }
      size={task ? 'xl' : 'lg'}
    >
      <div
        className={cn(
          'grid min-h-0 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,.65fr)]',
          !task && 'lg:grid-cols-1'
        )}
      >
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            saveMutation.mutate();
          }}
        >
          <label className="flex flex-col gap-2 text-sm font-medium [&>small]:font-normal [&>small]:text-muted-foreground">
            <span>Task title</span>
            <input
              className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
              value={draft.title}
              disabled={!canEdit}
              autoFocus={!task}
              onChange={(event) =>
                setDraft((value) => ({ ...value, title: event.target.value }))
              }
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium [&>small]:font-normal [&>small]:text-muted-foreground">
            <span>Description</span>
            <textarea
              className="min-h-20 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
              rows={5}
              value={draft.description}
              disabled={!canEdit}
              placeholder="Add outcome, acceptance criteria, or useful context..."
              onChange={(event) =>
                setDraft((value) => ({ ...value, description: event.target.value }))
              }
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium [&>small]:font-normal [&>small]:text-muted-foreground">
              <span>Status</span>
              <select
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                value={draft.status}
                disabled={!canEdit}
                onChange={(event) =>
                  setDraft((value) => ({
                    ...value,
                    status: event.target.value as TaskStatus,
                  }))
                }
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {humanize(status)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium [&>small]:font-normal [&>small]:text-muted-foreground">
              <span>Priority</span>
              <select
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                value={draft.priority}
                disabled={!canEdit}
                onChange={(event) =>
                  setDraft((value) => ({
                    ...value,
                    priority: event.target.value as TaskPriority,
                  }))
                }
              >
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {humanize(priority)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium [&>small]:font-normal [&>small]:text-muted-foreground">
              <span>Assignee</span>
              <select
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                value={draft.assigneeId}
                disabled={!canEdit}
                onChange={(event) =>
                  setDraft((value) => ({ ...value, assigneeId: event.target.value }))
                }
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.fullName} · {member.role}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium [&>small]:font-normal [&>small]:text-muted-foreground">
              <span>Due date</span>
              <input
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                type="datetime-local"
                value={draft.dueDate}
                disabled={!canEdit}
                onChange={(event) =>
                  setDraft((value) => ({ ...value, dueDate: event.target.value }))
                }
              />
            </label>
          </div>

          {task ? (
            <TaskLabels
              workspaceId={workspaceId}
              projectId={projectId}
              taskId={task.id}
              labels={workspaceLabels}
              canEdit={canEdit}
            />
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {task && canEdit ? (
                <>
                  <LoadingButton
                    type="button"
                    variant="secondary"
                    isLoading={archiveMutation.isPending}
                    onClick={() => archiveMutation.mutate()}
                  >
                    {task.archivedAt ? <RotateCcw size={16} /> : <Archive size={16} />}
                    {task.archivedAt ? 'Restore' : 'Archive'}
                  </LoadingButton>
                  <LoadingButton
                    type="button"
                    variant="ghost"
                    isLoading={duplicateMutation.isPending}
                    onClick={() => duplicateMutation.mutate()}
                  >
                    <Copy size={16} /> Duplicate
                  </LoadingButton>
                </>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              {canEdit ? (
                <LoadingButton
                  type="submit"
                  isLoading={saveMutation.isPending}
                  disabled={!draft.title.trim()}
                >
                  {task ? 'Save changes' : 'Create task'}
                </LoadingButton>
              ) : null}
            </div>
          </div>
        </form>

        {task ? (
          <TaskComments
            workspaceId={workspaceId}
            projectId={projectId}
            taskId={task.id}
            members={members}
            canEdit={canEdit}
          />
        ) : null}
      </div>
    </Modal>
  );
};
