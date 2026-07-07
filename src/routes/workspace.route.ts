import { Router } from 'express';
import { addMemberHandler, getWorkspaceMembersHandler } from '../controllers/member.controller.js';
import { requireWorkspaceOwner, requireWorkspaceMember } from '../middlewares/rbac.middleware.js';
import { addMemberSchema } from '../schemas/member.schema.js';
import { createWorkspaceHandler, getUserWorkspacesHandler } from '../controllers/workspace.controllers.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createWorkspaceSchema } from '../schemas/workspace.schema.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Define the POST route and string our middleware and controller together
router.post(
    '/',
    requireAuth,
    validate(createWorkspaceSchema), // Step A: The Bouncer checks the payload
    createWorkspaceHandler           // Step B: The Manager handles the request
);

router.post(
    '/:workspaceId/members',
    requireAuth,
    requireWorkspaceOwner,
    validate(addMemberSchema),
    addMemberHandler
);

router.get('/', requireAuth, getUserWorkspacesHandler);

router.get(
    '/:workspaceId/members',
    requireAuth,
    requireWorkspaceMember,
    getWorkspaceMembersHandler
);

export default router;