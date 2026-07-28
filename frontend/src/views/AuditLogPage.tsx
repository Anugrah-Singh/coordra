"use client";

import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowRight, DatabaseZap } from 'lucide-react';
import { auditApi } from '../api';
import { Avatar, Badge, Card, EmptyState, Spinner } from '../components/ui';
import { useWorkspace } from '../providers/WorkspaceProvider';
import { formatDateTime, humanize } from '../lib/format';

export const AuditLogPage = () => {
  const { workspaceId = '', currentWorkspace } = useWorkspace();
  const canView = ['OWNER', 'ADMIN'].includes(currentWorkspace?.role ?? '');
  const logsQuery = useQuery({
    queryKey: ['audit-logs', workspaceId],
    queryFn: () => auditApi.list(workspaceId),
    enabled: canView,
  });

  if (!canView) {
    return <EmptyState icon={<Activity size={28} />} title="Admin access required" description="The audit trail is restricted to workspace owners and administrators." />;
  }

  if (logsQuery.isLoading) return <Spinner label="Loading audit trail" />;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between [&_h1]:font-heading [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_p]:mt-1 [&_p]:max-w-2xl [&_p]:text-muted-foreground">
        <div><span className="font-mono text-[10px] font-medium uppercase tracking-[.16em] text-primary">Immutable activity trail</span><h1>Audit activity</h1><p>Review who changed workspace resources and when each action occurred.</p></div>
        <Badge tone="success"><DatabaseZap size={14} /> Transactional logging</Badge>
      </header>

      {logsQuery.data?.length === 0 ? (
        <EmptyState icon={<Activity size={27} />} title="No activity recorded" description="Workspace changes will be written to the audit log." />
      ) : (
        <Card className="p-5 shadow-xs">
          <div className="flex flex-col">
            {logsQuery.data?.map((log) => (
              <article className="grid grid-cols-[auto_auto_1fr] gap-3" key={log.id}>
                <div className="flex w-3 flex-col items-center [&>span]:mt-3 [&>span]:size-2 [&>span]:rounded-full [&>span]:bg-primary [&>i]:mt-1 [&>i]:w-px [&>i]:flex-1 [&>i]:bg-border"><span /><i /></div>
                <Avatar name={log.actorName ?? 'System'} size="sm" />
                <div className="min-w-0 pb-7 [&>div:first-child]:flex [&>div:first-child]:flex-wrap [&>div:first-child]:gap-x-2 [&>div:first-child]:text-sm [&>div:first-child>span]:text-muted-foreground [&>p]:my-2 [&>p]:flex [&>p]:items-center [&>p]:gap-2 [&>small]:text-xs [&>small]:text-muted-foreground [&_details]:mt-3 [&_summary]:cursor-pointer [&_summary]:text-xs [&_summary]:font-medium">
                  <div><strong>{log.actorName ?? 'System'}</strong><span>{log.actorEmail}</span></div>
                  <p><Badge tone="neutral">{humanize(log.action)}</Badge><ArrowRight size={14} /> {humanize(log.entityType)}</p>
                  <small>{formatDateTime(log.createdAt)}</small>
                  {(log.oldValue || log.newValue) ? (
                    <details><summary>View change payload</summary><div className="mt-2 grid gap-2 lg:grid-cols-2 [&>pre]:max-h-72 [&>pre]:overflow-auto [&>pre]:rounded-lg [&>pre]:bg-foreground [&>pre]:p-3 [&>pre]:text-[11px] [&>pre]:text-background"><pre>{JSON.stringify(log.oldValue, null, 2)}</pre><pre>{JSON.stringify(log.newValue, null, 2)}</pre></div></details>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
