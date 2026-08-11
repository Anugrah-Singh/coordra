import { insertAuditLog } from '../activity/service.js';
import { and, desc, eq, isNotNull, isNull, lt, type SQL } from 'drizzle-orm';

import { db } from '../../db/index.js';

import { auditLogs } from '../../db/schema/auditLogs.js';

import { notifications } from '../../db/schema/notifications.js';

import { projects } from '../../db/schema/projects.js';

import { tasks } from '../../db/schema/tasks.js';

import { workspaceMembers } from '../../db/schema/workspaces.js';
import { users } from '../../db/schema/users.js';

import { AppError } from '../../utils/AppError.js';

import { getPagination } from '../../utils/pagination.js';

export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type CreateTaskServiceInput = {
  workspaceId: string;
  projectId: string;
  createdById: string;
  title: string;

  description?: string | null | undefined;

  status?: TaskStatus | undefined;

  priority?: TaskPriority | undefined;

  assigneeId?: string | null | undefined;

  dueDate?: string | null | undefined;
};

export type UpdateTaskServiceInput = {
  workspaceId: string;
  projectId: string;
  taskId: string;
  actorId: string;

  title?: string | undefined;

  description?: string | null | undefined;

  status?: TaskStatus | undefined;

  priority?: TaskPriority | undefined;

  assigneeId?: string | null | undefined;

  dueDate?: string | null | undefined;

  archived?: boolean | undefined;
};

type GetProjectTasksInput = {
  workspaceId: string;
  projectId: string;

  filters?: {
    page?: string | undefined;

    limit?: string | undefined;

    status?: TaskStatus | undefined;

    priority?: TaskPriority | undefined;

    assigneeId?: string | undefined;

    includeArchived?: 'true' | 'false' | undefined;
  };
};

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const ensureProjectBelongsToWorkspace = async (
  tx: Transaction,
  workspaceId: string,
  projectId: string
): Promise<void> => {
  const [project] = await tx
    .select({
      id: projects.id,
    })
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),

        eq(projects.workspaceId, workspaceId)
      )
    )
    .limit(1);

  if (!project) {
    throw AppError.notFound('Project not found in this workspace');
  }
};

const ensureAssigneeIsActiveWorkspaceMember = async (
  tx: Transaction,
  workspaceId: string,
  assigneeId: string | null | undefined
): Promise<void> => {
  if (!assigneeId) {
    return;
  }

  const [membership] = await tx
    .select({
      id: workspaceMembers.id,
    })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),

        eq(workspaceMembers.userId, assigneeId)
      )
    )
    .limit(1);

  if (!membership) {
    throw AppError.badRequest('Assignee must be an active member of this workspace');
  }
};

export const createTaskInTransaction = async (
  tx: Transaction,
  data: CreateTaskServiceInput
) => {
  await ensureProjectBelongsToWorkspace(tx, data.workspaceId, data.projectId);

  await ensureAssigneeIsActiveWorkspaceMember(tx, data.workspaceId, data.assigneeId);

  const [newTask] = await tx
    .insert(tasks)
    .values({
      workspaceId: data.workspaceId,

      projectId: data.projectId,

      createdById: data.createdById,

      title: data.title,

      description: data.description ?? null,

      status: data.status ?? 'BACKLOG',

      priority: data.priority ?? 'MEDIUM',

      assigneeId: data.assigneeId ?? null,

      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    })
    .returning();

  if (!newTask) {
    throw AppError.internalError('Failed to create task');
  }

  await insertAuditLog(tx, {
    workspaceId: data.workspaceId,

    actorId: data.createdById,

    action: 'TASK_CREATED',

    entityType: 'task',

    entityId: newTask.id,

    oldValue: null,

    newValue: {
      title: newTask.title,

      status: newTask.status,

      priority: newTask.priority,

      assigneeId: newTask.assigneeId,

      dueDate: newTask.dueDate,
    },
  });

  return newTask;
};

export const createTask = async (data: CreateTaskServiceInput) =>
  db.transaction((tx) => createTaskInTransaction(tx, data));

export const findTasks = async (data: {
  workspaceId: string;
  projectId?: string | undefined;
  status?: TaskStatus | undefined;
  priority?: TaskPriority | undefined;
  assigneeId?: string | undefined;
  overdue?: boolean | undefined;
  unassigned?: boolean | undefined;
  includeArchived?: boolean | undefined;
  now?: Date | undefined;
}) => {
  const conditions: SQL[] = [eq(tasks.workspaceId, data.workspaceId)];
  if (data.projectId) conditions.push(eq(tasks.projectId, data.projectId));
  if (data.status) conditions.push(eq(tasks.status, data.status));
  if (data.priority) conditions.push(eq(tasks.priority, data.priority));
  if (data.assigneeId) conditions.push(eq(tasks.assigneeId, data.assigneeId));
  if (data.unassigned) conditions.push(isNull(tasks.assigneeId));
  if (data.overdue) {
    conditions.push(isNotNull(tasks.dueDate));
    conditions.push(lt(tasks.dueDate, data.now ?? new Date()));
  }
  if (!data.includeArchived) conditions.push(isNull(tasks.archivedAt));

  return db
    .select({
      id: tasks.id,
      projectId: tasks.projectId,
      projectName: projects.name,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      assigneeId: tasks.assigneeId,
      assigneeName: users.fullName,
      dueDate: tasks.dueDate,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .where(and(...conditions))
    .orderBy(desc(tasks.updatedAt), desc(tasks.id))
    .limit(20);
};

/** Internal fact set for deterministic analysis; callers must return aggregates/risks only. */
export const getTaskRiskFacts = async (data: {
  workspaceId: string;
  projectId?: string | undefined;
}) => {
  const conditions: SQL[] = [
    eq(tasks.workspaceId, data.workspaceId),
    isNull(tasks.archivedAt),
  ];
  if (data.projectId) conditions.push(eq(tasks.projectId, data.projectId));
  return db
    .select({
      id: tasks.id,
      projectId: tasks.projectId,
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
      assigneeId: tasks.assigneeId,
      assigneeName: users.fullName,
      dueDate: tasks.dueDate,
    })
    .from(tasks)
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .where(and(...conditions))
    .orderBy(desc(tasks.updatedAt), desc(tasks.id))
    .limit(500);
};

export const getProjectTasks = async (data: GetProjectTasksInput) => {
  const [project] = await db
    .select({
      id: projects.id,
    })
    .from(projects)
    .where(
      and(
        eq(projects.id, data.projectId),

        eq(projects.workspaceId, data.workspaceId)
      )
    )
    .limit(1);

  if (!project) {
    throw AppError.notFound('Project not found in this workspace');
  }

  const conditions: SQL[] = [
    eq(tasks.workspaceId, data.workspaceId),

    eq(tasks.projectId, data.projectId),
  ];

  if (data.filters?.includeArchived !== 'true') {
    conditions.push(isNull(tasks.archivedAt));
  }

  if (data.filters?.status) {
    conditions.push(eq(tasks.status, data.filters.status));
  }

  if (data.filters?.priority) {
    conditions.push(eq(tasks.priority, data.filters.priority));
  }

  if (data.filters?.assigneeId) {
    conditions.push(eq(tasks.assigneeId, data.filters.assigneeId));
  }

  const pagination = getPagination({
    page: data.filters?.page,

    limit: data.filters?.limit,
  });

  return await db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(
      desc(tasks.createdAt),

      desc(tasks.id)
    )
    .limit(pagination.limit)
    .offset(pagination.offset);
};

export const getTaskById = async (
  workspaceId: string,
  projectId: string,
  taskId: string
) => {
  const [task] = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.workspaceId, workspaceId),

        eq(tasks.projectId, projectId),

        eq(tasks.id, taskId)
      )
    )
    .limit(1);

  if (!task) {
    throw AppError.notFound('Task not found');
  }

  return task;
};

export const updateTaskInTransaction = async (
  tx: Transaction,
  data: UpdateTaskServiceInput
) => {
  const [existingTask] = await tx
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.workspaceId, data.workspaceId),

        eq(tasks.projectId, data.projectId),

        eq(tasks.id, data.taskId)
      )
    )
    .limit(1);

  if (!existingTask) {
    throw AppError.notFound('Task not found');
  }

  await ensureAssigneeIsActiveWorkspaceMember(tx, data.workspaceId, data.assigneeId);

  const updateData: Partial<typeof tasks.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.title !== undefined) {
    updateData.title = data.title;
  }

  if (data.description !== undefined) {
    updateData.description = data.description;
  }

  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  if (data.priority !== undefined) {
    updateData.priority = data.priority;
  }

  if (data.assigneeId !== undefined) {
    updateData.assigneeId = data.assigneeId;
  }

  if (data.dueDate !== undefined) {
    updateData.dueDate = data.dueDate === null ? null : new Date(data.dueDate);
  }

  if (data.archived !== undefined) {
    updateData.archivedAt = data.archived ? new Date() : null;
  }

  const [updatedTask] = await tx
    .update(tasks)
    .set(updateData)
    .where(
      and(
        eq(tasks.workspaceId, data.workspaceId),

        eq(tasks.projectId, data.projectId),

        eq(tasks.id, data.taskId)
      )
    )
    .returning();

  if (!updatedTask) {
    throw AppError.internalError('Failed to update task');
  }

  await insertAuditLog(tx, {
    workspaceId: data.workspaceId,

    actorId: data.actorId,

    action: 'TASK_UPDATED',

    entityType: 'task',

    entityId: updatedTask.id,

    oldValue: {
      title: existingTask.title,

      description: existingTask.description,

      status: existingTask.status,

      priority: existingTask.priority,

      assigneeId: existingTask.assigneeId,

      dueDate: existingTask.dueDate,

      archivedAt: existingTask.archivedAt,
    },

    newValue: {
      title: updatedTask.title,

      description: updatedTask.description,

      status: updatedTask.status,

      priority: updatedTask.priority,

      assigneeId: updatedTask.assigneeId,

      dueDate: updatedTask.dueDate,

      archivedAt: updatedTask.archivedAt,
    },
  });

  let notification: typeof notifications.$inferSelect | null = null;
  if (updatedTask.assigneeId && updatedTask.assigneeId !== existingTask.assigneeId) {
    [notification = null] = await tx
      .insert(notifications)
      .values({
        workspaceId: data.workspaceId,
        userId: updatedTask.assigneeId,
        type: 'TASK_ASSIGNED',
        message: `You were assigned to task "${updatedTask.title}"`,
        resourceType: 'task',
        resourceId: updatedTask.id,
      })
      .returning();
  }

  return { task: updatedTask, notification };
};

export const updateTask = async (data: UpdateTaskServiceInput) =>
  db.transaction((tx) => updateTaskInTransaction(tx, data));

export const duplicateTask = async (data: {
  workspaceId: string;
  projectId: string;
  taskId: string;
  actorId: string;
}) => {
  return await db.transaction(async (tx) => {
    const [existingTask] = await tx
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, data.workspaceId),

          eq(tasks.projectId, data.projectId),

          eq(tasks.id, data.taskId)
        )
      )
      .limit(1);

    if (!existingTask) {
      throw AppError.notFound('Task not found');
    }

    const [duplicatedTask] = await tx
      .insert(tasks)
      .values({
        workspaceId: data.workspaceId,

        projectId: data.projectId,

        createdById: data.actorId,

        assigneeId: existingTask.assigneeId,

        title: `${existingTask.title} (Copy)`,

        description: existingTask.description,

        status: 'BACKLOG',

        priority: existingTask.priority,

        dueDate: existingTask.dueDate,
      })
      .returning();

    if (!duplicatedTask) {
      throw AppError.internalError('Failed to duplicate task');
    }

    await insertAuditLog(tx, {
      workspaceId: data.workspaceId,

      actorId: data.actorId,

      action: 'TASK_DUPLICATED',

      entityType: 'task',

      entityId: duplicatedTask.id,

      oldValue: {
        sourceTaskId: existingTask.id,
      },

      newValue: {
        id: duplicatedTask.id,

        title: duplicatedTask.title,

        sourceTaskId: existingTask.id,
      },
    });

    return duplicatedTask;
  });
};
