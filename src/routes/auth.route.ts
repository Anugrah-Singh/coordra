import { Router } from 'express';
import { login, logout, getMe } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { loginRateLimiter } from '../middlewares/rateLimit.middleware.js';

const router = Router();

router.post(
  '/login',
  loginRateLimiter,
  login
);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);

export default router;