import { z } from 'zod';

export const createCommentSchema = z.object({
    body: z.object({
        content: z.string().min(1, 'Comment cannot be empty').trim(),
    }),
    params: z.object({
        workspaceId: z.uuid('Invalid workspace ID'),
        projectId: z.uuid('Invalid project ID'),
        taskId: z.uuid('Invalid task ID'),
    })
});

export const deleteCommentSchema = z.object({
    params: z.object({
        workspaceId: z.uuid('Invalid workspace ID'),
        projectId: z.uuid('Invalid project ID'),
        taskId: z.uuid('Invalid task ID'),
        commentId: z.uuid('Invalid comment ID'),
    })
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>['body'];
export type CommentParams = z.infer<typeof createCommentSchema>['params'];
export type DeleteCommentParams = z.infer<typeof deleteCommentSchema>['params'];