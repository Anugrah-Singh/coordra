import { Trash2, Users } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card } from '@/components/ui/card';
import { formatDate } from '@/lib/format';
import type { WorkspaceInvite, WorkspaceRole } from '@/types/api';

const roleTone = (role: WorkspaceRole) => {
  if (role === 'OWNER') return 'purple' as const;
  if (role === 'ADMIN') return 'danger' as const;
  if (role === 'MANAGER') return 'warning' as const;
  if (role === 'MEMBER') return 'info' as const;
  return 'neutral' as const;
};

export function InvitationsPanel({
  invites,
  onRevoke,
}: {
  invites: WorkspaceInvite[];
  onRevoke: (inviteId: string) => void;
}) {
  const pending = invites.filter((invite) => invite.status === 'PENDING');
  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-end justify-between [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-semibold [&_p]:text-sm [&_p]:text-muted-foreground">
        <div>
          <h2>Pending invitations</h2>
          <p>Invitations expire automatically after seven days.</p>
        </div>
      </header>
      {pending.length === 0 ? (
        <EmptyState
          icon={<Users size={25} />}
          title="No pending invitations"
          description="Invite a teammate when you are ready to collaborate."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {pending.map((invite) => (
            <Card
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-4"
              key={invite.id}
            >
              <div>
                <strong>{invite.email}</strong>
                <span>
                  <StatusBadge tone={roleTone(invite.role)}>{invite.role}</StatusBadge>{' '}
                  Expires {formatDate(invite.expiresAt)}
                </span>
              </div>
              <button
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                type="button"
                onClick={() => onRevoke(invite.id)}
                aria-label="Revoke invite"
              >
                <Trash2 size={16} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
