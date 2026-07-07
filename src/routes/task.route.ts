import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireWorkspaceMember } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createTaskSchema, updateTaskSchema } from '../schemas/task.schema.js';
import { createTaskHandler, getProjectTasksHandler, updateTaskHandler } from '../controllers/task.controller.js';

const router = Router({ mergeParams: true });

router.post(
    '/',
    requireAuth,
    requireWorkspaceMember,
    validate(createTaskSchema),
    createTaskHandler
);

router.get(
    '/',
    requireAuth,
    requireWorkspaceMember,
    getProjectTasksHandler
);

router.patch(
    '/:taskId',
    requireAuth,
    requireWorkspaceMember,
    validate(updateTaskSchema),
    updateTaskHandler
);

export default router;