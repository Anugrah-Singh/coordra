"use client";

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, FolderKanban, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { projectApi } from '../api';
import { Button, Card, EmptyState, Modal } from '../components/ui';
import { formatDate } from '../lib/format';
import { queryClient } from '../lib/queryClient';
import type { Project } from '../types/api';
import { useWorkspace } from '../providers/WorkspaceProvider';

export const ProjectsPage = () => {
  const { workspaceId, projects, currentWorkspace } = useWorkspace();
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
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between [&_h1]:font-heading [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_p]:mt-1 [&_p]:max-w-2xl [&_p]:text-muted-foreground">
        <div>
          <span className="font-mono text-[10px] font-medium uppercase tracking-[.16em] text-primary">Portfolio and delivery</span>
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Card className="gap-0 overflow-hidden shadow-xs" key={project.id}>
              <div className="grid size-10 place-items-center rounded-xl bg-secondary text-secondary-foreground"><FolderKanban size={20} /></div>
              <div className="px-5 pb-5 text-sm text-muted-foreground">
                <div className="flex items-start justify-between gap-3 p-5">
                  <h2>{project.name}</h2>
                  {canDelete ? (
                    <button className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" type="button" onClick={() => setDeleteTarget(project)} aria-label={`Delete ${project.name}`}>
                      <Trash2 size={16} />
                    </button>
                  ) : <MoreHorizontal size={17} />}
                </div>
                <p>{project.description || 'No project description yet.'}</p>
              </div>
              <div className="flex items-center justify-between border-t px-5 py-3 text-xs text-muted-foreground">
                <span>Updated {formatDate(project.updatedAt)}</span>
                <Link href={`/app/workspaces/${workspaceId}/projects/${project.id}`}>Open board <ArrowRight size={15} /></Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create a project" description="Projects contain task boards and collaboration history." size="sm">
        <form className="flex flex-col gap-5" onSubmit={(event) => { event.preventDefault(); createMutation.mutate(); }}>
          <label className="flex flex-col gap-2 text-sm font-medium [&>small]:font-normal [&>small]:text-muted-foreground"><span>Project name</span><input className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50" value={name} maxLength={100} onChange={(event) => setName(event.target.value)} autoFocus /></label>
          <label className="flex flex-col gap-2 text-sm font-medium [&>small]:font-normal [&>small]:text-muted-foreground"><span>Description</span><textarea className="min-h-20 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50" value={description} maxLength={500} rows={4} onChange={(event) => setDescription(event.target.value)} /></label>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!name.trim()} isLoading={createMutation.isPending}>Create project</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete project?" description="All tasks, comments, and task-label links in this project will be removed." size="sm">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}>Delete project</Button>
        </div>
      </Modal>
    </div>
  );
};
