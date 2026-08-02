import { ipKeyGenerator, rateLimit } from 'express-rate-limit';

import { APP_ERROR_CODES } from '../utils/AppError.js';

type LimiterOptions = {
  windowMs: number;
  limit: number;
  identifier: string;
  message: string;
  skipSuccessfulRequests?: boolean;
};

const createRateLimiter = (options: LimiterOptions) =>
  rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,

    standardHeaders: 'draft-8',
    legacyHeaders: false,

    identifier: options.identifier,

    ipv6Subnet: 56,

    skipSuccessfulRequests: options.skipSuccessfulRequests ?? false,

    skip: (req) => req.method === 'OPTIONS',

    statusCode: 429,

    message: {
      success: false,

      code: APP_ERROR_CODES.RATE_LIMITED,

      message: options.message,
    },

    passOnStoreError: false,
  });

export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,

  limit: 1000,

  identifier: 'general-api',

  message: 'Too many API requests. Please wait before trying again.',
});

export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,

  limit: 10,

  identifier: 'login-attempts',

  message: 'Too many failed login attempts. Please try again later.',

  skipSuccessfulRequests: true,
});

export const registrationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,

  limit: 10,

  identifier: 'user-registration',

  message: 'Too many account creation attempts. Please try again later.',
});

export const inviteCreationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,

  limit: 30,

  identifier: 'workspace-invites',

  message: 'Too many workspace invites created. Please try again later.',
});

export const assistantUserRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  identifier: 'pulse-user',
  keyGenerator: (req) =>
    (req as typeof req & { authenticatedUserId?: string }).authenticatedUserId ??
    ipKeyGenerator(req.ip ?? 'unknown'),
  statusCode: 429,
  message: {
    success: false,
    code: APP_ERROR_CODES.RATE_LIMITED,
    message: 'Pulse has reached the hourly limit for this account.',
  },
});

export const assistantIpRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  identifier: 'pulse-ip',
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? 'unknown'),
  statusCode: 429,
  message: {
    success: false,
    code: APP_ERROR_CODES.RATE_LIMITED,
    message: 'Pulse has reached the hourly network limit.',
  },
});
