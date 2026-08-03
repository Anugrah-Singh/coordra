'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles, Trash2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useWorkspace } from '@/features/workspaces/WorkspaceProvider';
import { PulseMessage } from './PulseMessage';
import { PulseProposalCard } from './PulseProposal';
import { usePulse } from './usePulse';

export const PulseDrawer = () => {
  const { workspaceId = '', currentWorkspace, projects } = useWorkspace();
  const projectId = useParams<{ projectId?: string }>()?.projectId;
  const project = projects.find((item) => item.id === projectId);

  const starters = project
    ? [
        `Summarize risks for ${project.name}`,
        `Find unassigned tasks in ${project.name}`,
        `Check blockers in ${project.name}`,
        `What changed recently in ${project.name}?`,
      ]
    : [
        'Which tasks are overdue in this workspace?',
        'Summarize project risks across all projects',
        'Who has the heaviest active workload?',
        'What changed recently in the workspace?',
      ];
  const pulse = usePulse(workspaceId, projectId);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [workspaceId]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [pulse.messages, pulse.isSending]);

  if (!workspaceId || pulse.statusLoading || !pulse.enabled) return null;

  const submit = (message = draft) => {
    const value = message.trim();
    if (!value || pulse.isSending) return;
    setDraft('');
    pulse.send(value);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="hidden sm:inline-flex">
          <Sparkles aria-hidden="true" /> Ask Pulse
        </Button>
      </DialogTrigger>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="sm:hidden"
          aria-label="Ask Pulse"
        >
          <Sparkles aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="inset-0 top-0 left-auto flex h-dvh max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 sm:right-0 sm:left-auto sm:w-[30rem] sm:max-w-[calc(100vw-1rem)] sm:border-l"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <DialogHeader className="border-b px-5 py-4 pr-12">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Bot aria-hidden="true" size={19} />
            </span>
            <div>
              <DialogTitle>Pulse</DialogTitle>
              <DialogDescription>
                {currentWorkspace?.name}
                {project ? ` · ${project.name}` : ' · Workspace view'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
          {pulse.messages.length === 0 ? (
            <div className="grid min-h-full content-center gap-6">
              <div className="mx-auto max-w-sm text-center">
                <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
                  <Sparkles aria-hidden="true" size={20} />
                </span>
                <h2 className="mt-4 font-heading text-xl font-semibold">
                  Coordinate with workspace facts
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Ask about projects, people, priorities, or risks. Pulse only prepares
                  changes for your approval.
                </p>
              </div>
              <div className="grid gap-2" aria-label="Starter prompts">
                {starters.map((starter) => (
                  <Button
                    className="card-hover-lift h-auto justify-start whitespace-normal rounded-xl border-border/70 bg-card/80 px-3.5 py-3 text-left transition-all hover:border-primary/50 hover:bg-card hover:shadow-xs"
                    key={starter}
                    type="button"
                    variant="outline"
                    onClick={() => submit(starter)}
                  >
                    <span className="flex items-center gap-2 text-xs font-medium text-foreground/90">
                      <Sparkles size={13} className="text-primary shrink-0" />
                      {starter}
                    </span>
                  </Button>
                ))}
              </div>
              {currentWorkspace?.role === 'VIEWER' ? (
                <p className="rounded-lg border bg-muted p-3 text-xs text-muted-foreground">
                  Viewer access is read-only. Pulse can answer questions but cannot
                  prepare action proposals for this role.
                </p>
              ) : null}
            </div>
          ) : (
            <ol className="space-y-4" aria-label="Pulse conversation">
              {pulse.messages.map((message) => (
                <PulseMessage key={message.id} message={message} onRetry={submit}>
                  {message.proposal ? (
                    <PulseProposalCard
                      workspaceId={workspaceId}
                      projects={projects}
                      proposal={message.proposal}
                      onChange={pulse.replaceProposal}
                      onApproved={pulse.invalidateAfterApproval}
                    />
                  ) : null}
                </PulseMessage>
              ))}
            </ol>
          )}
          <div ref={endRef} />
        </div>

        <form
          className="border-t bg-background p-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <div className="flex items-end gap-2 rounded-xl border bg-card p-2 shadow-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20">
            <label className="sr-only" htmlFor="pulse-message">
              Message Pulse
            </label>
            <textarea
              ref={inputRef}
              id="pulse-message"
              className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
              rows={1}
              maxLength={2000}
              placeholder="Ask about work or prepare a change…"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              aria-describedby="pulse-input-help"
              aria-busy={pulse.isSending}
            />
            <Button
              type="submit"
              size="icon-lg"
              disabled={!draft.trim() || pulse.isSending}
              aria-label="Send message"
            >
              <Send aria-hidden="true" />
            </Button>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p id="pulse-input-help" className="text-xs text-muted-foreground">
              Enter to send · Shift+Enter for a new line
            </p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={pulse.messages.length === 0}
              onClick={pulse.clear}
            >
              <Trash2 aria-hidden="true" /> Clear
            </Button>
          </div>
          <p className="sr-only" role="status" aria-live="polite">
            {pulse.isSending ? 'Pulse is reviewing workspace information' : ''}
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};
