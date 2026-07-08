import { Router } from 'express';

import { requireAuth } from '../middlewares/auth.middleware.js';

import {
  requireWorkspaceMember,
  requireWorkspaceAdmin,
} from '../middlewares/rbac.middleware.js';

import { validate } from '../middlewares/validate.middleware.js';

import {
  addMemberSchema,
  updateMemberRoleSchema,
  removeMemberSchema,
} from '../schemas/member.schema.js';

import {
  addMemberHandler,
  getWorkspaceMembersHandler,
  updateMemberRoleHandler,
  removeMemberHandler,
} from '../controllers/member.controller.js';

const router = Router({ mergeParams: true });

router.get(
  '/',
  requireAuth,
  requireWorkspaceMember,
  getWorkspaceMembersHandler
);

router.post(
  '/',
  requireAuth,
  requireWorkspaceAdmin,
  validate(addMemberSchema),
  addMemberHandler
);

router.patch(
  '/:memberId/role',
  requireAuth,
  requireWorkspaceAdmin,
  validate(updateMemberRoleSchema),
  updateMemberRoleHandler
);

router.delete(
  '/:memberId',
  requireAuth,
  requireWorkspaceAdmin,
  validate(removeMemberSchema),
  removeMemberHandler
);

export default router;