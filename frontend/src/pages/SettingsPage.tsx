import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Crown, ExternalLink, Palette, ShieldAlert, Trash2 } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { labelApi, memberApi, workspaceApi } from '../api';
import { Badge, Button, Card, EmptyState, Modal, Spinner } from '../components/ui';
import type { AppOutletContext } from '../layouts/AppLayout';
import { queryClient } from '../lib/queryClient';
import type { Label } from '../types/api';

export const SettingsPage = () => {
  const { workspaceId = '', currentWorkspace } = useOutletContext<AppOutletContext>();
  const navigate = useNavigate();
  const [name, setName] = useState(currentWorkspace?.name ?? '');
  const [confirmation, setConfirmation] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [newOwnerMemberId, setNewOwnerMemberId] = useState('');
  const [labelName, setLabelName] = useState('');
  const [labelColor, setLabelColor] = useState('#6d5dfc');
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const role = currentWorkspace?.role;
  const canAdmin = ['OWNER', 'ADMIN'].includes(role ?? '');
  const isOwner = role === 'OWNER';

  useEffect(() => setName(currentWorkspace?.name ?? ''), [currentWorkspace?.name]);

  const labelsQuery = useQuery({
    queryKey: ['labels', workspaceId],
    queryFn: () => labelApi.list(workspaceId),
  });

  const membersQuery = useQuery({
    queryKey: ['members', workspaceId],
    queryFn: () => memberApi.list(workspaceId),
    enabled: isOwner,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    void queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
  };

  const updateMutation = useMutation({
    mutationFn: () => workspaceApi.update(workspaceId, name.trim()),
    onSuccess: () => { toast.success('Workspace updated'); refresh(); },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => workspaceApi.remove(workspaceId, confirmation),
    onSuccess: () => {
      toast.success('Workspace deleted');
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      navigate('/app', { replace: true });
    },
    onError: (error) => toast.error(error.message),
  });

  const transferMutation = useMutation({
    mutationFn: () => workspaceApi.transferOwner(workspaceId, newOwnerMemberId),
    onSuccess: () => {
      toast.success('Workspace ownership transferred');
      setTransferOpen(false);
      refresh();
      void queryClient.invalidateQueries({ queryKey: ['members', workspaceId] });
    },
    onError: (error) => toast.error(error.message),
  });

  const labelMutation = useMutation({
    mutationFn: () =>
      editingLabel
        ? labelApi.update(workspaceId, editingLabel.id, { name: labelName, color: labelColor })
        : labelApi.create(workspaceId, { name: labelName, color: labelColor }),
    onSuccess: () => {
      toast.success(editingLabel ? 'Label updated' : 'Label created');
      setEditingLabel(null);
      setLabelName('');
      setLabelColor('#6d5dfc');
      void queryClient.invalidateQueries({ queryKey: ['labels', workspaceId] });
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteLabelMutation = useMutation({
    mutationFn: (labelId: string) => labelApi.remove(workspaceId, labelId),
    onSuccess: () => {
      toast.success('Label deleted');
      void queryClient.invalidateQueries({ queryKey: ['labels', workspaceId] });
    },
    onError: (error) => toast.error(error.message),
  });

  if (labelsQuery.isLoading) return <Spinner label="Loading workspace settings" />;

  return (
    <div className="page-stack settings-page">
      <header className="page-header">
        <div><span className="eyebrow">Configuration</span><h1>Workspace settings</h1><p>Manage identity, reusable labels, ownership, and destructive actions.</p></div>
        <Badge tone="purple">{role}</Badge>
      </header>

      <div className="settings-grid">
        <Card className="settings-card">
          <header><div><h2>Workspace profile</h2><p>Visible to every active workspace member.</p></div></header>
          <form className="form-stack" onSubmit={(event) => { event.preventDefault(); updateMutation.mutate(); }}>
            <label className="field"><span>Workspace name</span><input value={name} minLength={3} maxLength={50} disabled={!canAdmin} onChange={(event) => setName(event.target.value)} /></label>
            <label className="field"><span>Workspace slug</span><input value={currentWorkspace?.slug ?? ''} disabled /><small>Slugs remain stable so shared links do not break.</small></label>
            {canAdmin ? <div className="button-row button-row--end"><Button type="submit" disabled={!name.trim() || name === currentWorkspace?.name} isLoading={updateMutation.isPending}>Save profile</Button></div> : null}
          </form>
        </Card>

        <Card className="settings-card">
          <header><div><h2>Developer access</h2><p>Inspect the documented API used by this frontend.</p></div></header>
          <div className="developer-link-card">
            <div><strong>OpenAPI / Swagger UI</strong><span>Authentication, request examples, and endpoint groups.</span></div>
            <a className="button button--secondary button--sm" href={`${(import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'}/api-docs`} target="_blank" rel="noreferrer">Open docs <ExternalLink size={15} /></a>
          </div>
          {isOwner ? (
            <div className="ownership-card">
              <Crown size={22} />
              <div><strong>Workspace ownership</strong><span>Transfer the owner role to another active member.</span></div>
              <Button variant="secondary" size="sm" onClick={() => setTransferOpen(true)}>Transfer</Button>
            </div>
          ) : null}
        </Card>
      </div>

      <Card className="settings-card">
        <header><div><h2>Workspace labels</h2><p>Create a reusable visual language for task categorization.</p></div><Palette size={20} /></header>
        {canAdmin || role === 'MANAGER' || role === 'MEMBER' ? (
          <form className="label-create-row" onSubmit={(event) => { event.preventDefault(); labelMutation.mutate(); }}>
            <input value={labelName} maxLength={50} placeholder="Label name" onChange={(event) => setLabelName(event.target.value)} />
            <input type="color" value={labelColor} onChange={(event) => setLabelColor(event.target.value)} />
            <Button type="submit" size="sm" isLoading={labelMutation.isPending} disabled={!labelName.trim()}>{editingLabel ? 'Update label' : 'Create label'}</Button>
            {editingLabel ? <Button type="button" variant="ghost" size="sm" onClick={() => { setEditingLabel(null); setLabelName(''); setLabelColor('#6d5dfc'); }}>Cancel</Button> : null}
          </form>
        ) : null}
        {(labelsQuery.data?.length ?? 0) === 0 ? (
          <EmptyState title="No labels yet" description="Create labels such as Bug, Frontend, Customer, or High impact." />
        ) : (
          <div className="label-management-grid">
            {labelsQuery.data?.map((label) => (
              <div className="label-management-item" key={label.id}>
                <span style={{ backgroundColor: label.color }} />
                <div><strong>{label.name}</strong><small>{label.color}</small></div>
                {role !== 'VIEWER' ? <Button variant="ghost" size="sm" onClick={() => { setEditingLabel(label); setLabelName(label.name); setLabelColor(label.color); }}>Edit</Button> : null}
                {['OWNER', 'ADMIN', 'MANAGER'].includes(role ?? '') ? <button className="icon-button" type="button" onClick={() => deleteLabelMutation.mutate(label.id)} aria-label={`Delete ${label.name}`}><Trash2 size={15} /></button> : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      {isOwner ? (
        <Card className="danger-zone">
          <div><ShieldAlert size={22} /><div><h2>Danger zone</h2><p>Deleting a workspace permanently removes its projects, tasks, comments, labels, memberships, notifications, invitations, and audit records.</p></div></div>
          <Button variant="danger" onClick={() => { setConfirmation(''); setDeleteOpen(true); }}><Trash2 size={16} /> Delete workspace</Button>
        </Card>
      ) : null}

      <Modal open={transferOpen} onClose={() => setTransferOpen(false)} title="Transfer workspace ownership" description="You will become an administrator after the transfer." size="sm">
        <form className="form-stack" onSubmit={(event) => { event.preventDefault(); transferMutation.mutate(); }}>
          <label className="field"><span>New owner</span><select value={newOwnerMemberId} onChange={(event) => setNewOwnerMemberId(event.target.value)}><option value="">Choose a member</option>{membersQuery.data?.filter((member) => member.role !== 'OWNER').map((member) => <option key={member.membershipId} value={member.membershipId}>{member.fullName} · {member.role}</option>)}</select></label>
          <div className="button-row button-row--end"><Button type="button" variant="ghost" onClick={() => setTransferOpen(false)}>Cancel</Button><Button type="submit" disabled={!newOwnerMemberId} isLoading={transferMutation.isPending}>Transfer ownership</Button></div>
        </form>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Permanently delete workspace" description={`Type “${currentWorkspace?.name}” to confirm. This cannot be undone.`} size="sm">
        <form className="form-stack" onSubmit={(event) => { event.preventDefault(); deleteMutation.mutate(); }}>
          <label className="field"><span>Confirmation</span><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoFocus /></label>
          <div className="button-row button-row--end"><Button type="button" variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button type="submit" variant="danger" disabled={confirmation !== currentWorkspace?.name} isLoading={deleteMutation.isPending}>Delete forever</Button></div>
        </form>
      </Modal>
    </div>
  );
};
