'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Bot, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { memberApi } from '@/features/collaboration/collaboration.api';
import { assistantApi } from './assistant.api';
import type { Project, PulseProposal, TaskPriority, TaskStatus } from '@/types/api';

const inputClass =
  'h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30';
const labelClass = 'grid gap-1.5 text-xs font-medium text-muted-foreground';

const toLocalInput = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export const PulseProposalCard = ({
  workspaceId,
  projects,
  proposal,
  onChange,
  onApproved,
}: {
  workspaceId: string;
  projects: Project[];
  proposal: PulseProposal;
  onChange: (proposal: PulseProposal) => void;
  onApproved: () => Promise<void>;
}) => {
  const [draft, setDraft] = useState(() => ({
    projectId: proposal.payload.projectId,
    title: proposal.payload.title ?? '',
    description: proposal.payload.description ?? '',
    status: proposal.payload.status ?? 'BACKLOG',
    priority: proposal.payload.priority ?? 'MEDIUM',
    assigneeId: proposal.payload.assigneeId ?? '',
    dueDate: toLocalInput(proposal.payload.dueDate),
    content: proposal.payload.content ?? '',
  }));

  useEffect(() => {
    setDraft({
      projectId: proposal.payload.projectId,
      title: proposal.payload.title ?? '',
      description: proposal.payload.description ?? '',
      status: proposal.payload.status ?? 'BACKLOG',
      priority: proposal.payload.priority ?? 'MEDIUM',
      assigneeId: proposal.payload.assigneeId ?? '',
      dueDate: toLocalInput(proposal.payload.dueDate),
      content: proposal.payload.content ?? '',
    });
  }, [proposal]);

  const membersQuery = useQuery({
    queryKey: ['members', workspaceId],
    queryFn: () => memberApi.list(workspaceId),
  });

  const changes = useMemo<Record<string, unknown>>(() => {
    if (proposal.actionType === 'ADD_COMMENT') return { content: draft.content };
    return {
      ...(proposal.actionType === 'CREATE_TASK' ? { projectId: draft.projectId } : {}),
      ...(draft.title ? { title: draft.title } : {}),
      description: draft.description || null,
      status: draft.status,
      priority: draft.priority,
      assigneeId: draft.assigneeId || null,
      dueDate: draft.dueDate ? new Date(draft.dueDate).toISOString() : null,
    };
  }, [draft, proposal.actionType]);

  const editMutation = useMutation({
    mutationFn: () => assistantApi.editProposal(workspaceId, proposal.id, changes),
    onSuccess: onChange,
  });
  const rejectMutation = useMutation({
    mutationFn: () => assistantApi.rejectProposal(workspaceId, proposal.id),
    onSuccess: onChange,
  });
  const approveMutation = useMutation({
    mutationFn: async () => {
      const edited = await assistantApi.editProposal(workspaceId, proposal.id, changes);
      onChange(edited);
      return assistantApi.approveProposal(workspaceId, proposal.id);
    },
    onSuccess: async (result) => {
      onChange(result.proposal);
      await onApproved();
    },
  });
  const error = editMutation.error ?? rejectMutation.error ?? approveMutation.error;
  const busy =
    editMutation.isPending || rejectMutation.isPending || approveMutation.isPending;
  const pending = proposal.status === 'PENDING';

  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-primary/25 bg-primary/5">
      <header className="flex items-start gap-3 border-b border-primary/15 p-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Bot aria-hidden="true" size={17} />
        </span>
        <div>
          <h3 className="font-heading text-sm font-semibold">
            {proposal.actionType === 'CREATE_TASK'
              ? 'Create task proposal'
              : proposal.actionType === 'UPDATE_TASK'
                ? 'Update task proposal'
                : 'Add comment proposal'}
          </h3>
          <p className="text-xs text-muted-foreground">
            Review every field. Nothing changes until you approve.
          </p>
        </div>
      </header>
      <div className="grid gap-3 p-3">
        <p className="text-xs">
          <span className="text-muted-foreground">Project:</span>{' '}
          {proposal.payload.projectName}
          {proposal.payload.taskTitle ? (
            <>
              {' · '}
              <span className="text-muted-foreground">Task:</span>{' '}
              {proposal.payload.taskTitle}
            </>
          ) : null}
        </p>

        {pending && proposal.actionType === 'CREATE_TASK' ? (
          <label className={labelClass}>
            Project
            <select
              className={inputClass}
              value={draft.projectId}
              onChange={(event) =>
                setDraft((value) => ({ ...value, projectId: event.target.value }))
              }
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {pending && proposal.actionType !== 'ADD_COMMENT' ? (
          <>
            <label className={labelClass}>
              {proposal.actionType === 'CREATE_TASK' ? 'Title' : 'New title (optional)'}
              <input
                className={inputClass}
                value={draft.title}
                onChange={(event) =>
                  setDraft((value) => ({ ...value, title: event.target.value }))
                }
              />
            </label>
            <label className={labelClass}>
              Description
              <textarea
                className={`${inputClass} min-h-20 resize-y py-2`}
                value={draft.description}
                onChange={(event) =>
                  setDraft((value) => ({ ...value, description: event.target.value }))
                }
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>
                Status
                <select
                  className={inputClass}
                  value={draft.status}
                  onChange={(event) =>
                    setDraft((value) => ({
                      ...value,
                      status: event.target.value as TaskStatus,
                    }))
                  }
                >
                  {['BACKLOG', 'TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'].map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                Priority
                <select
                  className={inputClass}
                  value={draft.priority}
                  onChange={(event) =>
                    setDraft((value) => ({
                      ...value,
                      priority: event.target.value as TaskPriority,
                    }))
                  }
                >
                  {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className={labelClass}>
              Assignee
              <select
                className={inputClass}
                value={draft.assigneeId}
                onChange={(event) =>
                  setDraft((value) => ({ ...value, assigneeId: event.target.value }))
                }
              >
                <option value="">Unassigned</option>
                {(membersQuery.data ?? []).map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.fullName}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Due date and time
              <input
                className={inputClass}
                type="datetime-local"
                value={draft.dueDate}
                onChange={(event) =>
                  setDraft((value) => ({ ...value, dueDate: event.target.value }))
                }
              />
            </label>
          </>
        ) : null}

        {pending && proposal.actionType === 'ADD_COMMENT' ? (
          <label className={labelClass}>
            Comment
            <textarea
              className={`${inputClass} min-h-24 resize-y py-2`}
              value={draft.content}
              onChange={(event) =>
                setDraft((value) => ({ ...value, content: event.target.value }))
              }
            />
          </label>
        ) : null}

        {proposal.payload.dueDate ? (
          <p className="text-xs text-muted-foreground">
            Exact due date:{' '}
            {new Intl.DateTimeFormat(undefined, {
              dateStyle: 'full',
              timeStyle: 'short',
            }).format(new Date(proposal.payload.dueDate))}
          </p>
        ) : null}
        <p aria-live="polite" className="text-xs text-destructive">
          {error?.message ?? ''}
        </p>
      </div>
      <footer className="flex flex-wrap justify-end gap-2 border-t border-primary/15 p-3">
        {pending ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => rejectMutation.mutate()}
            >
              <X aria-hidden="true" /> Reject
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => editMutation.mutate()}
            >
              Save edits
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => approveMutation.mutate()}
            >
              <Check aria-hidden="true" /> Approve
            </Button>
          </>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">
            {proposal.status === 'EXECUTED'
              ? 'Approved and completed'
              : `Proposal ${proposal.status.toLocaleLowerCase()}`}
          </span>
        )}
      </footer>
    </section>
  );
};
