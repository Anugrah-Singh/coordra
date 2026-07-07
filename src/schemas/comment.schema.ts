// src/schemas/comment.schema.ts
import { z } from 'zod';

export const createCommentSchema = z.object({
    body: z.object({
        content: z.string()
            .min(1, { message: 'Comment cannot be empty' })
            .trim(),
    }),
    params: z.object({
        workspaceId: z.uuid({ message: 'Invalid workspace ID format' }),
        projectId: z.uuid({ message: 'Invalid project ID format' }),
        taskId: z.uuid({ message: 'Invalid task ID format' }),
    })
});

export const deleteCommentSchema = z.object({
    params: z.object({
        workspaceId: z.uuid({ message: 'Invalid workspace ID format' }),
        projectId: z.uuid({ message: 'Invalid project ID format' }),
        taskId: z.uuid({ message: 'Invalid task ID format' }),
        commentId: z.uuid({ message: 'Invalid comment ID format' }),
    })
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>['body'];
export type CommentParams = z.infer<typeof createCommentSchema>['params'];
export type DeleteCommentParams = z.infer<typeof deleteCommentSchema>['params'];