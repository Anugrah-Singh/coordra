import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
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
import { commentApi, labelApi, taskApi } from '../api';
import { useAuth } from '../hooks/useAuth';
import { formatDateTime, humanize, toDateTimeLocal } from '../lib/format';
import { queryClient } from '../lib/queryClient';
import type {
  Label,
  Task,
  TaskPriority,
  TaskStatus,
  WorkspaceMember,
} from '../types/api';
import { Avatar, Badge, Button, Modal, Spinner, cn } from './ui';

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
    mutationFn: () => commentApi.create(workspaceId, projectId, task?.id ?? '', comment.trim()),
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
      description={task ? `Task #${task.id.slice(0, 8)} · Updated ${formatDateTime(task.updatedAt)}` : 'Add a work item to this project board.'}
      size={task ? 'xl' : 'lg'}
    >
      <div className={cn('task-modal-layout', !task && 'task-modal-layout--single')}>
        <form
          className="task-form form-stack"
          onSubmit={(event) => {
            event.preventDefault();
            saveMutation.mutate();
          }}
        >
          <label className="field">
            <span>Task title</span>
            <input
              value={draft.title}
              disabled={!canEdit}
              autoFocus={!task}
              onChange={(event) => setDraft((value) => ({ ...value, title: event.target.value }))}
            />
          </label>

          <label className="field">
            <span>Description</span>
            <textarea
              rows={5}
              value={draft.description}
              disabled={!canEdit}
              placeholder="Add outcome, acceptance criteria, or useful context..."
              onChange={(event) => setDraft((value) => ({ ...value, description: event.target.value }))}
            />
          </label>

          <div className="form-grid form-grid--two">
            <label className="field">
              <span>Status</span>
              <select value={draft.status} disabled={!canEdit} onChange={(event) => setDraft((value) => ({ ...value, status: event.target.value as TaskStatus }))}>
                {statuses.map((status) => <option key={status} value={status}>{humanize(status)}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Priority</span>
              <select value={draft.priority} disabled={!canEdit} onChange={(event) => setDraft((value) => ({ ...value, priority: event.target.value as TaskPriority }))}>
                {priorities.map((priority) => <option key={priority} value={priority}>{humanize(priority)}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Assignee</span>
              <select value={draft.assigneeId} disabled={!canEdit} onChange={(event) => setDraft((value) => ({ ...value, assigneeId: event.target.value }))}>
                <option value="">Unassigned</option>
                {members.map((member) => <option key={member.userId} value={member.userId}>{member.fullName} · {member.role}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Due date</span>
              <input type="datetime-local" value={draft.dueDate} disabled={!canEdit} onChange={(event) => setDraft((value) => ({ ...value, dueDate: event.target.value }))} />
            </label>
          </div>

          {task ? (
            <section className="task-label-section">
              <div className="section-label"><Tag size={15} /> Labels</div>
              <div className="label-picker">
                {workspaceLabels.map((label) => {
                  const selected = selectedLabelIds.has(label.id);
                  return (
                    <button
                      key={label.id}
                      type="button"
                      className={cn('label-pill', selected && 'label-pill--selected')}
                      disabled={!canEdit || labelMutation.isPending}
                      onClick={() => labelMutation.mutate({ label, selected })}
                    >
                      <span style={{ backgroundColor: label.color }} />
                      {label.name}
                      {selected ? <Check size={13} /> : <Plus size={13} />}
                    </button>
                  );
                })}
                {workspaceLabels.length === 0 ? <small>No workspace labels created yet.</small> : null}
              </div>
            </section>
          ) : null}

          <div className="button-row button-row--between">
            <div className="button-row">
              {task && canEdit ? (
                <>
                  <Button type="button" variant="secondary" isLoading={archiveMutation.isPending} onClick={() => archiveMutation.mutate()}>
                    {task.archivedAt ? <RotateCcw size={16} /> : <Archive size={16} />}
                    {task.archivedAt ? 'Restore' : 'Archive'}
                  </Button>
                  <Button type="button" variant="ghost" isLoading={duplicateMutation.isPending} onClick={() => duplicateMutation.mutate()}>
                    <Copy size={16} /> Duplicate
                  </Button>
                </>
              ) : null}
            </div>
            <div className="button-row">
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              {canEdit ? <Button type="submit" isLoading={saveMutation.isPending} disabled={!draft.title.trim()}>{task ? 'Save changes' : 'Create task'}</Button> : null}
            </div>
          </div>
        </form>

        {task ? (
          <aside className="task-discussion">
            <header><MessageSquare size={17} /><div><h3>Discussion</h3><p>{commentsQuery.data?.length ?? 0} comments</p></div></header>
            <div className="comment-list">
              {commentsQuery.isLoading ? <Spinner label="Loading comments" /> : null}
              {commentsQuery.data?.map((item) => {
                const author = members.find((member) => member.userId === item.authorId);
                return (
                  <article className="comment" key={item.id}>
                    <Avatar name={author?.fullName ?? 'Team member'} size="sm" />
                    <div>
                      <div className="comment__header">
                        <strong>{author?.fullName ?? 'Team member'}</strong>
                        <span>{formatDateTime(item.createdAt)}</span>
                        {item.authorId === user?.id ? (
                          <button type="button" className="icon-button icon-button--tiny" onClick={() => deleteCommentMutation.mutate(item.id)} aria-label="Delete comment"><Trash2 size={13} /></button>
                        ) : null}
                      </div>
                      <p>{item.content}</p>
                    </div>
                  </article>
                );
              })}
              {!commentsQuery.isLoading && commentsQuery.data?.length === 0 ? <div className="comment-empty">No comments yet. Start the conversation.</div> : null}
            </div>
            {canEdit ? (
              <form className="comment-composer" onSubmit={(event) => { event.preventDefault(); if (comment.trim()) commentMutation.mutate(); }}>
                <textarea rows={3} value={comment} placeholder="Write a comment..." onChange={(event) => setComment(event.target.value)} />
                <Button type="submit" size="sm" disabled={!comment.trim()} isLoading={commentMutation.isPending}><Send size={15} /> Comment</Button>
              </form>
            ) : null}
          </aside>
        ) : null}
      </div>
    </Modal>
  );
};
