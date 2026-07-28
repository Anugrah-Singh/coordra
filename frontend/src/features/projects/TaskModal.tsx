'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  Check,
  Copy,
  MessageSquare,
  Plus,
  RotateCcw,
  Send,
  Tag,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppDialog as Modal } from '@/components/shared/AppDialog';
import { LoadingButton } from '@/components/shared/LoadingButton';
import { LoadingState as Spinner } from '@/components/shared/LoadingState';
import { UserAvatar as Avatar } from '@/components/shared/UserAvatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { commentApi, labelApi, taskApi } from '@/features/projects/projects.api';
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
  const { user } = useAuth();
  const [draft, setDraft] = useState<TaskDraft>(() => taskToDraft(task));
  const [comment, setComment] = useState('');

  useEffect(() => {
    setDraft(taskToDraft(task));
    setComment('');
  }, [task, open]);

  const taskKey = ['tasks', workspaceId, projectId];
  const commentsKey = ['comments', workspaceId, projectId, task?.id];
  const taskLabelsKey = ['task-labels', workspaceId, projectId, task?.id];

  const commentsQuery = useQuery({
    queryKey: commentsKey,
    queryFn: () => commentApi.list(workspaceId, projectId, task?.id ?? ''),
    enabled: open && Boolean(task),
  });

  const taskLabelsQuery = useQuery({
    queryKey: taskLabelsKey,
    queryFn: () => labelApi.listForTask(workspaceId, projectId, task?.id ?? ''),
    enabled: open && Boolean(task),
  });

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
      task?.archivedAt
        ? taskApi.unarchive(workspaceId, projectId, task.id)
        : taskApi.archive(workspaceId, projectId, task?.id ?? ''),
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

  const commentMutation = useMutation({
    mutationFn: () =>
      commentApi.create(workspaceId, projectId, task?.id ?? '', comment.trim()),
    onSuccess: () => {
      setComment('');
      void queryClient.invalidateQueries({ queryKey: commentsKey });
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) =>
      commentApi.remove(workspaceId, projectId, task?.id ?? '', commentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commentsKey });
    },
    onError: (error) => toast.error(error.message),
  });

  const labelMutation = useMutation({
    mutationFn: async ({ label, selected }: { label: Label; selected: boolean }) => {
      if (!task) return;
      return selected
        ? labelApi.removeFromTask(workspaceId, projectId, task.id, label.id)
        : labelApi.addToTask(workspaceId, projectId, task.id, label.id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskLabelsKey });
    },
    onError: (error) => toast.error(error.message),
  });

  const selectedLabelIds = useMemo(
    () => new Set(taskLabelsQuery.data?.map((label) => label.id) ?? []),
    [taskLabelsQuery.data]
  );

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
            <section className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Tag size={15} /> Labels
              </div>
              <div className="flex flex-wrap gap-2">
                {workspaceLabels.map((label) => {
                  const selected = selectedLabelIds.has(label.id);
                  return (
                    <button
                      key={label.id}
                      type="button"
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50 [&>span]:size-2 [&>span]:rounded-full',
                        selected &&
                          'border-primary bg-secondary text-secondary-foreground'
                      )}
                      disabled={!canEdit || labelMutation.isPending}
                      onClick={() => labelMutation.mutate({ label, selected })}
                    >
                      <span style={{ backgroundColor: label.color }} />
                      {label.name}
                      {selected ? <Check size={13} /> : <Plus size={13} />}
                    </button>
                  );
                })}
                {workspaceLabels.length === 0 ? (
                  <small>No workspace labels created yet.</small>
                ) : null}
              </div>
            </section>
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
          <aside className="flex min-h-0 flex-col rounded-lg border bg-muted/25 [&>header]:flex [&>header]:items-center [&>header]:gap-3 [&>header]:border-b [&>header]:p-4 [&_h3]:font-semibold [&_p]:text-xs [&_p]:text-muted-foreground">
            <header>
              <MessageSquare size={17} />
              <div>
                <h3>Discussion</h3>
                <p>{commentsQuery.data?.length ?? 0} comments</p>
              </div>
            </header>
            <div className="flex max-h-[26rem] flex-col gap-4 overflow-y-auto p-4">
              {commentsQuery.isLoading ? <Spinner label="Loading comments" /> : null}
              {commentsQuery.data?.map((item) => {
                const author = members.find((member) => member.userId === item.authorId);
                return (
                  <article
                    className="grid grid-cols-[auto_1fr] gap-3 [&_p]:mt-1 [&_p]:whitespace-pre-wrap [&_p]:text-sm"
                    key={item.id}
                  >
                    <Avatar name={author?.fullName ?? 'Team member'} size="sm" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2 [&>span]:text-[10px] [&>span]:text-muted-foreground">
                        <strong>{author?.fullName ?? 'Team member'}</strong>
                        <span>{formatDateTime(item.createdAt)}</span>
                        {item.authorId === user?.id ? (
                          <button
                            type="button"
                            className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                            onClick={() => deleteCommentMutation.mutate(item.id)}
                            aria-label="Delete comment"
                          >
                            <Trash2 size={13} />
                          </button>
                        ) : null}
                      </div>
                      <p>{item.content}</p>
                    </div>
                  </article>
                );
              })}
              {!commentsQuery.isLoading && commentsQuery.data?.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No comments yet. Start the conversation.
                </div>
              ) : null}
            </div>
            {canEdit ? (
              <form
                className="flex flex-col gap-2 border-t p-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (comment.trim()) commentMutation.mutate();
                }}
              >
                <textarea
                  className="min-h-20 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                  rows={3}
                  value={comment}
                  placeholder="Write a comment..."
                  onChange={(event) => setComment(event.target.value)}
                />
                <LoadingButton
                  type="submit"
                  size="sm"
                  disabled={!comment.trim()}
                  isLoading={commentMutation.isPending}
                >
                  <Send size={15} /> Comment
                </LoadingButton>
              </form>
            ) : null}
          </aside>
        ) : null}
      </div>
    </Modal>
  );
};
