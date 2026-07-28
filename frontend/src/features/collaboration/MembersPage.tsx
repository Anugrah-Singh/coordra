'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, MailPlus, MoreHorizontal, Trash2, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { AppDialog as Modal } from '@/components/shared/AppDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingButton } from '@/components/shared/LoadingButton';
import { LoadingState as Spinner } from '@/components/shared/LoadingState';
import { StatusBadge as Badge } from '@/components/shared/StatusBadge';
import { UserAvatar as Avatar } from '@/components/shared/UserAvatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { inviteApi, memberApi } from '@/features/collaboration/collaboration.api';
import { useWorkspace } from '@/features/workspaces/WorkspaceProvider';
import { formatDate, humanize } from '@/lib/format';
import type { WorkspaceMember, WorkspaceRole } from '@/types/api';

const assignableRoles: Array<Exclude<WorkspaceRole, 'OWNER'>> = [
  'ADMIN',
  'MANAGER',
  'MEMBER',
  'VIEWER',
];

const roleTone = (role: WorkspaceRole) => {
  if (role === 'OWNER') return 'purple' as const;
  if (role === 'ADMIN') return 'danger' as const;
  if (role === 'MANAGER') return 'warning' as const;
  if (role === 'MEMBER') return 'info' as const;
  return 'neutral' as const;
};

export const MembersPage = () => {
  const queryClient = useQueryClient();
  const { workspaceId = '', currentWorkspace } = useWorkspace();
  const [addOpen, setAddOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Exclude<WorkspaceRole, 'OWNER'>>('MEMBER');
  const [removeTarget, setRemoveTarget] = useState<WorkspaceMember | null>(null);
  const [demoInviteUrl, setDemoInviteUrl] = useState<string | null>(null);
  const canAdmin = ['OWNER', 'ADMIN'].includes(currentWorkspace?.role ?? '');

  const membersQuery = useQuery({
    queryKey: ['members', workspaceId],
    queryFn: () => memberApi.list(workspaceId),
  });

  const invitesQuery = useQuery({
    queryKey: ['invites', workspaceId],
    queryFn: () => inviteApi.list(workspaceId),
    enabled: canAdmin,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['members', workspaceId] });
    void queryClient.invalidateQueries({ queryKey: ['invites', workspaceId] });
  };

  const addMutation = useMutation({
    mutationFn: () => memberApi.add(workspaceId, { email, role }),
    onSuccess: () => {
      toast.success('Member added');
      setAddOpen(false);
      setEmail('');
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const inviteMutation = useMutation({
    mutationFn: () => inviteApi.create(workspaceId, { email, role }),
    onSuccess: (result) => {
      toast.success('Invitation created');
      if (result.token) {
        setDemoInviteUrl(`${window.location.origin}/invite/${result.token}`);
      } else {
        setInviteOpen(false);
      }
      setEmail('');
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({
      memberId,
      nextRole,
    }: {
      memberId: string;
      nextRole: Exclude<WorkspaceRole, 'OWNER'>;
    }) => memberApi.updateRole(workspaceId, memberId, nextRole),
    onSuccess: () => {
      toast.success('Member role updated');
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => memberApi.remove(workspaceId, memberId),
    onSuccess: () => {
      toast.success('Member removed');
      setRemoveTarget(null);
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteInviteMutation = useMutation({
    mutationFn: (inviteId: string) => inviteApi.remove(workspaceId, inviteId),
    onSuccess: () => {
      toast.success('Invitation revoked');
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  if (membersQuery.isLoading) return <Spinner label="Loading workspace members" />;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between [&_h1]:font-heading [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_p]:mt-1 [&_p]:max-w-2xl [&_p]:text-muted-foreground">
        <div>
          <span className="font-mono text-[10px] font-medium uppercase tracking-[.16em] text-primary">
            People and access
          </span>
          <h1>Workspace members</h1>
          <p>Manage team access through the workspace’s hierarchical role model.</p>
        </div>
        {canAdmin ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setEmail('');
                setRole('MEMBER');
                setInviteOpen(true);
              }}
            >
              <MailPlus size={17} /> Invite
            </Button>
            <Button
              onClick={() => {
                setEmail('');
                setRole('MEMBER');
                setAddOpen(true);
              }}
            >
              <UserPlus size={17} /> Add existing user
            </Button>
          </div>
        ) : null}
      </header>

      <Card className="overflow-hidden gap-0 shadow-xs">
        <div className="min-w-[42rem] overflow-x-auto">
          <div className="grid grid-cols-4 gap-4 border-b bg-muted/50 px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Member</span>
            <span>Role</span>
            <span>Joined</span>
            <span>Actions</span>
          </div>
          {membersQuery.data?.map((member) => (
            <div
              className="grid grid-cols-4 items-center gap-4 border-b px-5 py-4 text-sm last:border-0 hover:bg-muted/40"
              key={member.membershipId}
            >
              <div className="flex min-w-0 items-center gap-3 [&>div]:min-w-0 [&_strong]:block [&_strong]:truncate [&_span]:block [&_span]:truncate [&_span]:text-xs [&_span]:text-muted-foreground">
                <Avatar name={member.fullName} />
                <div>
                  <strong>{member.fullName}</strong>
                  <span>{member.email}</span>
                </div>
              </div>
              <div>
                {canAdmin && member.role !== 'OWNER' ? (
                  <select
                    className="h-9 rounded-lg border bg-background px-3 text-sm"
                    value={member.role}
                    disabled={updateRoleMutation.isPending}
                    onChange={(event) =>
                      updateRoleMutation.mutate({
                        memberId: member.membershipId,
                        nextRole: event.target.value as Exclude<WorkspaceRole, 'OWNER'>,
                      })
                    }
                  >
                    {assignableRoles.map((item) => (
                      <option key={item} value={item}>
                        {humanize(item)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Badge tone={roleTone(member.role)}>{member.role}</Badge>
                )}
              </div>
              <span>{formatDate(member.joinedAt)}</span>
              <div>
                {canAdmin && member.role !== 'OWNER' ? (
                  <button
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    type="button"
                    onClick={() => setRemoveTarget(member)}
                    aria-label={`Remove ${member.fullName}`}
                  >
                    <Trash2 size={16} />
                  </button>
                ) : (
                  <MoreHorizontal size={17} />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {canAdmin ? (
        <section className="flex flex-col gap-4">
          <header className="flex items-end justify-between [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-semibold [&_p]:text-sm [&_p]:text-muted-foreground">
            <div>
              <h2>Pending invitations</h2>
              <p>Invitations expire automatically after seven days.</p>
            </div>
          </header>
          {(invitesQuery.data?.filter((invite) => invite.status === 'PENDING').length ??
            0) === 0 ? (
            <EmptyState
              icon={<Users size={25} />}
              title="No pending invitations"
              description="Invite a teammate when you are ready to collaborate."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {invitesQuery.data
                ?.filter((invite) => invite.status === 'PENDING')
                .map((invite) => (
                  <Card
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-4"
                    key={invite.id}
                  >
                    <div>
                      <strong>{invite.email}</strong>
                      <span>
                        <Badge tone={roleTone(invite.role)}>{invite.role}</Badge> Expires{' '}
                        {formatDate(invite.expiresAt)}
                      </span>
                    </div>
                    <button
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                      type="button"
                      onClick={() => deleteInviteMutation.mutate(invite.id)}
                      aria-label="Revoke invite"
                    >
                      <Trash2 size={16} />
                    </button>
                  </Card>
                ))}
            </div>
          )}
        </section>
      ) : null}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add an existing user"
        description="The user must already have a WorkspaceOS account."
        size="sm"
      >
        <MemberForm
          email={email}
          role={role}
          setEmail={setEmail}
          setRole={setRole}
          submitLabel="Add member"
          isLoading={addMutation.isPending}
          onCancel={() => setAddOpen(false)}
          onSubmit={() => addMutation.mutate()}
        />
      </Modal>

      <Modal
        open={inviteOpen}
        onClose={() => {
          setInviteOpen(false);
          setDemoInviteUrl(null);
        }}
        title="Invite a teammate"
        description="Create a secure, expiring workspace invitation."
        size="sm"
      >
        {demoInviteUrl ? (
          <div className="flex flex-col gap-5">
            <div className="rounded-lg border bg-muted p-3 font-mono text-xs">
              <strong>Demo invitation link</strong>
              <p>This link is only returned when DEMO_MODE is enabled.</p>
              <code>{demoInviteUrl}</code>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  void navigator.clipboard.writeText(demoInviteUrl);
                  toast.success('Invitation link copied');
                }}
              >
                <Copy size={16} /> Copy link
              </Button>
              <Button
                onClick={() => {
                  setInviteOpen(false);
                  setDemoInviteUrl(null);
                }}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <MemberForm
            email={email}
            role={role}
            setEmail={setEmail}
            setRole={setRole}
            submitLabel="Create invitation"
            isLoading={inviteMutation.isPending}
            onCancel={() => setInviteOpen(false)}
            onSubmit={() => inviteMutation.mutate()}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        title="Remove member?"
        description={`${removeTarget?.fullName ?? 'This member'} will lose access to the workspace immediately.`}
        size="sm"
      >
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="ghost" onClick={() => setRemoveTarget(null)}>
            Cancel
          </Button>
          <LoadingButton
            variant="danger"
            isLoading={removeMutation.isPending}
            onClick={() =>
              removeTarget && removeMutation.mutate(removeTarget.membershipId)
            }
          >
            Remove member
          </LoadingButton>
        </div>
      </Modal>
    </div>
  );
};

const MemberForm = ({
  email,
  role,
  setEmail,
  setRole,
  submitLabel,
  isLoading,
  onCancel,
  onSubmit,
}: {
  email: string;
  role: Exclude<WorkspaceRole, 'OWNER'>;
  setEmail: (value: string) => void;
  setRole: (value: Exclude<WorkspaceRole, 'OWNER'>) => void;
  submitLabel: string;
  isLoading: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}) => (
  <form
    className="flex flex-col gap-5"
    onSubmit={(event) => {
      event.preventDefault();
      onSubmit();
    }}
  >
    <label className="flex flex-col gap-2 text-sm font-medium [&>small]:font-normal [&>small]:text-muted-foreground">
      <span>Email address</span>
      <input
        className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoFocus
      />
    </label>
    <label className="flex flex-col gap-2 text-sm font-medium [&>small]:font-normal [&>small]:text-muted-foreground">
      <span>Workspace role</span>
      <select
        className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
        value={role}
        onChange={(event) =>
          setRole(event.target.value as Exclude<WorkspaceRole, 'OWNER'>)
        }
      >
        {assignableRoles.map((item) => (
          <option key={item} value={item}>
            {humanize(item)}
          </option>
        ))}
      </select>
    </label>
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button type="button" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
      <LoadingButton type="submit" disabled={!email.trim()} isLoading={isLoading}>
        {submitLabel}
      </LoadingButton>
    </div>
  </form>
);
