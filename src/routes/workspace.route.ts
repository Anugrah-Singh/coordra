import { Router } from 'express';

import {
  createWorkspace,
  getUserWorkspaces,
} from '../controllers/workspace.controllers.js';

import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', authMiddleware, createWorkspace);

router.get('/', authMiddleware, getUserWorkspaces);

export default router;