import {
  NextFunction,
  Request,
  Response,
} from 'express';

import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';

import { db } from '../db/index.js';
import { users } from '../db/schema/users.js';

import { LoginInput } from '../schemas/auth.schema.js';

import {
  APP_ERROR_CODES,
} from '../utils/AppError.js';

import {
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
} from '../utils/auth-cookie.js';

export const login = async (
  req: Request<
    Record<string, never>,
    unknown,
    LoginInput
  >,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      email,
      password,
    } = req.body;

    const [user] = await db
      .select()
      .from(users)
      .where(
        eq(users.email, email)
      )
      .limit(1);

    if (!user) {
      res.status(401).json({
        success: false,

        code:
          APP_ERROR_CODES
            .INVALID_CREDENTIALS,

        message:
          'Invalid email or password',
      });

      return;
    }

    const isPasswordValid =
      await bcrypt.compare(
        password,
        user.passwordHash
      );

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,

        code:
          APP_ERROR_CODES
            .INVALID_CREDENTIALS,

        message:
          'Invalid email or password',
      });

      return;
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      env.JWT_SECRET,
      {
        expiresIn: '7d',
      }
    );

    res.cookie(
      AUTH_COOKIE_NAME,
      token,
      getAuthCookieOptions()
    );

    res.status(200).json({
      success: true,

      message:
        'Logged in successfully',

      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName:
            user.fullName,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (
  _req: Request,
  res: Response
): void => {
  res.clearCookie(
    AUTH_COOKIE_NAME,
    getAuthCookieOptions()
  );

  res.status(200).json({
    success: true,

    message:
      'Logged out successfully',
  });
};

export const getMe = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId =
      res.locals.userId as string;

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        fullName:
          users.fullName,
        createdAt:
          users.createdAt,
        updatedAt:
          users.updatedAt,
      })
      .from(users)
      .where(
        eq(users.id, userId)
      )
      .limit(1);

    if (!user) {
      res.status(401).json({
        success: false,

        code:
          APP_ERROR_CODES
            .INVALID_AUTH_TOKEN,

        message:
          'User account no longer exists',
      });

      return;
    }

    res.status(200).json({
      success: true,

      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};