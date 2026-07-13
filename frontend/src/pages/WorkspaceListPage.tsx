import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowUpRight, Building2, Plus, Sparkles } from 'lucide-react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { workspaceApi } from '../api';
import { Button, Card, EmptyState, Modal } from '../components/ui';
import type { AppOutletContext } from '../layouts/AppLayout';
import { formatDate } from '../lib/format';
import { queryClient } from '../lib/queryClient';

export const WorkspaceListPage = () => {
  const { workspaces } = useOutletContext<AppOutletContext>();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const createMutation = useMutation({
    mutationFn: () => workspaceApi.create(name),
    onSuccess: (workspace) => {
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace created');
      navigate(`/app/workspaces/${workspace.id}`);
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Team command centers</span>
          <h1>Your workspaces</h1>
          <p>Each workspace has isolated projects, members, roles, and activity.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={17} /> New workspace</Button>
      </header>

      {workspaces.length === 0 ? (
        <EmptyState
          icon={<Building2 size={28} />}
          title="Create your first workspace"
          description="Start with one workspace, then invite teammates and organize work into projects."
          action={<Button onClick={() => setOpen(true)}><Plus size={17} /> Create workspace</Button>}
        />
      ) : (
        <div className="workspace-grid">
          {workspaces.map((workspace, index) => (
            <Link className="workspace-card" key={workspace.id} to={`/app/workspaces/${workspace.id}`}>
              <div className="workspace-card__top">
                <span className={`workspace-symbol workspace-symbol--${(index % 4) + 1}`}>
                  {workspace.name.charAt(0).toUpperCase()}
                </span>
                <ArrowUpRight size={18} />
              </div>
              <div>
                <h2>{workspace.name}</h2>
                <p>{workspace.slug}</p>
              </div>
              <div className="workspace-card__meta">
                <span>{workspace.role}</span>
                <span>Created {formatDate(workspace.createdAt)}</span>
              </div>
            </Link>
          ))}
          <button className="workspace-card workspace-card--new" type="button" onClick={() => setOpen(true)}>
            <Sparkles size={25} />
            <h2>Launch another workspace</h2>
            <p>Keep client, product, or team work securely separated.</p>
          </button>
        </div>
      )}

      <Card className="engineering-banner">
        <div>
          <span className="eyebrow">Under the hood</span>
          <h2>Multi-tenant by design, not by convention.</h2>
          <p>Every project and task query is scoped to the active workspace and protected by hierarchical RBAC.</p>
        </div>
        <div className="engineering-banner__chips">
          <span>Express 5</span><span>Drizzle ORM</span><span>Neon branches</span><span>Socket.IO</span>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Create a workspace" size="sm">
        <form
          className="form-stack"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate();
          }}
        >
          <label className="field">
            <span>Workspace name</span>
            <input value={name} minLength={3} maxLength={50} onChange={(event) => setName(event.target.value)} autoFocus />
          </label>
          <div className="button-row button-row--end">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createMutation.isPending} disabled={name.trim().length < 3}>Create workspace</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
