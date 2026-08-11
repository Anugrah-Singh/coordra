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
import { DashboardOverview } from '@/features/workspaces/DashboardOverview';
import { DashboardWorkflow } from '@/features/workspaces/DashboardWorkflow';
import { DashboardPortfolio } from '@/features/workspaces/DashboardPortfolio';

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

      <DashboardWorkflow tasks={tasks} projectsCount={projects.length} />

      <DashboardOverview
        projectsCount={projects.length}
        tasksCount={tasks.length}
        completedCount={completed}
        membersCount={membersQuery.data?.length ?? 0}
      />

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

      <DashboardPortfolio projects={projects} workspaceId={workspaceId} />
    </div>
  );
};
