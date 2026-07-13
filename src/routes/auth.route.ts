import { Router } from 'express';

import {
  getMe,
  login,
  logout,
} from '../controllers/auth.controller.js';

import { requireAuth } from '../middlewares/auth.middleware.js';

import { loginRateLimiter } from '../middlewares/rateLimit.middleware.js';

import { validate } from '../middlewares/validate.middleware.js';

import { loginSchema } from '../schemas/auth.schema.js';

const router = Router();

router.post(
  '/login',
  loginRateLimiter,
  validate(loginSchema),
  login
);

router.post(
  '/logout',
  logout
);

router.get(
  '/me',
  requireAuth,
  getMe
);

export default router;