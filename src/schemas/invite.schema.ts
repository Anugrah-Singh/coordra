import { z } from 'zod';

import {
  paginationQuerySchema,
  PaginationQuery,
} from './pagination.schema.js';

const assignableInviteRoleEnum = z.enum([
  'ADMIN',
  'MANAGER',
  'MEMBER',
  'VIEWER',
]);

export const createWorkspaceInviteSchema = z.object({
  params: z.object({
    workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
  }),

  body: z.object({
    email: z.email({ message: 'Invalid email address' }).trim().toLowerCase(),
    role: assignableInviteRoleEnum.default('MEMBER'),
  }),
});

export const inviteParamsSchema = z.object({
  params: z.object({
    workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
    inviteId: z.uuid({ message: 'Invalid invite ID' }),
  }),
});

export const inviteTokenSchema = z.object({
  params: z.object({
    token: z
      .string()
      .min(32, { message: 'Invalid invite token' })
      .max(256, { message: 'Invalid invite token' }),
  }),
});

export const getWorkspaceInvitesSchema = z.object({
  params: z.object({
    workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
  }),

  query: z.object({
    ...paginationQuerySchema,
  }),
});

export type CreateWorkspaceInviteInput =
  z.infer<typeof createWorkspaceInviteSchema>['body'];

export type WorkspaceInviteParams =
  z.infer<typeof createWorkspaceInviteSchema>['params'];

export type InviteActionParams =
  z.infer<typeof inviteParamsSchema>['params'];

export type InviteTokenParams =
  z.infer<typeof inviteTokenSchema>['params'];

export type InviteListQuery =
  z.infer<typeof getWorkspaceInvitesSchema>['query'] & PaginationQuery;