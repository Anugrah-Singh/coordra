import { Router } from 'express';
import { z } from 'zod';

import { requireAuth } from '../../middlewares/auth.middleware.js';
import {
  requireWorkspaceAdmin,
  requireWorkspaceMember,
  requireWorkspaceOwner,
} from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { emitWorkspaceEvent } from '../../utils/socketEvents.js';
import activityRoutes from '../activity/route.js';
import assistantRoutes from '../assistant/route.js';
import inviteRoutes from '../invites/route.js';
import labelRoutes from '../labels/route.js';
import memberRoutes from '../members/route.js';
import projectRoutes from '../projects/route.js';
import {
  createWorkspace,
  deleteWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  transferWorkspaceOwnership,
  updateWorkspace,
} from './service.js';

const name = z.string().trim().min(3).max(50);
const params = z.object({ workspaceId: z.uuid('Invalid workspace ID') });
export const createWorkspaceSchema = z.object({ body: z.object({ name }) });
export const getWorkspaceSchema = z.object({ params });
export const updateWorkspaceSchema = z.object({ params, body: z.object({ name }) });
export const deleteWorkspaceSchema = z.object({
  params,
  body: z.object({ confirmationName: name }),
});
export const transferWorkspaceOwnerSchema = z.object({
  params,
  body: z.object({ newOwnerMemberId: z.uuid('Invalid member ID') }),
});

const router = Router();
router.use(requireAuth);

router.post('/', validate(createWorkspaceSchema), async (req, res) => {
  res.status(201).json({
    data: await createWorkspace({ name: req.body.name, ownerId: res.locals.userId }),
  });
});
router.get('/', async (_req, res) => {
  res.json({ data: await getUserWorkspaces(res.locals.userId) });
});
router.get(
  '/:workspaceId',
  requireWorkspaceMember,
  validate(getWorkspaceSchema),
  async (req, res) => {
    res.json({ data: await getWorkspaceById(String(req.params.workspaceId)) });
  }
);
router.patch(
  '/:workspaceId',
  requireWorkspaceAdmin,
  validate(updateWorkspaceSchema),
  async (req, res) => {
    const workspace = await updateWorkspace({
      workspaceId: String(req.params.workspaceId),
      actorId: res.locals.userId,
      name: req.body.name,
    });
    emitWorkspaceEvent(String(req.params.workspaceId), 'workspace_updated', {
      workspace,
    });
    res.json({ data: workspace });
  }
);
router.patch(
  '/:workspaceId/transfer-owner',
  requireWorkspaceOwner,
  validate(transferWorkspaceOwnerSchema),
  async (req, res) => {
    const result = await transferWorkspaceOwnership({
      workspaceId: String(req.params.workspaceId),
      currentOwnerId: res.locals.userId,
      newOwnerMemberId: req.body.newOwnerMemberId,
    });
    emitWorkspaceEvent(String(req.params.workspaceId), 'owner_transferred', {
      oldOwnerId: res.locals.userId,
      newOwnerMemberId: req.body.newOwnerMemberId,
    });
    res.json({ data: result });
  }
);
router.delete(
  '/:workspaceId',
  requireWorkspaceOwner,
  validate(deleteWorkspaceSchema),
  async (req, res) => {
    const workspace = await deleteWorkspace({
      workspaceId: String(req.params.workspaceId),
      actorId: res.locals.userId,
      confirmationName: req.body.confirmationName,
    });
    emitWorkspaceEvent(String(req.params.workspaceId), 'workspace_deleted', {});
    res.json({ data: workspace });
  }
);

router.use('/:workspaceId/audit-logs', activityRoutes);
router.use('/:workspaceId/assistant', assistantRoutes);
router.use('/:workspaceId/labels', labelRoutes);
router.use('/:workspaceId/invites', inviteRoutes);
router.use('/:workspaceId/members', memberRoutes);
router.use('/:workspaceId/projects', projectRoutes);

export default router;
