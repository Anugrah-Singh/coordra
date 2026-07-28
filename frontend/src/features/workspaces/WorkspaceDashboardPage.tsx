'use client';

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
import Link from 'next/link';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState as Spinner } from '@/components/shared/LoadingState';
import { StatusBadge as Badge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { memberApi } from '@/features/collaboration/collaboration.api';
import { taskApi } from '@/features/projects/projects.api';
import { useWorkspace } from '@/features/workspaces/WorkspaceProvider';
import { formatDate, isOverdue } from '@/lib/format';
import type { Task } from '@/types/api';

const priorityTone = (priority: Task['priority']) => {
  if (priority === 'URGENT') return 'danger' as const;
  if (priority === 'HIGH') return 'warning' as const;
  if (priority === 'MEDIUM') return 'info' as const;
  return 'neutral' as const;
};

export const WorkspaceDashboardPage = () => {
  const { workspaceId = '', currentWorkspace, projects } = useWorkspace();

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
  const workflow = [
    { status: 'BACKLOG', label: 'Backlog', color: 'bg-slate-400' },
    { status: 'TODO', label: 'Ready', color: 'bg-sky-500' },
    { status: 'IN_PROGRESS', label: 'In progress', color: 'bg-primary' },
    { status: 'BLOCKED', label: 'Blocked', color: 'bg-amber-500' },
    { status: 'DONE', label: 'Done', color: 'bg-emerald-500' },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <header className="relative grid overflow-hidden rounded-2xl bg-foreground p-6 text-background shadow-lg sm:grid-cols-[1fr_auto] sm:items-end lg:p-8 [&_h1]:mt-2 [&_h1]:font-heading [&_h1]:text-4xl [&_h1]:font-semibold [&_p]:mt-2 [&_p]:text-background/60">
        <div>
          <span className="font-mono text-[10px] font-medium uppercase tracking-[.16em] text-primary">
            Workspace overview
          </span>
          <h1>{currentWorkspace?.name}</h1>
          <p>Track delivery health, team activity, and the work that needs attention.</p>
        </div>
        <Button asChild>
          <Link href={`/app/workspaces/${workspaceId}/projects`}>
            <Plus size={17} /> New project or task
          </Link>
        </Button>
        <div className="pointer-events-none absolute inset-0 opacity-[.06] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:24px_24px]" />
      </header>

      <Card className="gap-4 p-5 shadow-xs">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="font-mono text-[10px] font-medium uppercase tracking-[.16em] text-primary">
              Workflow horizon
            </span>
            <h2 className="mt-1 font-heading text-lg font-semibold">
              Delivery flow at a glance
            </h2>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {tasks.length} tasks across {projects.length} projects
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-5">
          {workflow.map((stage, index) => {
            const count = tasks.filter((task) => task.status === stage.status).length;
            const filledSegments = tasks.length
              ? Math.max(1, Math.round((count / tasks.length) * 10))
              : 0;
            return (
              <div
                className="relative overflow-hidden rounded-xl border bg-muted/35 p-3"
                key={stage.status}
              >
                <div className="mb-5 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium">{stage.label}</span>
                  <strong className="font-mono text-lg">{count}</strong>
                </div>
                <div className="grid grid-cols-10 gap-0.5">
                  {Array.from({ length: 10 }).map((_, segment) => (
                    <span
                      className={`h-1.5 rounded-full ${segment < filledSegments ? stage.color : 'bg-border'}`}
                      key={segment}
                    />
                  ))}
                </div>
                {index < workflow.length - 1 ? (
                  <ArrowRight
                    className="absolute -right-2.5 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-background p-1 text-muted-foreground shadow-sm sm:block"
                    size={20}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="gap-3 p-5 shadow-xs [&>span]:text-sm [&>span]:text-muted-foreground [&>strong]:font-heading [&>strong]:text-3xl [&>small]:text-xs [&>small]:text-muted-foreground">
          <div className="grid size-9 place-items-center rounded-lg bg-secondary text-secondary-foreground">
            <FolderKanban size={20} />
          </div>
          <span>Active projects</span>
          <strong>{projects.length}</strong>
          <small>Shared boards</small>
        </Card>
        <Card className="gap-3 p-5 shadow-xs [&>span]:text-sm [&>span]:text-muted-foreground [&>strong]:font-heading [&>strong]:text-3xl [&>small]:text-xs [&>small]:text-muted-foreground">
          <div className="grid size-9 place-items-center rounded-lg bg-sky-100 text-sky-700">
            <ListTodo size={20} />
          </div>
          <span>Open tasks</span>
          <strong>{tasks.length - completed}</strong>
          <small>{tasks.length} total tasks</small>
        </Card>
        <Card className="gap-3 p-5 shadow-xs [&>span]:text-sm [&>span]:text-muted-foreground [&>strong]:font-heading [&>strong]:text-3xl [&>small]:text-xs [&>small]:text-muted-foreground">
          <div className="grid size-9 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
            <CheckCircle2 size={20} />
          </div>
          <span>Completed</span>
          <strong>{completed}</strong>
          <small>
            {tasks.length ? Math.round((completed / tasks.length) * 100) : 0}% completion
          </small>
        </Card>
        <Card className="gap-3 p-5 shadow-xs [&>span]:text-sm [&>span]:text-muted-foreground [&>strong]:font-heading [&>strong]:text-3xl [&>small]:text-xs [&>small]:text-muted-foreground">
          <div className="grid size-9 place-items-center rounded-lg bg-amber-100 text-amber-700">
            <Users size={20} />
          </div>
          <span>Team members</span>
          <strong>{membersQuery.data?.length ?? 0}</strong>
          <small>Including workspace owner</small>
        </Card>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(20rem,.8fr)]">
        <Card className="gap-0 overflow-hidden shadow-xs">
          <header className="flex items-start justify-between gap-4 border-b p-5 [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_p]:mt-1 [&_p]:text-sm [&_p]:text-muted-foreground [&>a]:inline-flex [&>a]:items-center [&>a]:gap-1 [&>a]:text-sm [&>a]:font-medium [&>a]:text-primary">
            <div>
              <h2>Recent work</h2>
              <p>Latest task activity across every project.</p>
            </div>
            <Link href={`/app/workspaces/${workspaceId}/projects`}>
              View projects <ArrowRight size={15} />
            </Link>
          </header>
          {tasksQuery.isLoading ? <Spinner label="Loading tasks" /> : null}
          {!tasksQuery.isLoading && recentTasks.length === 0 ? (
            <EmptyState
              title="No tasks yet"
              description="Open a project and create the first task on its Kanban board."
            />
          ) : (
            <div className="divide-y">
              {recentTasks.map((task) => {
                const project = projects.find((item) => item.id === task.projectId);
                return (
                  <Link
                    key={task.id}
                    href={`/app/workspaces/${workspaceId}/projects/${task.projectId}?task=${task.id}`}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3 p-4 transition-colors hover:bg-muted/60 sm:grid-cols-[auto_1fr_auto_auto] [&_strong]:block [&_strong]:truncate [&_small]:block [&_small]:truncate [&_small]:text-xs [&_small]:text-muted-foreground [&>span:last-child]:hidden [&>span:last-child]:text-xs [&>span:last-child]:text-muted-foreground sm:[&>span:last-child]:block"
                  >
                    <span
                      className="size-2 shrink-0 rounded-full bg-muted-foreground data-[status=BACKLOG]:bg-slate-400 data-[status=TODO]:bg-sky-500 data-[status=IN_PROGRESS]:bg-primary data-[status=BLOCKED]:bg-amber-500 data-[status=DONE]:bg-emerald-500"
                      data-status={task.status}
                    />
                    <div>
                      <strong>{task.title}</strong>
                      <small>
                        {project?.name ?? 'Project'} · {task.status.replaceAll('_', ' ')}
                      </small>
                    </div>
                    <Badge tone={priorityTone(task.priority)}>{task.priority}</Badge>
                    <span>{formatDate(task.updatedAt)}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="gap-0 overflow-hidden border-amber-200 bg-amber-50/70 shadow-xs">
          <header className="flex items-start justify-between gap-4 border-b p-5 [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_p]:mt-1 [&_p]:text-sm [&_p]:text-muted-foreground [&>a]:inline-flex [&>a]:items-center [&>a]:gap-1 [&>a]:text-sm [&>a]:font-medium [&>a]:text-primary">
            <div>
              <h2>Needs attention</h2>
              <p>Overdue tasks that are not completed.</p>
            </div>
            <Clock3 size={19} />
          </header>
          {overdue.length === 0 ? (
            <EmptyState
              title="Nothing overdue"
              description="Your active deadlines are currently under control."
            />
          ) : (
            <div className="divide-y divide-amber-200/70 [&>a]:grid [&>a]:grid-cols-[3px_1fr_auto] [&>a]:items-center [&>a]:gap-3 [&>a]:p-4 [&>a]:hover:bg-amber-100/60 [&_strong]:block [&_strong]:text-sm [&_small]:text-xs [&_small]:text-muted-foreground">
              {overdue.slice(0, 5).map((task) => (
                <Link
                  key={task.id}
                  href={`/app/workspaces/${workspaceId}/projects/${task.projectId}?task=${task.id}`}
                >
                  <span
                    className="h-9 rounded-full bg-amber-500 data-[priority=URGENT]:bg-destructive data-[priority=HIGH]:bg-amber-500 data-[priority=MEDIUM]:bg-sky-500 data-[priority=LOW]:bg-muted-foreground"
                    data-priority={task.priority}
                  />
                  <div>
                    <strong>{task.title}</strong>
                    <small>Due {formatDate(task.dueDate)}</small>
                  </div>
                  <ArrowRight size={15} />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <section>
        <header className="flex items-end justify-between [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-semibold [&_p]:text-sm [&_p]:text-muted-foreground">
          <div>
            <h2>Project portfolio</h2>
            <p>Jump into a board and continue delivery.</p>
          </div>
        </header>
        {projects.length === 0 ? (
          <EmptyState
            icon={<FolderKanban size={27} />}
            title="Create your first project"
            description="Projects group tasks into a focused delivery board."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {projects.slice(0, 4).map((project) => (
              <Link
                key={project.id}
                href={`/app/workspaces/${workspaceId}/projects/${project.id}`}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border bg-card p-4 shadow-xs hover:border-primary/35 hover:shadow-sm [&_strong]:block [&_span]:block [&_span]:truncate [&_span]:text-xs [&_span]:text-muted-foreground"
              >
                <div className="grid size-10 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                  <FolderKanban size={18} />
                </div>
                <div>
                  <strong>{project.name}</strong>
                  <span>{project.description || 'No description'}</span>
                </div>
                <ArrowRight size={16} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
