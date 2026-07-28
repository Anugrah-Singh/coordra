import { NextFunction, Request, Response } from 'express';

import { z } from 'zod';

import { APP_ERROR_CODES } from '../utils/AppError.js';

type ValidationErrorIssue = {
  field: string;
  message: string;
};

export const validate = (schema: z.ZodObject<any>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await schema.safeParseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (!result.success) {
        const errors: ValidationErrorIssue[] = result.error.issues.map((issue) => ({
          field: issue.path.join('.'),

          message: issue.message,
        }));

        res.status(400).json({
          success: false,

          code: APP_ERROR_CODES.VALIDATION_ERROR,

          message: 'Validation failed',

          errors,
        });

        return;
      }

      if (result.data.body !== undefined) {
        req.body = result.data.body;
      }

      if (result.data.query !== undefined) {
        Object.assign(req.query, result.data.query);
      }

      if (result.data.params !== undefined) {
        Object.assign(req.params, result.data.params);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
