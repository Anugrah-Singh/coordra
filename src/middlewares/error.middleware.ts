import {
  NextFunction,
  Request,
  Response,
} from 'express';

import { ZodError } from 'zod';

import { env } from '../config/env.js';

import {
  APP_ERROR_CODES,
  AppError,
} from '../utils/AppError.js';

type DatabaseError = Error & {
  code?: string;
  cause?: {
    code?: string;
  };
};

const getDatabaseErrorCode = (
  error: unknown
): string | undefined => {
  if (!(error instanceof Error)) {
    return undefined;
  }

  const databaseError =
    error as DatabaseError;

  return (
    databaseError.code ??
    databaseError.cause?.code
  );
};

export const globalErrorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const errorForLogging =
    error instanceof Error
      ? error
      : new Error(
          'A non-Error value was thrown'
        );

  console.error(
    `[ERROR] ${req.method} ${req.path}`,
    {
      name: errorForLogging.name,
      message: errorForLogging.message,
      stack:
        env.NODE_ENV === 'development'
          ? errorForLogging.stack
          : undefined,
    }
  );

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      code:
        APP_ERROR_CODES.VALIDATION_ERROR,
      message: 'Validation failed',
      errors: error.issues.map(
        (issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })
      ),
    });

    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      code: error.code,
      message: error.message,
      details: error.details,
    });

    return;
  }

  const databaseErrorCode =
    getDatabaseErrorCode(error);

  if (databaseErrorCode === '23505') {
    res.status(409).json({
      success: false,
      code: APP_ERROR_CODES.CONFLICT,
      message:
        'A record with this unique identifier already exists.',
    });

    return;
  }

  if (
    error instanceof Error &&
    'type' in error &&
    error.type === 'entity.too.large'
  ) {
    res.status(413).json({
      success: false,
      code:
        APP_ERROR_CODES.PAYLOAD_TOO_LARGE,
      message:
        'Request body is too large.',
    });

    return;
  }

  res.status(500).json({
    success: false,
    code: APP_ERROR_CODES.INTERNAL_ERROR,
    message:
      env.NODE_ENV === 'production'
        ? 'Internal server error'
        : errorForLogging.message,
    stack:
      env.NODE_ENV === 'development'
        ? errorForLogging.stack
        : undefined,
  });
};