import { Archive, Download, Filter, Plus, Settings2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ProjectHealthBadge } from '@/features/projects/ProjectHealthBadge';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Task, TaskPriority, Project, WorkspaceMember } from '@/types/api';

interface ProjectBoardHeaderProps {
  project?: Project;
  tasks: Task[];
  members: WorkspaceMember[];
  canEdit: boolean;
  priority: TaskPriority | '';
  setPriority: (priority: TaskPriority | '') => void;
  assigneeId: string;
  setAssigneeId: (id: string) => void;
  includeArchived: boolean;
  setIncludeArchived: (include: boolean) => void;
  onNewLabel: () => void;
  onCreateTask: () => void;
}

export const ProjectBoardHeader = ({
  project,
  tasks,
  members,
  canEdit,
  priority,
  setPriority,
  assigneeId,
  setAssigneeId,
  includeArchived,
  setIncludeArchived,
  onNewLabel,
  onCreateTask,
}: ProjectBoardHeaderProps) => {
  return (
    <>
      <header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between [&_h1]:font-heading [&_h1]:text-3xl [&_h1]:font-semibold [&_p]:mt-1 [&_p]:text-pretty [&_p]:text-muted-foreground">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[.16em] text-primary">
              Project board
            </span>
            <ProjectHealthBadge tasks={tasks} />
          </div>
          <h1 className="truncate text-balance">{project?.name}</h1>
          <p>
            {project?.description || 'Plan, assign, and move delivery work in real time.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none justify-center"
            onClick={() => {
              if (tasks.length === 0) {
                toast.error('No tasks available to export');
                return;
              }
              const headers = ['Task ID', 'Title', 'Status', 'Priority', 'Due Date'];
              const rows = tasks.map((t) => [
                t.id,
                `"${t.title.replaceAll('"', '""')}"`,
                t.status,
                t.priority,
                t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : 'None',
              ]);
              const csvContent = [
                headers.join(','),
                ...rows.map((r) => r.join(',')),
              ].join('\n');
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.setAttribute('href', url);
              link.setAttribute(
                'download',
                `${(project?.name || 'project').toLowerCase().replaceAll(/\s+/g, '-')}-tasks.csv`
              );
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              toast.success('Tasks exported to CSV');
            }}
          >
            <Download size={16} /> Export CSV
          </Button>
          {canEdit ? (
            <Button
              variant="secondary"
              className="flex-1 sm:flex-none justify-center"
              onClick={onNewLabel}
            >
              <Tag size={16} /> New label
            </Button>
          ) : null}
          {canEdit ? (
            <Button className="flex-1 sm:flex-none justify-center" onClick={onCreateTask}>
              <Plus size={17} /> Create task
            </Button>
          ) : null}
        </div>
      </header>

      <Card size="sm" className="gap-0 py-0 shadow-xs">
        <CardHeader className="border-b py-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Filter data-icon="inline-start" />
            <span>Board filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 py-4 sm:grid-cols-2 lg:grid-cols-[minmax(10rem,0.8fr)_minmax(12rem,1fr)_auto_auto] lg:items-end">
          <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium text-muted-foreground">
            <span>Priority</span>
            <Select
              value={priority || 'ALL'}
              onValueChange={(value) =>
                setPriority(value === 'ALL' ? '' : (value as TaskPriority))
              }
            >
              <SelectTrigger className="w-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ALL">All priorities</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </label>
          <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium text-muted-foreground">
            <span>Assignee</span>
            <Select
              value={assigneeId || 'ALL'}
              onValueChange={(value) => setAssigneeId(value === 'ALL' ? '' : value)}
            >
              <SelectTrigger className="w-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ALL">Everyone</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      {member.fullName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-muted-foreground lg:min-h-8">
            <Checkbox
              checked={includeArchived}
              onCheckedChange={(checked) => setIncludeArchived(checked === true)}
            />
            <span className="inline-flex items-center gap-1.5">
              <Archive size={14} /> Include archived
            </span>
          </label>
          <div className="flex min-h-8 items-center sm:justify-end">
            {priority || assigneeId || includeArchived ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPriority('');
                  setAssigneeId('');
                  setIncludeArchived(false);
                }}
              >
                <Settings2 size={15} /> Clear filters
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </>
  );
};
