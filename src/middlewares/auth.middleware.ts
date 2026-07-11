import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const requireAuth = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.cookies.auth_token;

        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }

        const decoded = jwt.verify(
            token, env.JWT_SECRET
        ) as { userId: string };

        res.locals.userId = decoded.userId;

        next();
    } catch (error: any) {
        console.error("Bouncer Error:", error.message || error);

        res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
            real_reason: error.message
        });
    }
};