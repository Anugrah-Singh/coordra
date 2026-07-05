console.log("Workspace ROuter file executed");
import { Router } from 'express';
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

router.get('/', requireAuth, getUserWorkspacesHandler);

export default router;