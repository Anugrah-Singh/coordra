import { Request, Response, NextFunction } from 'express';
import { createUserInDb } from '../services/user.service.js';
import { CreateUserInput } from '../schemas/user.schema.js';

export const createUserHandler = async (
    req: Request<{}, {}, CreateUserInput>,
    res: Response,
    next: NextFunction
) => {
    try {
        const newUser = await createUserInDb(req.body);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: newUser,
        });
    } catch (error) {
        next(error);
    }
};