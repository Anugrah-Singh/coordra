import {
  NextFunction,
  Request,
  Response,
} from 'express';

import { env } from '../config/env.js';

const SAFE_METHODS = new Set([
  'GET',
  'HEAD',
  'OPTIONS',
]);

type RequestOriginResult =
  | {
      status: 'present';
      value: string;
    }
  | {
      status: 'missing';
    }
  | {
      status: 'invalid';
    };

const getRequestOrigin = (
  req: Request
): RequestOriginResult => {
  const origin = req.get('origin');

  if (origin) {
    try {
      return {
        status: 'present',
        value: new URL(origin).origin,
      };
    } catch {
      return {
        status: 'invalid',
      };
    }
  }

  const referer = req.get('referer');

  if (!referer) {
    return {
      status: 'missing',
    };
  }

  try {
    return {
      status: 'present',
      value: new URL(referer).origin,
    };
  } catch {
    return {
      status: 'invalid',
    };
  }
};

export const requireTrustedOrigin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const requestOrigin =
    getRequestOrigin(req);

  if (requestOrigin.status === 'invalid') {
    res.status(403).json({
      success: false,
      message:
        'Request origin could not be verified',
    });

    return;
  }

  if (requestOrigin.status === 'missing') {
    if (env.NODE_ENV !== 'production') {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message:
        'Request origin could not be verified',
    });

    return;
  }

  const trustedOrigin =
    new URL(env.FRONTEND_URL).origin;

  if (requestOrigin.value !== trustedOrigin) {
    res.status(403).json({
      success: false,
      message:
        'Request origin is not allowed',
    });

    return;
  }

  next();
};