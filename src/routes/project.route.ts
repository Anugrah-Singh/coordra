import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireWorkspaceMember } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createProjectSchema } from '../schemas/project.schema.js';
import { createProjectHandler, getWorkspaceProjectsHandler } from '../controllers/project.controller.js';

const router = Router({ mergeParams: true});

router.post(
    '/',
    requireAuth,
    requireWorkspaceMember,
    validate(createProjectSchema),
    createProjectHandler
);

router.get(
    '/',
    requireAuth,
    requireWorkspaceMember,
    getWorkspaceProjectsHandler
);

export default router;