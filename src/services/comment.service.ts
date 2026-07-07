// src/services/comment.service.ts
import { db } from '../db/index.js';
import { comments } from '../db/schema/comments.js';
import { eq, and } from 'drizzle-orm';
import { CreateCommentInput } from '../schemas/comment.schema.js';

interface CreateCommentData extends CreateCommentInput {
    taskId: string;
    userId: string;
}

export const createCommentInDb = async (data: CreateCommentData) => {
    const [newComment] = await db.insert(comments).values({
        taskId: data.taskId,
        userId: data.userId,
        content: data.content,
    }).returning();

    if (!newComment) {
        throw new Error("Database failed to return the newly created comment");
    }

    return newComment;
};

export const getTaskCommentsFromDb = async (taskId: string) => {
    return await db
        .select()
        .from(comments)
        .where(eq(comments.taskId, taskId));
};

export const deleteCommentFromDb = async (commentId: string, userId: string) => {
    // Ensuring a user can only delete their OWN comment
    const [deletedComment] = await db.delete(comments)
        .where(
            and(
                eq(comments.id, commentId),
                eq(comments.userId, userId)
            )
        )
        .returning();

    return deletedComment;
};