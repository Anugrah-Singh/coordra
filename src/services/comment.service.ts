import { db } from '../db/index.js';
import { comments } from '../db/schema/comments.js';
import { eq, and } from 'drizzle-orm';

// Explicitly declare properties to bypass TypeScript inference failures
export interface CreateCommentData {
    workspaceId: string;
    taskId: string;
    userId: string;
    content: string; 
}

export const createCommentInDb = async (data: CreateCommentData) => {
    const [newComment] = await db.insert(comments).values({
        workspaceId: data.workspaceId,
        taskId: data.taskId,
        authorId: data.userId, 
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
    const [deletedComment] = await db.delete(comments)
        .where(
            and(
                eq(comments.id, commentId),
                eq(comments.authorId, userId) 
            )
        )
        .returning();

    return deletedComment;
};