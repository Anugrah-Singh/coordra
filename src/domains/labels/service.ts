import { insertAuditLog } from '../activity/service.js';
import { and, desc, eq, inArray } from 'drizzle-orm';

import { db } from '../../db/index.js';
import { auditLogs } from '../../db/schema/auditLogs.js';
import { labels, taskLabels } from '../../db/schema/labels.js';
import { tasks } from '../../db/schema/tasks.js';
import { getPagination } from '../../utils/pagination.js';

const createHttpError = (message: string, status: number) => {
  return Object.assign(new Error(message), {
    status,
    statusCode: status,
  });
};

export const getWorkspaceLabels = async (data: {
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

export const createLabel = async (data: {
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

    await insertAuditLog(tx, {
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

export const updateLabel = async (data: {
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
      .where(and(eq(labels.id, data.labelId), eq(labels.workspaceId, data.workspaceId)))
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
      .where(and(eq(labels.id, data.labelId), eq(labels.workspaceId, data.workspaceId)))
      .returning();

    if (!updatedLabel) {
      throw createHttpError('Failed to update label', 500);
    }

    await insertAuditLog(tx, {
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

export const deleteLabel = async (data: {
  workspaceId: string;
  labelId: string;
  actorId: string;
}) => {
  return await db.transaction(async (tx) => {
    const [existingLabel] = await tx
      .select()
      .from(labels)
      .where(and(eq(labels.id, data.labelId), eq(labels.workspaceId, data.workspaceId)))
      .limit(1);

    if (!existingLabel) {
      throw createHttpError('Label not found', 404);
    }

    const [deletedLabel] = await tx
      .delete(labels)
      .where(and(eq(labels.id, data.labelId), eq(labels.workspaceId, data.workspaceId)))
      .returning();

    if (!deletedLabel) {
      throw createHttpError('Failed to delete label', 500);
    }

    await insertAuditLog(tx, {
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
    .where(and(eq(labels.id, data.labelId), eq(labels.workspaceId, data.workspaceId)))
    .limit(1);

  if (!label) {
    throw createHttpError('Label not found', 404);
  }

  return {
    task,
    label,
  };
};

export const getTaskLabels = async (data: {
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

export const replaceTaskLabels = async (data: {
  workspaceId: string;
  projectId: string;
  taskId: string;
  labelIds: string[];
  actorId: string;
}) =>
  db.transaction(async (tx) => {
    const [task] = await tx
      .select({ id: tasks.id })
      .from(tasks)
      .where(
        and(
          eq(tasks.id, data.taskId),
          eq(tasks.projectId, data.projectId),
          eq(tasks.workspaceId, data.workspaceId)
        )
      )
      .limit(1);
    if (!task) throw createHttpError('Task not found', 404);

    const uniqueLabelIds = [...new Set(data.labelIds)];
    if (uniqueLabelIds.length > 0) {
      const matchingLabels = await tx
        .select({ id: labels.id })
        .from(labels)
        .where(
          and(
            eq(labels.workspaceId, data.workspaceId),
            inArray(labels.id, uniqueLabelIds)
          )
        );
      if (matchingLabels.length !== uniqueLabelIds.length) {
        throw createHttpError('Every label must belong to this workspace', 400);
      }
    }

    const previous = await tx
      .select({ labelId: taskLabels.labelId })
      .from(taskLabels)
      .where(eq(taskLabels.taskId, data.taskId));
    await tx.delete(taskLabels).where(eq(taskLabels.taskId, data.taskId));
    if (uniqueLabelIds.length > 0) {
      await tx
        .insert(taskLabels)
        .values(uniqueLabelIds.map((labelId) => ({ taskId: data.taskId, labelId })));
    }
    await insertAuditLog(tx, {
      workspaceId: data.workspaceId,
      actorId: data.actorId,
      action: 'TASK_LABELS_REPLACED',
      entityType: 'task',
      entityId: data.taskId,
      oldValue: { labelIds: previous.map(({ labelId }) => labelId) },
      newValue: { labelIds: uniqueLabelIds },
    });

    return uniqueLabelIds.length === 0
      ? []
      : tx.select().from(labels).where(inArray(labels.id, uniqueLabelIds));
  });
