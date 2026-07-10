import { Request, Response, NextFunction } from 'express';

import { createUserInDb } from '../services/user.service.js';
import { CreateUserInput } from '../schemas/user.schema.js';

const createHttpError = (message: string, status: number) => {
  return Object.assign(new Error(message), {
    status,
    statusCode: status,
  });
};

export const createUserHandler = async (
  req: Request<{}, {}, CreateUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const newUser = await createUserInDb(req.body);

    if (!newUser) {
      throw createHttpError('Failed to create user', 500);
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