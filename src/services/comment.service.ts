import { and, desc, eq, isNull } from 'drizzle-orm';

import { db } from '../db/index.js';
import { auditLogs } from '../db/schema/auditLogs.js';
import { comments } from '../db/schema/comments.js';
import { tasks } from '../db/schema/tasks.js';
import { workspaceMembers } from '../db/schema/workspaces.js';
import { getPagination } from '../utils/pagination.js';



export interface CreateCommentData {
  workspaceId: string;
  projectId: string;
  taskId: string;
  userId: string;
  content: string;
}

const createHttpError = (message: string, status: number) => {
  return Object.assign(new Error(message), {
    status,
    statusCode: status,
  });
};

const canDeleteComment = (data: {
  actorId: string;
  authorId: string;
  actorRole: string;
}) => {
  return (
    data.actorId === data.authorId ||
    data.actorRole === 'OWNER' ||
    data.actorRole === 'ADMIN'
  );
};

export const createCommentInDb = async (data: CreateCommentData) => {
  return await db.transaction(async (tx) => {
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

    const [newComment] = await tx
      .insert(comments)
      .values({
        workspaceId: data.workspaceId,
        taskId: data.taskId,
        authorId: data.userId,
        content: data.content,
      })
      .returning();

    if (!newComment) {
      throw createHttpError('Failed to create comment', 500);
    }

    await tx.insert(auditLogs).values({
      workspaceId: data.workspaceId,
      actorId: data.userId,
      action: 'COMMENT_CREATED',
      entityType: 'comment',
      entityId: newComment.id,
      oldValue: null,
      newValue: {
        taskId: newComment.taskId,
        content: newComment.content,
      },
    });

    return newComment;
  });
};

export const getTaskCommentsFromDb = async (data: {
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
    .select()
    .from(comments)
    .where(
      and(
        eq(comments.workspaceId, data.workspaceId),
        eq(comments.taskId, data.taskId)
      )
    )
    .orderBy(desc(comments.createdAt), desc(comments.id))
    .limit(pagination.limit)
    .offset(pagination.offset);
};

export const updateCommentInDb = async (data: {
  workspaceId: string;
  projectId: string;
  taskId: string;
  commentId: string;
  actorId: string;
  content: string;
}) => {
  return await db.transaction(async (tx) => {
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

    const [existingComment] = await tx
      .select()
      .from(comments)
      .where(
        and(
          eq(comments.id, data.commentId),
          eq(comments.workspaceId, data.workspaceId),
          eq(comments.taskId, data.taskId)
        )
      )
      .limit(1);

    if (!existingComment) {
      throw createHttpError('Comment not found', 404);
    }

    if (existingComment.authorId !== data.actorId) {
      throw createHttpError('Only the comment author can edit this comment', 403);
    }

    const now = new Date();

    const [updatedComment] = await tx
      .update(comments)
      .set({
        content: data.content,
        editedAt: now,
        updatedAt: now,
      })
      .where(eq(comments.id, data.commentId))
      .returning();

    if (!updatedComment) {
      throw createHttpError('Failed to update comment', 500);
    }

    await tx.insert(auditLogs).values({
      workspaceId: data.workspaceId,
      actorId: data.actorId,
      action: 'COMMENT_UPDATED',
      entityType: 'comment',
      entityId: updatedComment.id,
      oldValue: {
        content: existingComment.content,
      },
      newValue: {
        content: updatedComment.content,
        editedAt: updatedComment.editedAt,
      },
    });

    return updatedComment;
  });
};

export const deleteCommentFromDb = async (data: {
  workspaceId: string;
  projectId: string;
  taskId: string;
  commentId: string;
  actorId: string;
}) => {
  return await db.transaction(async (tx) => {
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

    const [existingComment] = await tx
      .select()
      .from(comments)
      .where(
        and(
          eq(comments.id, data.commentId),
          eq(comments.workspaceId, data.workspaceId),
          eq(comments.taskId, data.taskId)
        )
      )
      .limit(1);

    if (!existingComment) {
      throw createHttpError('Comment not found', 404);
    }

    const [actorMembership] = await tx
      .select({
        role: workspaceMembers.role,
      })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, data.workspaceId),
          eq(workspaceMembers.userId, data.actorId),
          isNull(workspaceMembers.removedAt)
        )
      )
      .limit(1);

    if (!actorMembership) {
      throw createHttpError('You are not a member of this workspace', 403);
    }

    if (
      !canDeleteComment({
        actorId: data.actorId,
        authorId: existingComment.authorId,
        actorRole: actorMembership.role,
      })
    ) {
      throw createHttpError(
        'Only the comment author, admin, or owner can delete this comment',
        403
      );
    }

    const [deletedComment] = await tx
      .delete(comments)
      .where(eq(comments.id, data.commentId))
      .returning();

    if (!deletedComment) {
      throw createHttpError('Failed to delete comment', 500);
    }

    await tx.insert(auditLogs).values({
      workspaceId: data.workspaceId,
      actorId: data.actorId,
      action: 'COMMENT_DELETED',
      entityType: 'comment',
      entityId: deletedComment.id,
      oldValue: {
        taskId: deletedComment.taskId,
        authorId: deletedComment.authorId,
        content: deletedComment.content,
      },
      newValue: null,
    });

    return deletedComment;
  });
};