import type { ToolSet } from '@ai-sdk/provider-utils';
import { z } from 'zod';

import { getRecentActivity } from '../domains/activity/service.js';
import { createStoredProposal } from '../domains/assistant/service.js';
import { getWorkspaceMembers } from '../domains/members/service.js';
import {
  getProjectById,
  getProjectSummary,
  getWorkspaceProjects,
} from '../domains/projects/service.js';
import { findTasks, getTaskRiskFacts } from '../domains/tasks/service.js';
import { deriveRisks } from './risks.js';
import { resolveName } from './resolution.js';
import {
  canRolePropose,
  taskPrioritySchema,
  taskStatusSchema,
  type SanitizedProposal,
  type WorkspaceRole,
} from './types.js';

export type PulseToolContext = {
  workspaceId: string;
  requesterId: string;
  role: WorkspaceRole;
  projectId?: string | undefined;
  now: Date;
  onActivity: (label: string) => void;
  onProposal: (proposal: SanitizedProposal) => void;
};

const clarification = (message: string, choices?: Array<{ name: string }>) => ({
  kind: 'clarification' as const,
  message,
  ...(choices ? { choices: choices.map((choice) => choice.name) } : {}),
});

const resolutionChoices = (value: { kind: string }) =>
  'choices' in value ? (value.choices as Array<{ name: string }>) : undefined;

const resolveProject = async (context: PulseToolContext, requested?: string) => {
  if (!requested && context.projectId) {
    const project = await getProjectById(context.workspaceId, context.projectId);
    return { kind: 'match' as const, value: { id: project.id, name: project.name } };
  }
  if (!requested) {
    return {
      kind: 'missing' as const,
      message: 'Which project should I use?',
    };
  }
  const projects = await getWorkspaceProjects({
    workspaceId: context.workspaceId,
    limit: '20',
  });
  return resolveName(
    requested,
    projects.map((project) => ({ id: project.id, name: project.name })),
    'project'
  );
};

const resolveAssignee = async (context: PulseToolContext, requested?: string | null) => {
  if (requested === undefined) return undefined;
  if (requested === null || requested.toLocaleLowerCase() === 'unassigned') {
    return { kind: 'match' as const, value: null };
  }
  const members = await getWorkspaceMembers({
    workspaceId: context.workspaceId,
    limit: '20',
  });
  return resolveName(
    requested,
    members.map((member) => ({ id: member.userId, name: member.fullName })),
    'workspace member'
  );
};

const resolveTask = async (
  context: PulseToolContext,
  taskTitle: string,
  projectName?: string
) => {
  const project = await resolveProject(context, projectName);
  if (project.kind !== 'match') return { project, task: undefined };
  const taskRows = await findTasks({
    workspaceId: context.workspaceId,
    projectId: project.value.id,
    includeArchived: false,
  });
  const task = resolveName(
    taskTitle,
    taskRows.map((row) => ({ id: row.id, name: row.title })),
    'task'
  );
  return { project, task };
};

const proposalResult = (proposal: SanitizedProposal) => ({
  kind: 'proposal' as const,
  actionType: proposal.actionType,
  status: proposal.status,
  expiresAt: proposal.expiresAt,
  message: 'A pending proposal is ready for the requester to review and approve.',
});

export const buildPulseTools = (context: PulseToolContext): ToolSet => {
  const readTools: ToolSet = {
    findTasks: {
      description:
        'Find up to 20 workspace tasks using verified workspace-scoped filters.',
      inputSchema: z.object({
        projectName: z.string().trim().optional(),
        status: taskStatusSchema.optional(),
        priority: taskPrioritySchema.optional(),
        assigneeName: z.string().trim().optional(),
        overdue: z.boolean().optional(),
        unassigned: z.boolean().optional(),
        includeArchived: z.boolean().optional(),
      }),
      execute: async (input) => {
        context.onActivity('Searched workspace tasks');
        const project = input.projectName
          ? await resolveProject(context, input.projectName)
          : context.projectId
            ? await resolveProject(context)
            : undefined;
        if (project && project.kind !== 'match') {
          return clarification(project.message, resolutionChoices(project));
        }
        const assignee = input.assigneeName
          ? await resolveAssignee(context, input.assigneeName)
          : undefined;
        if (assignee && assignee.kind !== 'match') {
          return clarification(assignee.message, resolutionChoices(assignee));
        }
        return findTasks({
          workspaceId: context.workspaceId,
          projectId: project?.value.id,
          status: input.status,
          priority: input.priority,
          assigneeId: assignee?.value?.id,
          overdue: input.overdue,
          unassigned: input.unassigned,
          includeArchived: input.includeArchived,
          now: context.now,
        });
      },
    },
    getProjectSummary: {
      description:
        'Get deterministic project aggregates and risk conditions from workspace facts.',
      inputSchema: z.object({ projectName: z.string().trim().optional() }),
      execute: async (input) => {
        context.onActivity('Reviewed project health');
        const project =
          input.projectName || context.projectId
            ? await resolveProject(context, input.projectName)
            : undefined;
        if (project && project.kind !== 'match') {
          return clarification(project.message, resolutionChoices(project));
        }
        const [summaries, taskRows] = await Promise.all([
          getProjectSummary({
            workspaceId: context.workspaceId,
            projectId: project?.value.id,
          }),
          getTaskRiskFacts({
            workspaceId: context.workspaceId,
            projectId: project?.value.id,
          }),
        ]);
        const risks = deriveRisks({
          tasks: taskRows,
          projects: summaries,
          now: context.now,
        });
        return { projects: summaries, risks: risks.slice(0, 20) };
      },
    },
    getWorkspaceMembers: {
      description: 'List up to 20 workspace members with name and role only.',
      inputSchema: z.object({}),
      execute: async () => {
        context.onActivity('Reviewed workspace members');
        const members = await getWorkspaceMembers({
          workspaceId: context.workspaceId,
          limit: '20',
        });
        return members.map((member) => ({
          userId: member.userId,
          name: member.fullName,
          role: member.role,
        }));
      },
    },
    getRecentActivity: {
      description:
        'Get up to 20 sanitized workspace activity events without raw audit payloads.',
      inputSchema: z.object({}),
      execute: async () => {
        context.onActivity('Reviewed recent activity');
        return getRecentActivity(context.workspaceId);
      },
    },
  };

  if (!canRolePropose(context.role)) return readTools;

  return {
    ...readTools,
    proposeCreateTask: {
      description:
        'Create a pending task proposal. This never creates a task and always requires user approval.',
      inputSchema: z.object({
        projectName: z.string().trim().min(1),
        title: z.string().trim().min(1).max(240),
        description: z.string().trim().max(5_000).nullable().optional(),
        status: taskStatusSchema.optional(),
        priority: taskPrioritySchema.optional(),
        assigneeName: z.string().trim().nullable().optional(),
        dueDate: z.iso.datetime().nullable().optional(),
      }),
      execute: async (input) => {
        context.onActivity('Prepared a task proposal');
        const project = await resolveProject(context, input.projectName);
        if (project.kind !== 'match') {
          return clarification(project.message, resolutionChoices(project));
        }
        const assignee = await resolveAssignee(context, input.assigneeName);
        if (assignee && assignee.kind !== 'match') {
          return clarification(assignee.message, resolutionChoices(assignee));
        }
        const proposal = await createStoredProposal({
          workspaceId: context.workspaceId,
          requesterId: context.requesterId,
          actionType: 'CREATE_TASK',
          payload: {
            projectId: project.value.id,
            projectName: project.value.name,
            title: input.title,
            description: input.description,
            status: input.status,
            priority: input.priority,
            assigneeId:
              assignee?.value?.id ?? (assignee?.value === null ? null : undefined),
            assigneeName:
              assignee?.value?.name ?? (assignee?.value === null ? null : undefined),
            dueDate: input.dueDate,
          },
          now: context.now,
        });
        context.onProposal(proposal);
        return proposalResult(proposal);
      },
    },
    proposeUpdateTask: {
      description:
        'Create a pending proposal to update a task. Targets are resolved by workspace name, never by model-provided UUID.',
      inputSchema: z.object({
        projectName: z.string().trim().optional(),
        taskTitle: z.string().trim().min(1),
        title: z.string().trim().min(1).max(240).optional(),
        description: z.string().trim().max(5_000).nullable().optional(),
        status: taskStatusSchema.optional(),
        priority: taskPrioritySchema.optional(),
        assigneeName: z.string().trim().nullable().optional(),
        dueDate: z.iso.datetime().nullable().optional(),
      }),
      execute: async (input) => {
        context.onActivity('Prepared a task update proposal');
        const resolved = await resolveTask(context, input.taskTitle, input.projectName);
        if (resolved.project.kind !== 'match') {
          return clarification(
            resolved.project.message,
            resolutionChoices(resolved.project)
          );
        }
        if (!resolved.task || resolved.task.kind !== 'match') {
          return clarification(
            resolved.task?.message ?? 'Which task should I update?',
            resolved.task ? resolutionChoices(resolved.task) : undefined
          );
        }
        const assignee = await resolveAssignee(context, input.assigneeName);
        if (assignee && assignee.kind !== 'match') {
          return clarification(assignee.message, resolutionChoices(assignee));
        }
        const proposal = await createStoredProposal({
          workspaceId: context.workspaceId,
          requesterId: context.requesterId,
          actionType: 'UPDATE_TASK',
          payload: {
            projectId: resolved.project.value.id,
            projectName: resolved.project.value.name,
            taskId: resolved.task.value.id,
            taskTitle: resolved.task.value.name,
            title: input.title,
            description: input.description,
            status: input.status,
            priority: input.priority,
            assigneeId:
              assignee?.value?.id ?? (assignee?.value === null ? null : undefined),
            assigneeName:
              assignee?.value?.name ?? (assignee?.value === null ? null : undefined),
            dueDate: input.dueDate,
          },
          now: context.now,
        });
        context.onProposal(proposal);
        return proposalResult(proposal);
      },
    },
    proposeAddComment: {
      description:
        'Create a pending proposal to add a task comment. This never posts a comment before approval.',
      inputSchema: z.object({
        projectName: z.string().trim().optional(),
        taskTitle: z.string().trim().min(1),
        content: z.string().trim().min(1).max(5_000),
      }),
      execute: async (input) => {
        context.onActivity('Prepared a comment proposal');
        const resolved = await resolveTask(context, input.taskTitle, input.projectName);
        if (resolved.project.kind !== 'match') {
          return clarification(
            resolved.project.message,
            resolutionChoices(resolved.project)
          );
        }
        if (!resolved.task || resolved.task.kind !== 'match') {
          return clarification(
            resolved.task?.message ?? 'Which task should receive the comment?',
            resolved.task ? resolutionChoices(resolved.task) : undefined
          );
        }
        const proposal = await createStoredProposal({
          workspaceId: context.workspaceId,
          requesterId: context.requesterId,
          actionType: 'ADD_COMMENT',
          payload: {
            projectId: resolved.project.value.id,
            projectName: resolved.project.value.name,
            taskId: resolved.task.value.id,
            taskTitle: resolved.task.value.name,
            content: input.content,
          },
          now: context.now,
        });
        context.onProposal(proposal);
        return proposalResult(proposal);
      },
    },
  };
};
