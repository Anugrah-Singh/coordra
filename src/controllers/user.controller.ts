import { Request, Response, NextFunction } from 'express';

import { createUser } from '../services/user.service.js';
import { CreateUserInput } from '../schemas/user.schema.js';

import { internalError } from '../utils/httpErrors.js';

export const createUserHandler = async (
  req: Request<{}, {}, CreateUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const newUser = await createUser(req.body);

    if (!newUser) {
      throw internalError('Failed to create user');
    }

    const safeUser = {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: safeUser,
    });
  } catch (error) {
    next(error);
  }
};
