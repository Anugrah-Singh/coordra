import { rateLimit } from 'express-rate-limit';

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

    skipSuccessfulRequests:
      options.skipSuccessfulRequests ?? false,

    // Do not count browser CORS preflight requests.
    skip: (req) => req.method === 'OPTIONS',

    statusCode: 429,

    message: {
      success: false,
      message: options.message,
    },

    // Fail closed if the limiter's store fails.
    passOnStoreError: false,
  });

export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  identifier: 'general-api',
  message:
    'Too many API requests. Please wait before trying again.',
});

export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  identifier: 'login-attempts',
  message:
    'Too many failed login attempts. Please try again later.',
  // Successful logins do not consume the failed-login quota.
  skipSuccessfulRequests: true,
});

export const registrationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  identifier: 'user-registration',
  message:
    'Too many account creation attempts. Please try again later.',
});

export const inviteCreationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  identifier: 'workspace-invites',
  message:
    'Too many workspace invites created. Please try again later.',
});