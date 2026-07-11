import {
  NextFunction,
  Request,
  Response,
} from 'express';

import jwt, {
  JwtPayload,
} from 'jsonwebtoken';

import { env } from '../config/env.js';
import { AUTH_COOKIE_NAME } from '../utils/auth-cookie.js';

type AuthTokenPayload = JwtPayload & {
  userId?: string;
};

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token =
    req.cookies[AUTH_COOKIE_NAME];

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });

    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      env.JWT_SECRET
    ) as AuthTokenPayload;

    if (!decoded.userId) {
      res.status(401).json({
        success: false,
        message:
          'Invalid or expired token',
      });

      return;
    }

    res.locals.userId = decoded.userId;

    next();
  } catch {
    res.status(401).json({
      success: false,
      message:
        'Invalid or expired token',
    });
  }
};