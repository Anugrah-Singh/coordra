import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const errMessage = err?.message || 'Something went wrong';
const errCode = err?.code || err?.cause?.code;
  const errStack = err?.stack;

  console.error(`[ERROR] ${req.method} ${req.path} >>`, errMessage);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  if (errCode === '23505') {
    res.status(409).json({
      success: false,
      message: 'A record with this unique identifier already exists.',
    });
    return;
  }

  if (err?.type === 'entity.too.large') {
      res.status(413).json({
      success: false,
      message: 'Request body is too large.',
    });
    return;
  }

  const statusCode = Number(err?.statusCode || err?.status) || 500;

  const message =
    statusCode === 500 && env.NODE_ENV === 'production'
      ? 'Internal server error'
      : errMessage;

  res.status(statusCode).json({
    success: false,
    message,
    stack: env.NODE_ENV === 'development' ? errStack : undefined,
  });
};