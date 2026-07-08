import { z } from 'zod';

const assignableMemberRoleEnum = z.enum([
  'ADMIN',
  'MANAGER',
  'MEMBER',
  'VIEWER',
]);

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

export type AddMemberInput = z.infer<typeof addMemberSchema>['body'];
export type UpdateMemberRoleInput =
  z.infer<typeof updateMemberRoleSchema>['body'];

export type MemberParams = z.infer<typeof addMemberSchema>['params'];
export type MemberActionParams =
  z.infer<typeof updateMemberRoleSchema>['params'];