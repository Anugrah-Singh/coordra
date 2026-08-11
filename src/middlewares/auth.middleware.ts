import { NextFunction, Request, Response } from 'express';

import { verifyAuthToken } from '../utils/verifyToken.js';

import { env } from '../config/env.js';

import { APP_ERROR_CODES } from '../utils/AppError.js';

import { AUTH_COOKIE_NAME } from '../utils/auth-cookie.js';

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies[AUTH_COOKIE_NAME];

  if (!token) {
    res.status(401).json({
      success: false,

      code: APP_ERROR_CODES.AUTHENTICATION_REQUIRED,

      message: 'Authentication required',
    });

    return;
  }

  try {
    const decoded = verifyAuthToken(token);

    res.locals.userId = decoded.userId;

    (req as Request & { authenticatedUserId?: string }).authenticatedUserId =
      decoded.userId;

    next();
  } catch {
    res.status(401).json({
      success: false,

      code: APP_ERROR_CODES.INVALID_AUTH_TOKEN,

      message: 'Invalid or expired token',
    });
  }
};
