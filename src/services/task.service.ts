import { and, desc, eq, isNull, type SQL } from 'drizzle-orm';

import { db } from '../db/index.js';

import { auditLogs } from '../db/schema/auditLogs.js';

import { notifications } from '../db/schema/notifications.js';

import { projects } from '../db/schema/projects.js';

import { tasks } from '../db/schema/tasks.js';

import { workspaceMembers } from '../db/schema/workspaces.js';

import { badRequest, internalError, notFound } from '../utils/httpErrors.js';

import { getPagination } from '../utils/pagination.js';

type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';

type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

type CreateTaskServiceInput = {
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

type UpdateTaskServiceInput = {
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

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

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
    throw notFound('Project not found in this workspace');
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

        eq(workspaceMembers.userId, assigneeId),

        isNull(workspaceMembers.removedAt)
      )
    )
    .limit(1);

  if (!membership) {
    throw badRequest('Assignee must be an active member of this workspace');
  }
};

export const createTask = async (data: CreateTaskServiceInput) => {
  return await db.transaction(async (tx) => {
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
      throw internalError('Failed to create task');
    }

    await tx.insert(auditLogs).values({
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
  });
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
    throw notFound('Project not found in this workspace');
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
    throw notFound('Task not found');
  }

  return task;
};

export const updateTask = async (data: UpdateTaskServiceInput) => {
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
      throw notFound('Task not found');
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
      throw internalError('Failed to update task');
    }

    await tx.insert(auditLogs).values({
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
      },

      newValue: {
        title: updatedTask.title,

        description: updatedTask.description,

        status: updatedTask.status,

        priority: updatedTask.priority,

        assigneeId: updatedTask.assigneeId,

        dueDate: updatedTask.dueDate,
      },
    });

    return updatedTask;
  });
};

export const updateTaskStatus = async (data: {
  workspaceId: string;
  projectId: string;
  taskId: string;
  actorId: string;
  status: TaskStatus;
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
      throw notFound('Task not found');
    }

    const [updatedTask] = await tx
      .update(tasks)
      .set({
        status: data.status,

        updatedAt: new Date(),
      })
      .where(
        and(
          eq(tasks.workspaceId, data.workspaceId),

          eq(tasks.projectId, data.projectId),

          eq(tasks.id, data.taskId)
        )
      )
      .returning();

    if (!updatedTask) {
      throw internalError('Failed to update task status');
    }

    await tx.insert(auditLogs).values({
      workspaceId: data.workspaceId,

      actorId: data.actorId,

      action: 'TASK_STATUS_CHANGED',

      entityType: 'task',

      entityId: updatedTask.id,

      oldValue: {
        status: existingTask.status,
      },

      newValue: {
        status: updatedTask.status,
      },
    });

    return updatedTask;
  });
};

export const assignTask = async (data: {
  workspaceId: string;
  projectId: string;
  taskId: string;
  actorId: string;

  assigneeId: string | null;
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
      throw notFound('Task not found');
    }

    await ensureAssigneeIsActiveWorkspaceMember(tx, data.workspaceId, data.assigneeId);

    const [updatedTask] = await tx
      .update(tasks)
      .set({
        assigneeId: data.assigneeId,

        updatedAt: new Date(),
      })
      .where(
        and(
          eq(tasks.workspaceId, data.workspaceId),

          eq(tasks.projectId, data.projectId),

          eq(tasks.id, data.taskId)
        )
      )
      .returning();

    if (!updatedTask) {
      throw internalError('Failed to assign task');
    }

    await tx.insert(auditLogs).values({
      workspaceId: data.workspaceId,

      actorId: data.actorId,

      action: 'TASK_ASSIGNED',

      entityType: 'task',

      entityId: updatedTask.id,

      oldValue: {
        assigneeId: existingTask.assigneeId,
      },

      newValue: {
        assigneeId: updatedTask.assigneeId,
      },
    });

    let createdNotification: typeof notifications.$inferSelect | null = null;

    if (updatedTask.assigneeId && updatedTask.assigneeId !== existingTask.assigneeId) {
      const [notification] = await tx
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

      createdNotification = notification ?? null;
    }

    return {
      task: updatedTask,

      notification: createdNotification,
    };
  });
};

export const archiveTask = async (data: {
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
      throw notFound('Task not found');
    }

    const archivedAt = new Date();

    const [archivedTask] = await tx
      .update(tasks)
      .set({
        archivedAt,

        updatedAt: archivedAt,
      })
      .where(
        and(
          eq(tasks.workspaceId, data.workspaceId),

          eq(tasks.projectId, data.projectId),

          eq(tasks.id, data.taskId)
        )
      )
      .returning();

    if (!archivedTask) {
      throw internalError('Failed to archive task');
    }

    await tx.insert(auditLogs).values({
      workspaceId: data.workspaceId,

      actorId: data.actorId,

      action: 'TASK_ARCHIVED',

      entityType: 'task',

      entityId: archivedTask.id,

      oldValue: {
        archivedAt: existingTask.archivedAt,
      },

      newValue: {
        archivedAt: archivedTask.archivedAt,
      },
    });

    return archivedTask;
  });
};

export const unarchiveTask = async (data: {
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
      throw notFound('Task not found');
    }

    const [unarchivedTask] = await tx
      .update(tasks)
      .set({
        archivedAt: null,

        updatedAt: new Date(),
      })
      .where(
        and(
          eq(tasks.workspaceId, data.workspaceId),

          eq(tasks.projectId, data.projectId),

          eq(tasks.id, data.taskId)
        )
      )
      .returning();

    if (!unarchivedTask) {
      throw internalError('Failed to unarchive task');
    }

    await tx.insert(auditLogs).values({
      workspaceId: data.workspaceId,

      actorId: data.actorId,

      action: 'TASK_UNARCHIVED',

      entityType: 'task',

      entityId: unarchivedTask.id,

      oldValue: {
        archivedAt: existingTask.archivedAt,
      },

      newValue: {
        archivedAt: unarchivedTask.archivedAt,
      },
    });

    return unarchivedTask;
  });
};

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
      throw notFound('Task not found');
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

        duplicatedFromTaskId: existingTask.id,
      })
      .returning();

    if (!duplicatedTask) {
      throw internalError('Failed to duplicate task');
    }

    await tx.insert(auditLogs).values({
      workspaceId: data.workspaceId,

      actorId: data.actorId,

      action: 'TASK_DUPLICATED',

      entityType: 'task',

      entityId: duplicatedTask.id,

      oldValue: {
        duplicatedFromTaskId: existingTask.id,
      },

      newValue: {
        id: duplicatedTask.id,

        title: duplicatedTask.title,

        duplicatedFromTaskId: duplicatedTask.duplicatedFromTaskId,
      },
    });

    return duplicatedTask;
  });
};
