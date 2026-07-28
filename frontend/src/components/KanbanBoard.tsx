"use client";

import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { CalendarDays, GripVertical, MessageSquare, UserRound } from 'lucide-react';
import { Badge, Avatar, cn } from './ui';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { formatDate, isOverdue } from '../lib/format';
import type { Task, TaskStatus, WorkspaceMember } from '../types/api';

export const TASK_COLUMNS: Array<{
  status: TaskStatus;
  label: string;
  description: string;
}> = [
  { status: 'BACKLOG', label: 'Backlog', description: 'Ideas and upcoming work' },
  { status: 'TODO', label: 'To do', description: 'Ready to be picked up' },
  { status: 'IN_PROGRESS', label: 'In progress', description: 'Actively being worked' },
  { status: 'BLOCKED', label: 'Blocked', description: 'Waiting on a dependency' },
  { status: 'DONE', label: 'Done', description: 'Completed work' },
];

const priorityTone = (priority: Task['priority']) => {
  if (priority === 'URGENT') return 'danger' as const;
  if (priority === 'HIGH') return 'warning' as const;
  if (priority === 'MEDIUM') return 'info' as const;
  return 'neutral' as const;
};

const TaskCard = ({
  task,
  member,
  onOpen,
  disabled,
}: {
  task: Task;
  member: WorkspaceMember | undefined;
  onOpen: (task: Task) => void;
  disabled: boolean;
}) => {
  const draggable = useDraggable({
    id: task.id,
    data: { task },
    disabled,
  });

  const style = draggable.transform
    ? {
        transform: CSS.Translate.toString(draggable.transform),
        zIndex: 20,
      }
    : undefined;

  return (
    <article
      ref={draggable.setNodeRef}
      style={style}
      className={cn('cursor-pointer rounded-lg border bg-card p-3 shadow-xs transition-all hover:border-primary/30 hover:shadow-md', draggable.isDragging && 'rotate-2 opacity-70 shadow-xl')}
      onClick={() => onOpen(task)}
    >
      <div className="flex items-start justify-between">
        <Badge tone={priorityTone(task.priority)}>{task.priority}</Badge>
        {!disabled ? (
          <button
            type="button"
            className="grid size-7 cursor-grab place-items-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing"
            aria-label={`Move ${task.title}`}
            onClick={(event) => event.stopPropagation()}
            {...draggable.attributes}
            {...draggable.listeners}
          >
            <GripVertical size={16} />
          </button>
        ) : null}
      </div>
      <div className="py-3 [&_h3]:text-sm [&_h3]:font-semibold [&_p]:mt-1 [&_p]:line-clamp-2 [&_p]:text-xs [&_p]:leading-relaxed [&_p]:text-muted-foreground">
        <h3>{task.title}</h3>
        {task.description ? <p>{task.description}</p> : null}
      </div>
      <div className="flex items-center justify-between border-t py-2 text-xs text-muted-foreground">
        {task.dueDate ? (
          <span className={cn('inline-flex items-center gap-1', isOverdue(task.dueDate, task.status) && 'font-medium text-destructive')}>
            <CalendarDays size={14} /> {formatDate(task.dueDate)}
          </span>
        ) : <span className="inline-flex items-center gap-1 text-muted-foreground/70"><CalendarDays size={14} /> No due date</span>}
        <span><MessageSquare size={14} /></span>
      </div>
      <footer className="flex items-center justify-between pt-1 [&>small]:font-mono [&>small]:text-[10px] [&>small]:text-muted-foreground">
        {member ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Avatar name={member.fullName} size="sm" /><span>{member.fullName.split(' ')[0]}</span></span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><UserRound size={15} /> Unassigned</span>
        )}
        <small>#{task.id.slice(0, 5)}</small>
      </footer>
    </article>
  );
};

const KanbanColumn = ({
  status,
  label,
  description,
  tasks,
  members,
  onOpenTask,
  disabled,
}: {
  status: TaskStatus;
  label: string;
  description: string;
  tasks: Task[];
  members: WorkspaceMember[];
  onOpenTask: (task: Task) => void;
  disabled: boolean;
}) => {
  const droppable = useDroppable({ id: status, disabled });

  return (
    <section
      ref={droppable.setNodeRef}
      className={cn('min-h-[28rem] rounded-xl border bg-muted/40 p-2 transition-colors lg:min-h-[34rem]', droppable.isOver && 'border-primary bg-secondary/60')}
      data-status={status}
    >
      <header className="p-2 [&>div]:flex [&>div]:items-center [&>div]:gap-2 [&_h2]:font-mono [&_h2]:text-[10px] [&_h2]:font-semibold [&_h2]:uppercase [&_h2]:tracking-wider [&_strong]:ml-auto [&_strong]:rounded-full [&_strong]:bg-background [&_strong]:px-2 [&_strong]:py-0.5 [&_strong]:text-xs [&_p]:mt-1 [&_p]:text-xs [&_p]:text-muted-foreground">
        <div>
          <span className="size-2 shrink-0 rounded-full bg-muted-foreground data-[status=BACKLOG]:bg-slate-400 data-[status=TODO]:bg-sky-500 data-[status=IN_PROGRESS]:bg-primary data-[status=BLOCKED]:bg-amber-500 data-[status=DONE]:bg-emerald-500" data-status={status} />
          <h2>{label}</h2>
          <strong>{tasks.length}</strong>
        </div>
        <p>{description}</p>
      </header>
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            member={members.find((member) => member.userId === task.assigneeId)}
            onOpen={onOpenTask}
            disabled={disabled}
          />
        ))}
        {tasks.length === 0 ? <div className="grid min-h-24 place-items-center rounded-lg border border-dashed text-xs text-muted-foreground">Drop a task here</div> : null}
      </div>
    </section>
  );
};

export const KanbanBoard = ({
  tasks,
  members,
  onOpenTask,
  onMoveTask,
  readOnly = false,
}: {
  tasks: Task[];
  members: WorkspaceMember[];
  onOpenTask: (task: Task) => void;
  onMoveTask: (task: Task, status: TaskStatus) => void;
  readOnly?: boolean;
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const onDragEnd = (event: DragEndEvent) => {
    const task = event.active.data.current?.task as Task | undefined;
    const status = event.over?.id as TaskStatus | undefined;

    if (task && status && task.status !== status) {
      onMoveTask(task, status);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
      <ScrollArea className="w-full rounded-xl">
        <div className="grid w-max grid-flow-col auto-cols-[minmax(17rem,82vw)] gap-3 pb-4 sm:auto-cols-[18rem] xl:w-full xl:grid-flow-row xl:grid-cols-5 xl:auto-cols-auto">
          {TASK_COLUMNS.map((column) => (
            <KanbanColumn
              key={column.status}
              {...column}
              tasks={tasks.filter((task) => task.status === column.status)}
              members={members}
              onOpenTask={onOpenTask}
              disabled={readOnly}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </DndContext>
  );
};
