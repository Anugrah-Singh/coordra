import { and, eq } from 'drizzle-orm';

import { proposalPayloadSchemas, type ProposalAction } from '../../ai/types.js';
import { db } from '../../db/index.js';
import { aiActionProposals } from '../../db/schema/aiActionProposals.js';
import { auditLogs } from '../../db/schema/auditLogs.js';
import { workspaceMembers } from '../../db/schema/workspaces.js';
import {
  badRequest,
  conflict,
  forbidden,
  gone,
  notFound,
} from '../../utils/httpErrors.js';
import { createCommentInTransaction } from '../comments/service.js';
import { getWorkspaceMembers } from '../members/service.js';
import { getProjectById } from '../projects/service.js';
import {
  createTaskInTransaction,
  getTaskById,
  updateTaskInTransaction,
} from '../tasks/service.js';

const PROPOSAL_LIFETIME_MS = 15 * 60 * 1000;

const parsePayload = (actionType: ProposalAction, payload: unknown) =>
  proposalPayloadSchemas[actionType].parse(payload);

const sanitizeProposal = (proposal: typeof aiActionProposals.$inferSelect) => ({
  id: proposal.id,
  actionType: proposal.actionType,
  status: proposal.status,
  payload: parsePayload(proposal.actionType, proposal.payload),
  expiresAt: proposal.expiresAt,
  createdAt: proposal.createdAt,
});

export const createStoredProposal = async (input: {
  workspaceId: string;
  requesterId: string;
  actionType: ProposalAction;
  payload: unknown;
  now?: Date | undefined;
}) => {
  const now = input.now ?? new Date();
  const payload = parsePayload(input.actionType, input.payload);
  const [proposal] = await db
    .insert(aiActionProposals)
    .values({
      workspaceId: input.workspaceId,
      requesterId: input.requesterId,
      actionType: input.actionType,
      payload,
      expiresAt: new Date(now.getTime() + PROPOSAL_LIFETIME_MS),
    })
    .returning();
  if (!proposal) throw conflict('Could not create the Pulse proposal');
  return sanitizeProposal(proposal);
};

const getOwnedProposal = async (input: {
  workspaceId: string;
  requesterId: string;
  proposalId: string;
}) => {
  const [proposal] = await db
    .select()
    .from(aiActionProposals)
    .where(
      and(
        eq(aiActionProposals.id, input.proposalId),
        eq(aiActionProposals.workspaceId, input.workspaceId),
        eq(aiActionProposals.requesterId, input.requesterId)
      )
    )
    .limit(1);
  if (!proposal) throw notFound('Proposal not found');
  return proposal;
};

const ensurePending = async (
  proposal: typeof aiActionProposals.$inferSelect,
  now = new Date()
) => {
  if (proposal.expiresAt <= now) {
    await db
      .update(aiActionProposals)
      .set({ status: 'EXPIRED' })
      .where(
        and(
          eq(aiActionProposals.id, proposal.id),
          eq(aiActionProposals.status, 'PENDING')
        )
      );
    throw gone('This proposal has expired. Ask Pulse to prepare a new one.');
  }
  if (proposal.status !== 'PENDING') {
    throw conflict('This proposal is no longer pending');
  }
};

export const editProposal = async (input: {
  workspaceId: string;
  requesterId: string;
  proposalId: string;
  changes: Record<string, unknown>;
}) => {
  const proposal = await getOwnedProposal(input);
  await ensurePending(proposal);
  const existing = parsePayload(proposal.actionType, proposal.payload);
  let candidate: Record<string, unknown> = { ...existing };

  if (proposal.actionType === 'CREATE_TASK') {
    const allowed = [
      'projectId',
      'title',
      'description',
      'status',
      'priority',
      'assigneeId',
      'dueDate',
    ];
    if (Object.keys(input.changes).some((key) => !allowed.includes(key))) {
      throw badRequest('The proposal contains an unsupported editable field');
    }
    candidate = {
      ...candidate,
      ...Object.fromEntries(
        Object.entries(input.changes).filter(([key]) => allowed.includes(key))
      ),
    };
    if (typeof candidate.projectId === 'string') {
      const project = await getProjectById(input.workspaceId, candidate.projectId);
      candidate.projectName = project.name;
    }
    if ('assigneeId' in input.changes) {
      if (candidate.assigneeId === null) candidate.assigneeName = null;
      else if (typeof candidate.assigneeId === 'string') {
        const members = await getWorkspaceMembers({
          workspaceId: input.workspaceId,
          limit: '100',
        });
        const member = members.find((item) => item.userId === candidate.assigneeId);
        if (!member) throw notFound('Assignee not found in this workspace');
        candidate.assigneeName = member.fullName;
      }
    }
  } else if (proposal.actionType === 'UPDATE_TASK') {
    const allowed = [
      'title',
      'description',
      'status',
      'priority',
      'assigneeId',
      'dueDate',
    ];
    if (Object.keys(input.changes).some((key) => !allowed.includes(key))) {
      throw badRequest('Task and project targets cannot be changed');
    }
    candidate = {
      ...candidate,
      ...Object.fromEntries(
        Object.entries(input.changes).filter(([key]) => allowed.includes(key))
      ),
    };
    if ('assigneeId' in input.changes) {
      if (candidate.assigneeId === null) candidate.assigneeName = null;
      else if (typeof candidate.assigneeId === 'string') {
        const members = await getWorkspaceMembers({
          workspaceId: input.workspaceId,
          limit: '100',
        });
        const member = members.find((item) => item.userId === candidate.assigneeId);
        if (!member) throw notFound('Assignee not found in this workspace');
        candidate.assigneeName = member.fullName;
      }
    }
  } else {
    if (Object.keys(input.changes).some((key) => key !== 'content')) {
      throw badRequest('Comment and task targets cannot be changed');
    }
    candidate = { ...candidate, content: input.changes.content };
  }

  const payload = parsePayload(proposal.actionType, candidate);
  await getProjectById(input.workspaceId, payload.projectId);
  if ('taskId' in payload) {
    await getTaskById(input.workspaceId, payload.projectId, payload.taskId);
  }
  const [updated] = await db
    .update(aiActionProposals)
    .set({ payload })
    .where(
      and(eq(aiActionProposals.id, proposal.id), eq(aiActionProposals.status, 'PENDING'))
    )
    .returning();
  if (!updated) throw conflict('This proposal changed before it could be edited');
  return sanitizeProposal(updated);
};

export const rejectProposal = async (input: {
  workspaceId: string;
  requesterId: string;
  proposalId: string;
}) => {
  const proposal = await getOwnedProposal(input);
  await ensurePending(proposal);
  const [rejected] = await db
    .update(aiActionProposals)
    .set({ status: 'REJECTED' })
    .where(
      and(eq(aiActionProposals.id, proposal.id), eq(aiActionProposals.status, 'PENDING'))
    )
    .returning();
  if (!rejected) throw conflict('This proposal is no longer pending');
  return sanitizeProposal(rejected);
};

export const approveProposal = async (input: {
  workspaceId: string;
  requesterId: string;
  proposalId: string;
  now?: Date | undefined;
}) => {
  const now = input.now ?? new Date();
  const existing = await getOwnedProposal(input);
  await ensurePending(existing, now);
  let executionStarted = false;

  try {
    return await db.transaction(async (tx) => {
      const [membership] = await tx
        .select({ role: workspaceMembers.role })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, input.workspaceId),
            eq(workspaceMembers.userId, input.requesterId)
          )
        )
        .limit(1);
      if (!membership) throw notFound('Proposal not found');
      if (membership.role === 'VIEWER') {
        throw forbidden('Your current workspace role cannot approve changes');
      }

      const [claimed] = await tx
        .update(aiActionProposals)
        .set({ status: 'APPROVED' })
        .where(
          and(
            eq(aiActionProposals.id, input.proposalId),
            eq(aiActionProposals.workspaceId, input.workspaceId),
            eq(aiActionProposals.requesterId, input.requesterId),
            eq(aiActionProposals.status, 'PENDING')
          )
        )
        .returning();
      if (!claimed) throw conflict('This proposal is no longer pending');
      if (claimed.expiresAt <= now) throw gone('This proposal has expired');
      executionStarted = true;
      const payload = parsePayload(claimed.actionType, claimed.payload);

      let resource: unknown;
      let notification: unknown = null;
      if (claimed.actionType === 'CREATE_TASK') {
        const value = proposalPayloadSchemas.CREATE_TASK.parse(payload);
        resource = await createTaskInTransaction(tx, {
          workspaceId: input.workspaceId,
          projectId: value.projectId,
          createdById: input.requesterId,
          title: value.title,
          description: value.description,
          status: value.status,
          priority: value.priority,
          assigneeId: value.assigneeId,
          dueDate: value.dueDate,
        });
      } else if (claimed.actionType === 'UPDATE_TASK') {
        const value = proposalPayloadSchemas.UPDATE_TASK.parse(payload);
        const result = await updateTaskInTransaction(tx, {
          workspaceId: input.workspaceId,
          projectId: value.projectId,
          taskId: value.taskId,
          actorId: input.requesterId,
          title: value.title,
          description: value.description,
          status: value.status,
          priority: value.priority,
          assigneeId: value.assigneeId,
          dueDate: value.dueDate,
        });
        resource = result.task;
        notification = result.notification;
      } else {
        const value = proposalPayloadSchemas.ADD_COMMENT.parse(payload);
        resource = await createCommentInTransaction(tx, {
          workspaceId: input.workspaceId,
          projectId: value.projectId,
          taskId: value.taskId,
          userId: input.requesterId,
          content: value.content,
        });
      }

      await tx.insert(auditLogs).values({
        workspaceId: input.workspaceId,
        actorId: input.requesterId,
        action: `AI_ASSISTED_${claimed.actionType}`,
        entityType: 'ai_action_proposal',
        entityId: claimed.id,
        oldValue: null,
        newValue: {
          assistant: 'Pulse',
          proposalId: claimed.id,
          approvedById: input.requesterId,
          actionType: claimed.actionType,
        },
      });

      const [executed] = await tx
        .update(aiActionProposals)
        .set({ status: 'EXECUTED', executedAt: now })
        .where(
          and(
            eq(aiActionProposals.id, claimed.id),
            eq(aiActionProposals.status, 'APPROVED')
          )
        )
        .returning();
      if (!executed) throw conflict('The proposal could not be completed');

      return { proposal: sanitizeProposal(executed), resource, notification };
    });
  } catch (error) {
    if (executionStarted) {
      await db
        .update(aiActionProposals)
        .set({ status: 'FAILED' })
        .where(
          and(
            eq(aiActionProposals.id, input.proposalId),
            eq(aiActionProposals.status, 'PENDING')
          )
        );
    }
    throw error;
  }
};

export const validateProposalTarget = async (input: {
  workspaceId: string;
  actionType: ProposalAction;
  payload: unknown;
}) => {
  const payload = parsePayload(input.actionType, input.payload);
  const project = await getProjectById(input.workspaceId, payload.projectId);
  if ('taskId' in payload) {
    await getTaskById(input.workspaceId, project.id, payload.taskId);
  }
  return payload;
};
