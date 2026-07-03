import { Request, Response, NextFunction } from 'express';
import { z, ZodObject } from 'zod';

interface ValidationErrorIssue {
    field: string;
    message: string;
}

export const validate = (schema: z.ZodObject<any>) => {
    return async (req: Request, res: Response, next: NextFunction) => {

        const result = await schema.safeParseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: result.error.issues.map((iss): ValidationErrorIssue => ({
                    field: iss.path.join('.'),
                    message: iss.message,
                })),
            });
        }
        // Overwrite the request to strip malicious payload fields

        req.body = result.data.body;
        
        Object.assign(req.query, result.data.query);
        Object.assign(req.params, result.data.params);

        return next();
    };
};