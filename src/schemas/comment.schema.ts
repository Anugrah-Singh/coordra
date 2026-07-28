import { z } from 'zod';

import { paginationQuerySchema, PaginationQuery } from './pagination.schema.js';

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment cannot be empty').trim(),
  }),

  params: z.object({
    workspaceId: z.uuid('Invalid workspace ID'),
    projectId: z.uuid('Invalid project ID'),
    taskId: z.uuid('Invalid task ID'),
  }),
});

export const updateCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment cannot be empty').trim(),
  }),

  params: z.object({
    workspaceId: z.uuid('Invalid workspace ID'),
    projectId: z.uuid('Invalid project ID'),
    taskId: z.uuid('Invalid task ID'),
    commentId: z.uuid('Invalid comment ID'),
  }),
});

export const deleteCommentSchema = z.object({
  params: z.object({
    workspaceId: z.uuid('Invalid workspace ID'),
    projectId: z.uuid('Invalid project ID'),
    taskId: z.uuid('Invalid task ID'),
    commentId: z.uuid('Invalid comment ID'),
  }),
});

export const getCommentsSchema = z.object({
  params: z.object({
    workspaceId: z.uuid('Invalid workspace ID'),
    projectId: z.uuid('Invalid project ID'),
    taskId: z.uuid('Invalid task ID'),
  }),

  query: z.object({
    ...paginationQuerySchema,
  }),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>['body'];
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>['body'];

export type CommentParams = z.infer<typeof createCommentSchema>['params'];
export type UpdateCommentParams = z.infer<typeof updateCommentSchema>['params'];
export type DeleteCommentParams = z.infer<typeof deleteCommentSchema>['params'];
export type CommentListQuery = z.infer<typeof getCommentsSchema>['query'] &
  PaginationQuery;
