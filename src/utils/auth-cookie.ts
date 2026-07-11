import { CookieOptions } from 'express';

import { env } from '../config/env.js';

export const AUTH_COOKIE_NAME = 'auth_token';

export const getAuthCookieOptions =
  (): CookieOptions => ({
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite:
      env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });