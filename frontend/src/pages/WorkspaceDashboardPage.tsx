import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FolderKanban,
  ListTodo,
  Plus,
  Users,
} from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import { memberApi, taskApi } from '../api';
import { Badge, Card, EmptyState, Spinner } from '../components/ui';
import type { AppOutletContext } from '../layouts/AppLayout';
import { formatDate, isOverdue } from '../lib/format';
import type { Task } from '../types/api';

const priorityTone = (priority: Task['priority']) => {
  if (priority === 'URGENT') return 'danger' as const;
  if (priority === 'HIGH') return 'warning' as const;
  if (priority === 'MEDIUM') return 'info' as const;
  return 'neutral' as const;
};

export const WorkspaceDashboardPage = () => {
  const { workspaceId = '', currentWorkspace, projects } = useOutletContext<AppOutletContext>();

  const membersQuery = useQuery({
    queryKey: ['members', workspaceId],
    queryFn: () => memberApi.list(workspaceId),
  });

  const tasksQuery = useQuery({
    queryKey: ['dashboard-tasks', workspaceId, projects.map((item) => item.id).join(',')],
    queryFn: async () => {
      const taskLists = await Promise.all(
        projects.map((project) => taskApi.list(workspaceId, project.id))
      );
      return taskLists.flat();
    },
    enabled: projects.length > 0,
  });

  const tasks = tasksQuery.data ?? [];
  const completed = tasks.filter((task) => task.status === 'DONE').length;
  const overdue = tasks.filter((task) => isOverdue(task.dueDate, task.status));
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  return (
    <div className="page-stack">
      <header className="dashboard-hero">
        <div>
          <span className="eyebrow">Workspace overview</span>
          <h1>{currentWorkspace?.name}</h1>
          <p>Track delivery health, team activity, and the work that needs attention.</p>
        </div>
        <Link className="button button--primary button--md" to={`/app/workspaces/${workspaceId}/projects`}>
          <Plus size={17} /> New project or task
        </Link>
        <div className="dashboard-hero__grid" />
      </header>

      <section className="metric-grid">
        <Card className="metric-card">
          <div className="metric-card__icon"><FolderKanban size={20} /></div>
          <span>Active projects</span><strong>{projects.length}</strong><small>Shared boards</small>
        </Card>
        <Card className="metric-card">
          <div className="metric-card__icon metric-card__icon--blue"><ListTodo size={20} /></div>
          <span>Open tasks</span><strong>{tasks.length - completed}</strong><small>{tasks.length} total tasks</small>
        </Card>
        <Card className="metric-card">
          <div className="metric-card__icon metric-card__icon--green"><CheckCircle2 size={20} /></div>
          <span>Completed</span><strong>{completed}</strong><small>{tasks.length ? Math.round((completed / tasks.length) * 100) : 0}% completion</small>
        </Card>
        <Card className="metric-card">
          <div className="metric-card__icon metric-card__icon--orange"><Users size={20} /></div>
          <span>Team members</span><strong>{membersQuery.data?.length ?? 0}</strong><small>Including workspace owner</small>
        </Card>
      </section>

      <div className="dashboard-columns">
        <Card className="dashboard-panel">
          <header className="panel-header">
            <div><h2>Recent work</h2><p>Latest task activity across every project.</p></div>
            <Link to={`/app/workspaces/${workspaceId}/projects`}>View projects <ArrowRight size={15} /></Link>
          </header>
          {tasksQuery.isLoading ? <Spinner label="Loading tasks" /> : null}
          {!tasksQuery.isLoading && recentTasks.length === 0 ? (
            <EmptyState title="No tasks yet" description="Open a project and create the first task on its Kanban board." />
          ) : (
            <div className="activity-table">
              {recentTasks.map((task) => {
                const project = projects.find((item) => item.id === task.projectId);
                return (
                  <Link key={task.id} to={`/app/workspaces/${workspaceId}/projects/${task.projectId}?task=${task.id}`} className="activity-row">
                    <span className="status-dot" data-status={task.status} />
                    <div><strong>{task.title}</strong><small>{project?.name ?? 'Project'} · {task.status.replaceAll('_', ' ')}</small></div>
                    <Badge tone={priorityTone(task.priority)}>{task.priority}</Badge>
                    <span>{formatDate(task.updatedAt)}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="dashboard-panel dashboard-panel--attention">
          <header className="panel-header"><div><h2>Needs attention</h2><p>Overdue tasks that are not completed.</p></div><Clock3 size={19} /></header>
          {overdue.length === 0 ? (
            <EmptyState title="Nothing overdue" description="Your active deadlines are currently under control." />
          ) : (
            <div className="attention-list">
              {overdue.slice(0, 5).map((task) => (
                <Link key={task.id} to={`/app/workspaces/${workspaceId}/projects/${task.projectId}?task=${task.id}`}>
                  <span className="priority-bar" data-priority={task.priority} />
                  <div><strong>{task.title}</strong><small>Due {formatDate(task.dueDate)}</small></div>
                  <ArrowRight size={15} />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <section>
        <header className="section-heading"><div><h2>Project portfolio</h2><p>Jump into a board and continue delivery.</p></div></header>
        {projects.length === 0 ? (
          <EmptyState icon={<FolderKanban size={27} />} title="Create your first project" description="Projects group tasks into a focused delivery board." />
        ) : (
          <div className="compact-project-grid">
            {projects.slice(0, 4).map((project) => (
              <Link key={project.id} to={`/app/workspaces/${workspaceId}/projects/${project.id}`} className="compact-project-card">
                <div className="project-card__icon"><FolderKanban size={18} /></div>
                <div><strong>{project.name}</strong><span>{project.description || 'No description'}</span></div>
                <ArrowRight size={16} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
