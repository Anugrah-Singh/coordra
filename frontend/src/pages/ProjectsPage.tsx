import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, FolderKanban, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { projectApi } from '../api';
import { Button, Card, EmptyState, Modal } from '../components/ui';
import type { AppOutletContext } from '../layouts/AppLayout';
import { formatDate } from '../lib/format';
import { queryClient } from '../lib/queryClient';
import type { Project } from '../types/api';

export const ProjectsPage = () => {
  const { workspaceId, projects, currentWorkspace } = useOutletContext<AppOutletContext>();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const canManage = currentWorkspace?.role !== 'VIEWER';
  const canDelete = ['OWNER', 'ADMIN', 'MANAGER'].includes(currentWorkspace?.role ?? '');

  const createMutation = useMutation({
    mutationFn: () => projectApi.create(workspaceId ?? '', { name, description: description || null }),
    onSuccess: () => {
      toast.success('Project created');
      setOpen(false);
      setName('');
      setDescription('');
      void queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (project: Project) => projectApi.remove(workspaceId ?? '', project.id),
    onSuccess: () => {
      toast.success('Project deleted');
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Portfolio and delivery</span>
          <h1>Projects</h1>
          <p>Organize related tasks into focused boards with shared context.</p>
        </div>
        {canManage ? <Button onClick={() => setOpen(true)}><Plus size={17} /> Create project</Button> : null}
      </header>

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban size={28} />}
          title="No projects yet"
          description="Create a project to unlock the Kanban board, assignments, comments, and labels."
          action={canManage ? <Button onClick={() => setOpen(true)}><Plus size={17} /> Create project</Button> : undefined}
        />
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <Card className="project-card" key={project.id}>
              <div className="project-card__icon"><FolderKanban size={20} /></div>
              <div className="project-card__content">
                <div className="project-card__heading">
                  <h2>{project.name}</h2>
                  {canDelete ? (
                    <button className="icon-button" type="button" onClick={() => setDeleteTarget(project)} aria-label={`Delete ${project.name}`}>
                      <Trash2 size={16} />
                    </button>
                  ) : <MoreHorizontal size={17} />}
                </div>
                <p>{project.description || 'No project description yet.'}</p>
              </div>
              <div className="project-card__footer">
                <span>Updated {formatDate(project.updatedAt)}</span>
                <Link to={`/app/workspaces/${workspaceId}/projects/${project.id}`}>Open board <ArrowRight size={15} /></Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create a project" description="Projects contain task boards and collaboration history." size="sm">
        <form className="form-stack" onSubmit={(event) => { event.preventDefault(); createMutation.mutate(); }}>
          <label className="field"><span>Project name</span><input value={name} maxLength={100} onChange={(event) => setName(event.target.value)} autoFocus /></label>
          <label className="field"><span>Description</span><textarea value={description} maxLength={500} rows={4} onChange={(event) => setDescription(event.target.value)} /></label>
          <div className="button-row button-row--end">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!name.trim()} isLoading={createMutation.isPending}>Create project</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete project?" description="All tasks, comments, and task-label links in this project will be removed." size="sm">
        <div className="button-row button-row--end">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}>Delete project</Button>
        </div>
      </Modal>
    </div>
  );
};
