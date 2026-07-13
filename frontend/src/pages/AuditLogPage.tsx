import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowRight, DatabaseZap } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { auditApi } from '../api';
import { Avatar, Badge, Card, EmptyState, Spinner } from '../components/ui';
import type { AppOutletContext } from '../layouts/AppLayout';
import { formatDateTime, humanize } from '../lib/format';

export const AuditLogPage = () => {
  const { workspaceId = '', currentWorkspace } = useOutletContext<AppOutletContext>();
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
    <div className="page-stack">
      <header className="page-header">
        <div><span className="eyebrow">Immutable activity trail</span><h1>Audit activity</h1><p>Review who changed workspace resources and when each action occurred.</p></div>
        <Badge tone="success"><DatabaseZap size={14} /> Transactional logging</Badge>
      </header>

      {logsQuery.data?.length === 0 ? (
        <EmptyState icon={<Activity size={27} />} title="No activity recorded" description="Workspace changes will be written to the audit log." />
      ) : (
        <Card className="timeline-card">
          <div className="timeline">
            {logsQuery.data?.map((log) => (
              <article className="timeline-item" key={log.id}>
                <div className="timeline-item__rail"><span /><i /></div>
                <Avatar name={log.actorName ?? 'System'} size="sm" />
                <div className="timeline-item__content">
                  <div><strong>{log.actorName ?? 'System'}</strong><span>{log.actorEmail}</span></div>
                  <p><Badge tone="neutral">{humanize(log.action)}</Badge><ArrowRight size={14} /> {humanize(log.entityType)}</p>
                  <small>{formatDateTime(log.createdAt)}</small>
                  {(log.oldValue || log.newValue) ? (
                    <details><summary>View change payload</summary><div className="diff-grid"><pre>{JSON.stringify(log.oldValue, null, 2)}</pre><pre>{JSON.stringify(log.newValue, null, 2)}</pre></div></details>
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
