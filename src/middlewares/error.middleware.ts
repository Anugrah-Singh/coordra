import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const globalErrorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const errMessage = err?.message || err;
    const errCode = err?.code;
    const errStack = err?.stack;

    console.error(`[ERROR] ${req.method} ${req.path} >>`, errMessage);

    if (err instanceof ZodError) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: err.issues.map(e => ({ 
                path: e.path.join('.'),
                message: e.message,
            })),
        });
        return;
    }

    if (errCode === '23505') {
        res.status(409).json({
            sucess: false,
            message: 'A record with this unique identifier already exists.',
        });
        return;
    }

    const statusCode = Number(err?.statusCode) || 500;
    const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : errMessage || 'Something went wrong';

    res.status(statusCode).json({
        success: false,
        message: message,
        // Only leak stack traces when we are actively developing locally
        stack: process.env.NDE_ENV === 'development' ? errStack : undefined,
    });
    return;
};