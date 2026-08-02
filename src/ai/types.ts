import { z } from 'zod';

export const taskStatusSchema = z.enum([
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'DONE',
  'BLOCKED',
]);
export const taskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

const optionalTaskFields = {
  description: z.string().trim().max(5_000).nullable().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assigneeId: z.uuid().nullable().optional(),
  assigneeName: z.string().trim().max(120).nullable().optional(),
  dueDate: z.iso.datetime().nullable().optional(),
};

export const createTaskProposalPayloadSchema = z.object({
  projectId: z.uuid(),
  projectName: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(240),
  ...optionalTaskFields,
});

export const updateTaskProposalPayloadSchema = z
  .object({
    projectId: z.uuid(),
    projectName: z.string().trim().min(1).max(200),
    taskId: z.uuid(),
    taskTitle: z.string().trim().min(1).max(240),
    title: z.string().trim().min(1).max(240).optional(),
    ...optionalTaskFields,
  })
  .refine(
    (value) =>
      Object.keys(value).some(
        (key) => !['projectId', 'projectName', 'taskId', 'taskTitle'].includes(key)
      ),
    'At least one task change is required'
  );

export const addCommentProposalPayloadSchema = z.object({
  projectId: z.uuid(),
  projectName: z.string().trim().min(1).max(200),
  taskId: z.uuid(),
  taskTitle: z.string().trim().min(1).max(240),
  content: z.string().trim().min(1).max(5_000),
});

export const proposalPayloadSchemas = {
  CREATE_TASK: createTaskProposalPayloadSchema,
  UPDATE_TASK: updateTaskProposalPayloadSchema,
  ADD_COMMENT: addCommentProposalPayloadSchema,
} as const;

export type ProposalAction = keyof typeof proposalPayloadSchemas;
export type ProposalPayload = z.infer<(typeof proposalPayloadSchemas)[ProposalAction]>;
export type ProposalStatus =
  'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'EXECUTED' | 'FAILED';

export type SanitizedProposal = {
  id: string;
  actionType: ProposalAction;
  status: ProposalStatus;
  payload: ProposalPayload;
  expiresAt: Date;
  createdAt: Date;
};

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';

export const canRolePropose = (role: WorkspaceRole) => role !== 'VIEWER';

export const roleToolNames = (role: WorkspaceRole) => [
  'findTasks',
  'getProjectSummary',
  'getWorkspaceMembers',
  'getRecentActivity',
  ...(canRolePropose(role)
    ? ['proposeCreateTask', 'proposeUpdateTask', 'proposeAddComment']
    : []),
];
