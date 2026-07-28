import { z } from 'zod';

import { paginationQuerySchema, PaginationQuery } from './pagination.schema.js';

const assignableMemberRoleEnum = z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']);

export const addMemberSchema = z.object({
  params: z.object({
    workspaceId: z.uuid(),
  }),

  body: z.object({
    email: z.email().trim().toLowerCase(),
    role: assignableMemberRoleEnum.default('MEMBER'),
  }),
});

export const updateMemberRoleSchema = z.object({
  params: z.object({
    workspaceId: z.uuid(),
    memberId: z.uuid(),
  }),

  body: z.object({
    role: assignableMemberRoleEnum,
  }),
});

export const removeMemberSchema = z.object({
  params: z.object({
    workspaceId: z.uuid(),
    memberId: z.uuid(),
  }),
});

export const getWorkspaceMembersSchema = z.object({
  params: z.object({
    workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
  }),

  query: z.object({
    ...paginationQuerySchema,
  }),
});

export type AddMemberInput = z.infer<typeof addMemberSchema>['body'];
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>['body'];

export type MemberParams = z.infer<typeof addMemberSchema>['params'];
export type MemberActionParams = z.infer<typeof updateMemberRoleSchema>['params'];

export type MemberListQuery = z.infer<typeof getWorkspaceMembersSchema>['query'] &
  PaginationQuery;
