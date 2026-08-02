import { Router } from 'express';
import { z } from 'zod';

import {
  requireWorkspaceAdmin,
  requireWorkspaceMember,
} from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { emitWorkspaceEvent } from '../../utils/socketEvents.js';
import {
  addWorkspaceMemberByEmail,
  getWorkspaceMembers,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
} from './service.js';

const role = z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']);
const workspaceId = z.uuid('Invalid workspace ID');
const paging = { page: z.string().optional(), limit: z.string().optional() };
export const addMemberSchema = z.object({
  params: z.object({ workspaceId }),
  body: z.object({ email: z.email().trim().toLowerCase(), role: role.default('MEMBER') }),
});
export const updateMemberRoleSchema = z.object({
  params: z.object({ workspaceId, memberId: z.uuid() }),
  body: z.object({ role }),
});
export const removeMemberSchema = z.object({
  params: z.object({ workspaceId, memberId: z.uuid() }),
});
export const getWorkspaceMembersSchema = z.object({
  params: z.object({ workspaceId }),
  query: z.object(paging),
});

const router = Router({ mergeParams: true });
router.get(
  '/',
  requireWorkspaceMember,
  validate(getWorkspaceMembersSchema),
  async (req, res) => {
    res.json({
      data: await getWorkspaceMembers({
        workspaceId: String(req.params.workspaceId),
        page: req.query.page as string | undefined,
        limit: req.query.limit as string | undefined,
      }),
    });
  }
);
router.post('/', requireWorkspaceAdmin, validate(addMemberSchema), async (req, res) => {
  const result = await addWorkspaceMemberByEmail({
    workspaceId: String(req.params.workspaceId),
    actorId: res.locals.userId,
    email: req.body.email,
    role: req.body.role,
  });
  const member = {
    membershipId: result.membership.id,
    userId: result.user.id,
    email: result.user.email,
    fullName: result.user.fullName,
    role: result.membership.role,
  };
  emitWorkspaceEvent(String(req.params.workspaceId), 'member_added', { member });
  res.status(201).json({ data: member });
});
router.patch(
  '/:memberId/role',
  requireWorkspaceAdmin,
  validate(updateMemberRoleSchema),
  async (req, res) => {
    const member = await updateWorkspaceMemberRole({
      workspaceId: String(req.params.workspaceId),
      actorId: res.locals.userId,
      memberId: String(req.params.memberId),
      role: req.body.role,
    });
    emitWorkspaceEvent(String(req.params.workspaceId), 'member_role_updated', {
      memberId: String(req.params.memberId),
    });
    res.json({ data: member });
  }
);
router.delete(
  '/:memberId',
  requireWorkspaceAdmin,
  validate(removeMemberSchema),
  async (req, res) => {
    const member = await removeWorkspaceMember({
      workspaceId: String(req.params.workspaceId),
      actorId: res.locals.userId,
      memberId: String(req.params.memberId),
    });
    emitWorkspaceEvent(String(req.params.workspaceId), 'member_removed', {
      memberId: String(req.params.memberId),
    });
    res.json({ data: member });
  }
);

export default router;
