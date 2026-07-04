console.log("Workspace ROuter file executed");
import { Router } from 'express';
import { createWorkspaceHandler } from '../controllers/workspace.controllers.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createWorkspaceSchema } from '../schemas/workspace.schema.js';

const router = Router();

// Define the POST route and string our middleware and controller together
router.post(
    '/',
    validate(createWorkspaceSchema), // Step A: The Bouncer checks the payload
    createWorkspaceHandler           // Step B: The Manager handles the request
);

export default router;