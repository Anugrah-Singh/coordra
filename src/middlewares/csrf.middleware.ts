import {
  NextFunction,
  Request,
  Response,
} from 'express';

import { env } from '../config/env.js';

import {
  APP_ERROR_CODES,
} from '../utils/AppError.js';

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

const sendOriginError = (
  res: Response,
  message: string
): void => {
  res.status(403).json({
    success: false,
    code: APP_ERROR_CODES.FORBIDDEN,
    message,
  });
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

  if (
    requestOrigin.status === 'invalid'
  ) {
    sendOriginError(
      res,
      'Request origin could not be verified'
    );

    return;
  }

  if (
    requestOrigin.status === 'missing'
  ) {
    if (
      env.NODE_ENV !== 'production'
    ) {
      next();
      return;
    }

    sendOriginError(
      res,
      'Request origin could not be verified'
    );

    return;
  }

  const trustedOrigin =
    new URL(
      env.FRONTEND_URL
    ).origin;

  if (
    requestOrigin.value !==
    trustedOrigin
  ) {
    sendOriginError(
      res,
      'Request origin is not allowed'
    );

    return;
  }

  next();
};