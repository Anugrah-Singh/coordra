import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Copy, MailPlus, MoreHorizontal, Plus, Trash2, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { inviteApi, memberApi } from '../api';
import { Avatar, Badge, Button, Card, EmptyState, Modal, Spinner } from '../components/ui';
import type { AppOutletContext } from '../layouts/AppLayout';
import { formatDate, humanize } from '../lib/format';
import { queryClient } from '../lib/queryClient';
import type { WorkspaceMember, WorkspaceRole } from '../types/api';
import { useOutletContext } from 'react-router-dom';

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
  const { workspaceId = '', currentWorkspace } = useOutletContext<AppOutletContext>();
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
    mutationFn: ({ memberId, nextRole }: { memberId: string; nextRole: Exclude<WorkspaceRole, 'OWNER'> }) =>
      memberApi.updateRole(workspaceId, memberId, nextRole),
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
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">People and access</span>
          <h1>Workspace members</h1>
          <p>Manage team access through the workspace’s hierarchical role model.</p>
        </div>
        {canAdmin ? (
          <div className="button-row">
            <Button variant="secondary" onClick={() => { setEmail(''); setRole('MEMBER'); setInviteOpen(true); }}><MailPlus size={17} /> Invite</Button>
            <Button onClick={() => { setEmail(''); setRole('MEMBER'); setAddOpen(true); }}><UserPlus size={17} /> Add existing user</Button>
          </div>
        ) : null}
      </header>

      <Card className="table-card">
        <div className="data-table data-table--members">
          <div className="data-table__head"><span>Member</span><span>Role</span><span>Joined</span><span>Actions</span></div>
          {membersQuery.data?.map((member) => (
            <div className="data-table__row" key={member.membershipId}>
              <div className="member-cell"><Avatar name={member.fullName} /><div><strong>{member.fullName}</strong><span>{member.email}</span></div></div>
              <div>
                {canAdmin && member.role !== 'OWNER' ? (
                  <select
                    className="role-select"
                    value={member.role}
                    disabled={updateRoleMutation.isPending}
                    onChange={(event) => updateRoleMutation.mutate({ memberId: member.membershipId, nextRole: event.target.value as Exclude<WorkspaceRole, 'OWNER'> })}
                  >
                    {assignableRoles.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}
                  </select>
                ) : <Badge tone={roleTone(member.role)}>{member.role}</Badge>}
              </div>
              <span>{formatDate(member.joinedAt)}</span>
              <div>
                {canAdmin && member.role !== 'OWNER' ? (
                  <button className="icon-button" type="button" onClick={() => setRemoveTarget(member)} aria-label={`Remove ${member.fullName}`}><Trash2 size={16} /></button>
                ) : <MoreHorizontal size={17} />}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {canAdmin ? (
        <section className="page-stack page-stack--small">
          <header className="section-heading"><div><h2>Pending invitations</h2><p>Invitations expire automatically after seven days.</p></div></header>
          {(invitesQuery.data?.filter((invite) => invite.status === 'PENDING').length ?? 0) === 0 ? (
            <EmptyState icon={<Users size={25} />} title="No pending invitations" description="Invite a teammate when you are ready to collaborate." />
          ) : (
            <div className="invite-grid">
              {invitesQuery.data?.filter((invite) => invite.status === 'PENDING').map((invite) => (
                <Card className="pending-invite" key={invite.id}>
                  <div><strong>{invite.email}</strong><span><Badge tone={roleTone(invite.role)}>{invite.role}</Badge> Expires {formatDate(invite.expiresAt)}</span></div>
                  <button className="icon-button" type="button" onClick={() => deleteInviteMutation.mutate(invite.id)} aria-label="Revoke invite"><Trash2 size={16} /></button>
                </Card>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add an existing user" description="The user must already have a WorkspaceOS account." size="sm">
        <MemberForm email={email} role={role} setEmail={setEmail} setRole={setRole} submitLabel="Add member" isLoading={addMutation.isPending} onCancel={() => setAddOpen(false)} onSubmit={() => addMutation.mutate()} />
      </Modal>

      <Modal open={inviteOpen} onClose={() => { setInviteOpen(false); setDemoInviteUrl(null); }} title="Invite a teammate" description="Create a secure, expiring workspace invitation." size="sm">
        {demoInviteUrl ? (
          <div className="form-stack">
            <div className="demo-link-box"><strong>Demo invitation link</strong><p>This link is only returned when DEMO_MODE is enabled.</p><code>{demoInviteUrl}</code></div>
            <div className="button-row button-row--end">
              <Button variant="secondary" onClick={() => { void navigator.clipboard.writeText(demoInviteUrl); toast.success('Invitation link copied'); }}><Copy size={16} /> Copy link</Button>
              <Button onClick={() => { setInviteOpen(false); setDemoInviteUrl(null); }}>Done</Button>
            </div>
          </div>
        ) : (
          <MemberForm email={email} role={role} setEmail={setEmail} setRole={setRole} submitLabel="Create invitation" isLoading={inviteMutation.isPending} onCancel={() => setInviteOpen(false)} onSubmit={() => inviteMutation.mutate()} />
        )}
      </Modal>

      <Modal open={Boolean(removeTarget)} onClose={() => setRemoveTarget(null)} title="Remove member?" description={`${removeTarget?.fullName ?? 'This member'} will lose access to the workspace immediately.`} size="sm">
        <div className="button-row button-row--end"><Button variant="ghost" onClick={() => setRemoveTarget(null)}>Cancel</Button><Button variant="danger" isLoading={removeMutation.isPending} onClick={() => removeTarget && removeMutation.mutate(removeTarget.membershipId)}>Remove member</Button></div>
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
  <form className="form-stack" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
    <label className="field"><span>Email address</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoFocus /></label>
    <label className="field"><span>Workspace role</span><select value={role} onChange={(event) => setRole(event.target.value as Exclude<WorkspaceRole, 'OWNER'>)}>{assignableRoles.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}</select></label>
    <div className="button-row button-row--end"><Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={!email.trim()} isLoading={isLoading}>{submitLabel}</Button></div>
  </form>
);
