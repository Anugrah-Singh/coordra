import { and, desc, eq } from 'drizzle-orm';

import { db } from '../db/index.js';
import { auditLogs } from '../db/schema/auditLogs.js';
import { labels, taskLabels } from '../db/schema/labels.js';
import { tasks } from '../db/schema/tasks.js';
import { getPagination } from '../utils/pagination.js';

const createHttpError = (message: string, status: number) => {
  return Object.assign(new Error(message), {
    status,
    statusCode: status,
  });
};

export const getWorkspaceLabelsFromDb = async (data: {
  workspaceId: string;
  page?: string | undefined;
  limit?: string | undefined;
}) => {
  const pagination = getPagination({
    page: data.page,
    limit: data.limit,
  });

  return await db
    .select()
    .from(labels)
    .where(eq(labels.workspaceId, data.workspaceId))
    .orderBy(desc(labels.createdAt), desc(labels.id))
    .limit(pagination.limit)
    .offset(pagination.offset);
};

export const createLabelInDb = async (data: {
  workspaceId: string;
  actorId: string;
  name: string;
  color?: string | undefined;
}) => {
  return await db.transaction(async (tx) => {
    const [newLabel] = await tx
      .insert(labels)
      .values({
        workspaceId: data.workspaceId,
        name: data.name,
        color: data.color ?? '#000000',
      })
      .returning();

    if (!newLabel) {
      throw createHttpError('Failed to create label', 500);
    }

    await tx.insert(auditLogs).values({
      workspaceId: data.workspaceId,
      actorId: data.actorId,
      action: 'LABEL_CREATED',
      entityType: 'label',
      entityId: newLabel.id,
      oldValue: null,
      newValue: {
        name: newLabel.name,
        color: newLabel.color,
      },
    });

    return newLabel;
  });
};

export const updateLabelInDb = async (data: {
  workspaceId: string;
  labelId: string;
  actorId: string;
  name?: string | undefined;
  color?: string | undefined;
}) => {
  return await db.transaction(async (tx) => {
    const [existingLabel] = await tx
      .select()
      .from(labels)
      .where(
        and(
          eq(labels.id, data.labelId),
          eq(labels.workspaceId, data.workspaceId)
        )
      )
      .limit(1);

    if (!existingLabel) {
      throw createHttpError('Label not found', 404);
    }

    const updateData: Partial<typeof labels.$inferInsert> = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.color !== undefined) {
      updateData.color = data.color;
    }

    const [updatedLabel] = await tx
      .update(labels)
      .set(updateData)
      .where(
        and(
          eq(labels.id, data.labelId),
          eq(labels.workspaceId, data.workspaceId)
        )
      )
      .returning();

    if (!updatedLabel) {
      throw createHttpError('Failed to update label', 500);
    }

    await tx.insert(auditLogs).values({
      workspaceId: data.workspaceId,
      actorId: data.actorId,
      action: 'LABEL_UPDATED',
      entityType: 'label',
      entityId: updatedLabel.id,
      oldValue: {
        name: existingLabel.name,
        color: existingLabel.color,
      },
      newValue: {
        name: updatedLabel.name,
        color: updatedLabel.color,
      },
    });

    return updatedLabel;
  });
};

export const deleteLabelInDb = async (data: {
  workspaceId: string;
  labelId: string;
  actorId: string;
}) => {
  return await db.transaction(async (tx) => {
    const [existingLabel] = await tx
      .select()
      .from(labels)
      .where(
        and(
          eq(labels.id, data.labelId),
          eq(labels.workspaceId, data.workspaceId)
        )
      )
      .limit(1);

    if (!existingLabel) {
      throw createHttpError('Label not found', 404);
    }

    const [deletedLabel] = await tx
      .delete(labels)
      .where(
        and(
          eq(labels.id, data.labelId),
          eq(labels.workspaceId, data.workspaceId)
        )
      )
      .returning();

    if (!deletedLabel) {
      throw createHttpError('Failed to delete label', 500);
    }

    await tx.insert(auditLogs).values({
      workspaceId: data.workspaceId,
      actorId: data.actorId,
      action: 'LABEL_DELETED',
      entityType: 'label',
      entityId: deletedLabel.id,
      oldValue: {
        name: existingLabel.name,
        color: existingLabel.color,
      },
      newValue: null,
    });

    return deletedLabel;
  });
};

const getTaskAndLabelForWorkspace = async (
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  data: {
    workspaceId: string;
    projectId: string;
    taskId: string;
    labelId: string;
  }
) => {
  const [task] = await tx
    .select({
      id: tasks.id,
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.id, data.taskId),
        eq(tasks.workspaceId, data.workspaceId),
        eq(tasks.projectId, data.projectId)
      )
    )
    .limit(1);

  if (!task) {
    throw createHttpError('Task not found', 404);
  }

  const [label] = await tx
    .select()
    .from(labels)
    .where(
      and(
        eq(labels.id, data.labelId),
        eq(labels.workspaceId, data.workspaceId)
      )
    )
    .limit(1);

  if (!label) {
    throw createHttpError('Label not found', 404);
  }

  return {
    task,
    label,
  };
};

export const getTaskLabelsFromDb = async (data: {
  workspaceId: string;
  projectId: string;
  taskId: string;
  page?: string | undefined;
  limit?: string | undefined;
}) => {
  const [task] = await db
    .select({
      id: tasks.id,
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.id, data.taskId),
        eq(tasks.workspaceId, data.workspaceId),
        eq(tasks.projectId, data.projectId)
      )
    )
    .limit(1);

  if (!task) {
    throw createHttpError('Task not found', 404);
  }

  const pagination = getPagination({
    page: data.page,
    limit: data.limit,
  });

  return await db
    .select({
      id: labels.id,
      workspaceId: labels.workspaceId,
      name: labels.name,
      color: labels.color,
      createdAt: labels.createdAt,
    })
    .from(taskLabels)
    .innerJoin(labels, eq(taskLabels.labelId, labels.id))
    .where(eq(taskLabels.taskId, data.taskId))
    .orderBy(desc(labels.createdAt), desc(labels.id))
    .limit(pagination.limit)
    .offset(pagination.offset);
};

export const addLabelToTaskInDb = async (data: {
  workspaceId: string;
  projectId: string;
  taskId: string;
  labelId: string;
  actorId: string;
}) => {
  return await db.transaction(async (tx) => {
    const { label } = await getTaskAndLabelForWorkspace(tx, data);

    const [existingTaskLabel] = await tx
      .select()
      .from(taskLabels)
      .where(
        and(
          eq(taskLabels.taskId, data.taskId),
          eq(taskLabels.labelId, data.labelId)
        )
      )
      .limit(1);

    if (existingTaskLabel) {
      throw createHttpError('Label is already attached to this task', 409);
    }

    await tx.insert(taskLabels).values({
      taskId: data.taskId,
      labelId: data.labelId,
    });

    await tx.insert(auditLogs).values({
      workspaceId: data.workspaceId,
      actorId: data.actorId,
      action: 'TASK_LABEL_ADDED',
      entityType: 'task',
      entityId: data.taskId,
      oldValue: null,
      newValue: {
        taskId: data.taskId,
        labelId: data.labelId,
      },
    });

    return label;
  });
};

export const removeLabelFromTaskInDb = async (data: {
  workspaceId: string;
  projectId: string;
  taskId: string;
  labelId: string;
  actorId: string;
}) => {
  return await db.transaction(async (tx) => {
    const { label } = await getTaskAndLabelForWorkspace(tx, data);

    const [existingTaskLabel] = await tx
      .select()
      .from(taskLabels)
      .where(
        and(
          eq(taskLabels.taskId, data.taskId),
          eq(taskLabels.labelId, data.labelId)
        )
      )
      .limit(1);

    if (!existingTaskLabel) {
      throw createHttpError('Label is not attached to this task', 404);
    }

    await tx
      .delete(taskLabels)
      .where(
        and(
          eq(taskLabels.taskId, data.taskId),
          eq(taskLabels.labelId, data.labelId)
        )
      );

    await tx.insert(auditLogs).values({
      workspaceId: data.workspaceId,
      actorId: data.actorId,
      action: 'TASK_LABEL_REMOVED',
      entityType: 'task',
      entityId: data.taskId,
      oldValue: {
        taskId: data.taskId,
        labelId: data.labelId,
      },
      newValue: null,
    });

    return label;
  });
};