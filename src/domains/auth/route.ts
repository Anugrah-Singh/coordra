import { Router } from 'express';
import { z } from 'zod';

import { requireAuth } from '../../middlewares/auth.middleware.js';
import { loginRateLimiter } from '../../middlewares/rateLimit.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from '../../utils/auth-cookie.js';
import { guestDemoLogin, login, register, restoreSession } from './service.js';

const email = z.email({ message: 'Invalid email address' }).trim().toLowerCase().max(254);
const password = z.string().min(12, 'Password must be at least 12 characters').max(128);

export const registerSchema = z.object({
  body: z.object({
    email,
    password,
    fullName: z.string().trim().min(2).max(100),
  }),
});
export const loginSchema = z.object({
  body: z.object({ email, password: z.string().min(1, 'Password is required').max(128) }),
});

const router = Router();

router.post('/register', validate(registerSchema), async (req, res) => {
  res.status(201).json({ data: await register(req.body) });
});

router.post('/login', loginRateLimiter, validate(loginSchema), async (req, res) => {
  const result = await login(req.body);
  res.cookie(AUTH_COOKIE_NAME, result.token, getAuthCookieOptions());
  res.json({ data: { user: result.user } });
});

router.post('/logout', (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, getAuthCookieOptions());
  res.json({ data: null });
});

router.post('/demo', async (_req, res) => {
  const result = await guestDemoLogin();
  res.cookie(AUTH_COOKIE_NAME, result.token, getAuthCookieOptions());
  res.json({ data: { user: result.user } });
});

router.get('/me', requireAuth, async (_req, res) => {
  res.json({ data: { user: await restoreSession(res.locals.userId as string) } });
});

export default router;
