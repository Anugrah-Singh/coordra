import { Router } from 'express';

import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireWorkspaceAdmin } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

import { getWorkspaceAuditLogsSchema } from '../schemas/auditLog.schema.js';

import { getWorkspaceAuditLogsHandler } from '../controllers/auditLog.controller.js';

const router = Router({ mergeParams: true });

router.get(
  '/',
  requireAuth,
  requireWorkspaceAdmin,
  validate(getWorkspaceAuditLogsSchema),
  getWorkspaceAuditLogsHandler
);

export default router;