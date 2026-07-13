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
      className={cn('task-card', draggable.isDragging && 'task-card--dragging')}
      onClick={() => onOpen(task)}
    >
      <div className="task-card__top">
        <Badge tone={priorityTone(task.priority)}>{task.priority}</Badge>
        {!disabled ? (
          <button
            type="button"
            className="drag-handle"
            aria-label={`Move ${task.title}`}
            onClick={(event) => event.stopPropagation()}
            {...draggable.attributes}
            {...draggable.listeners}
          >
            <GripVertical size={16} />
          </button>
        ) : null}
      </div>
      <div className="task-card__content">
        <h3>{task.title}</h3>
        {task.description ? <p>{task.description}</p> : null}
      </div>
      <div className="task-card__meta">
        {task.dueDate ? (
          <span className={isOverdue(task.dueDate, task.status) ? 'task-due task-due--overdue' : 'task-due'}>
            <CalendarDays size={14} /> {formatDate(task.dueDate)}
          </span>
        ) : <span className="task-due task-due--empty"><CalendarDays size={14} /> No due date</span>}
        <span><MessageSquare size={14} /></span>
      </div>
      <footer className="task-card__footer">
        {member ? (
          <span className="assignee-chip"><Avatar name={member.fullName} size="sm" /><span>{member.fullName.split(' ')[0]}</span></span>
        ) : (
          <span className="assignee-chip assignee-chip--empty"><UserRound size={15} /> Unassigned</span>
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
      className={cn('kanban-column', droppable.isOver && 'kanban-column--over')}
      data-status={status}
    >
      <header className="kanban-column__header">
        <div>
          <span className="status-dot" data-status={status} />
          <h2>{label}</h2>
          <strong>{tasks.length}</strong>
        </div>
        <p>{description}</p>
      </header>
      <div className="kanban-column__body">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            member={members.find((member) => member.userId === task.assigneeId)}
            onOpen={onOpenTask}
            disabled={disabled}
          />
        ))}
        {tasks.length === 0 ? <div className="column-empty">Drop a task here</div> : null}
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
      <div className="kanban-board">
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
    </DndContext>
  );
};
