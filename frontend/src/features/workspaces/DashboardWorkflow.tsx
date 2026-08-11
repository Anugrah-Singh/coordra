import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { Task } from '@/types/api';

interface DashboardWorkflowProps {
  tasks: Task[];
  projectsCount: number;
}

export const DashboardWorkflow = ({ tasks, projectsCount }: DashboardWorkflowProps) => {
  const workflow = [
    { status: 'BACKLOG', label: 'Backlog', color: 'bg-slate-400' },
    { status: 'TODO', label: 'Ready', color: 'bg-sky-500' },
    { status: 'IN_PROGRESS', label: 'In progress', color: 'bg-primary' },
    { status: 'BLOCKED', label: 'Blocked', color: 'bg-amber-500' },
    { status: 'DONE', label: 'Done', color: 'bg-emerald-500' },
  ] as const;

  return (
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
          {tasks.length} tasks across {projectsCount} projects
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
  );
};
