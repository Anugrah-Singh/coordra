import { workspaceParams, projectParams, taskParams, wId } from '../shared.params.js';
import { Router } from 'express';
import { z } from 'zod';

import { runPulseMessage } from '../../ai/provider.js';
import { isValidTimeZone } from '../../ai/resolution.js';
import { env } from '../../config/env.js';
import {
  assistantIpRateLimiter,
  assistantUserRateLimiter,
} from '../../middlewares/rateLimit.middleware.js';
import { requireWorkspaceMember } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { emitUserEvent, emitWorkspaceEvent } from '../../utils/socketEvents.js';
import { getProjectById } from '../projects/service.js';
import { getWorkspaceById } from '../workspaces/service.js';
import { approveProposal, editProposal, rejectProposal } from './service.js';

const params = z.object({ workspaceId: z.uuid() });
const proposalParams = params.extend({ proposalId: z.uuid() });
const historyMessage = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(2_000),
});
export const assistantMessageSchema = z.object({
  params,
  body: z
    .object({
      message: z.string().trim().min(1).max(2_000),
      projectId: z.uuid().optional(),
      timeZone: z.string().trim().refine(isValidTimeZone, 'Invalid IANA time zone'),
      history: z.array(historyMessage).max(10).default([]),
    })
    .refine(
      (value) =>
        value.message.length +
          value.history.reduce((total, item) => total + item.content.length, 0) <=
        12_000,
      { message: 'Message history must not exceed 12,000 characters', path: ['history'] }
    ),
});
export const editProposalSchema = z.object({
  params: proposalParams,
  body: z
    .record(z.string(), z.unknown())
    .refine(
      (value) => Object.keys(value).length > 0,
      'At least one proposal field is required'
    ),
});
export const proposalActionSchema = z.object({ params: proposalParams });

const router = Router({ mergeParams: true });
router.use(requireWorkspaceMember);

router.get('/status', (req, res) => {
  res.json({ data: { enabled: env.AI_ENABLED } });
});

router.post(
  '/messages',
  assistantIpRateLimiter,
  assistantUserRateLimiter,
  validate(assistantMessageSchema),
  async (req, res) => {
    const workspaceId = String(req.params.workspaceId);
    if (req.body.projectId) {
      await getProjectById(workspaceId, req.body.projectId);
    }
    const workspace = await getWorkspaceById(workspaceId);
    const result = await runPulseMessage({
      workspaceName: workspace.name,
      timeZone: req.body.timeZone,
      history: req.body.history,
      message: req.body.message,
      toolContext: {
        workspaceId: String(req.params.workspaceId),
        requesterId: res.locals.userId,
        role: res.locals.workspaceRole,
        projectId: req.body.projectId,
        now: new Date(),
      },
    });
    res.json({ data: result });
  }
);

router.patch('/proposals/:proposalId', validate(editProposalSchema), async (req, res) => {
  res.json({
    data: await editProposal({
      workspaceId: String(req.params.workspaceId),
      requesterId: res.locals.userId,
      proposalId: String(req.params.proposalId),
      changes: req.body,
    }),
  });
});

router.post(
  '/proposals/:proposalId/reject',
  validate(proposalActionSchema),
  async (req, res) => {
    res.json({
      data: await rejectProposal({
        workspaceId: String(req.params.workspaceId),
        requesterId: res.locals.userId,
        proposalId: String(req.params.proposalId),
      }),
    });
  }
);

router.post(
  '/proposals/:proposalId/approve',
  validate(proposalActionSchema),
  async (req, res) => {
    const workspaceId = String(req.params.workspaceId);
    const result = await approveProposal({
      workspaceId: String(req.params.workspaceId),
      requesterId: res.locals.userId,
      proposalId: String(req.params.proposalId),
    });
    emitWorkspaceEvent(workspaceId, 'workspace:changed', {
      resource: result.proposal.actionType === 'ADD_COMMENT' ? 'comment' : 'task',
      action: 'ai-assisted',
      proposalId: result.proposal.id,
    });
    if (
      result.notification &&
      typeof result.notification === 'object' &&
      'userId' in result.notification &&
      'id' in result.notification
    ) {
      emitUserEvent(String(result.notification.userId), 'notifications:changed', {
        action: 'created',
        notificationId: result.notification.id,
      });
    }
    res.json({ data: result });
  }
);

export default router;
