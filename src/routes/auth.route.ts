import { Router } from 'express';

import {
  getMeHandler,
  loginHandler,
  logoutHandler,
} from '../controllers/auth.controller.js';

import { requireAuth } from '../middlewares/auth.middleware.js';

import { loginRateLimiter } from '../middlewares/rateLimit.middleware.js';

import { validate } from '../middlewares/validate.middleware.js';

import { loginSchema } from '../schemas/auth.schema.js';

const router = Router();

router.post('/login', loginRateLimiter, validate(loginSchema), loginHandler);

router.post('/logout', logoutHandler);

router.get('/me', requireAuth, getMeHandler);

export default router;
