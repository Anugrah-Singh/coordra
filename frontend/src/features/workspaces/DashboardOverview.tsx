import { FolderKanban, ListTodo, CheckCircle2, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface DashboardOverviewProps {
  projectsCount: number;
  tasksCount: number;
  completedCount: number;
  membersCount: number;
}

export const DashboardOverview = ({
  projectsCount,
  tasksCount,
  completedCount,
  membersCount,
}: DashboardOverviewProps) => {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="gap-3 p-5 shadow-xs [&>span]:text-sm [&>span]:text-muted-foreground [&>strong]:font-heading [&>strong]:text-3xl [&>small]:text-xs [&>small]:text-muted-foreground">
        <div className="grid size-9 place-items-center rounded-lg bg-secondary text-secondary-foreground">
          <FolderKanban size={20} />
        </div>
        <span>Active projects</span>
        <strong>{projectsCount}</strong>
        <small>Shared boards</small>
      </Card>
      <Card className="gap-3 p-5 shadow-xs [&>span]:text-sm [&>span]:text-muted-foreground [&>strong]:font-heading [&>strong]:text-3xl [&>small]:text-xs [&>small]:text-muted-foreground">
        <div className="grid size-9 place-items-center rounded-lg bg-sky-100 text-sky-700">
          <ListTodo size={20} />
        </div>
        <span>Open tasks</span>
        <strong>{tasksCount - completedCount}</strong>
        <small>{tasksCount} total tasks</small>
      </Card>
      <Card className="gap-3 p-5 shadow-xs [&>span]:text-sm [&>span]:text-muted-foreground [&>strong]:font-heading [&>strong]:text-3xl [&>small]:text-xs [&>small]:text-muted-foreground">
        <div className="grid size-9 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
          <CheckCircle2 size={20} />
        </div>
        <span>Completed</span>
        <strong>{completedCount}</strong>
        <small>
          {tasksCount ? Math.round((completedCount / tasksCount) * 100) : 0}% completion
        </small>
      </Card>
      <Card className="gap-3 p-5 shadow-xs [&>span]:text-sm [&>span]:text-muted-foreground [&>strong]:font-heading [&>strong]:text-3xl [&>small]:text-xs [&>small]:text-muted-foreground">
        <div className="grid size-9 place-items-center rounded-lg bg-amber-100 text-amber-700">
          <Users size={20} />
        </div>
        <span>Team members</span>
        <strong>{membersCount}</strong>
        <small>Including workspace owner</small>
      </Card>
    </section>
  );
};
