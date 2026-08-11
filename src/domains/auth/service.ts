import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

import { env } from '../../config/env.js';
import { db } from '../../db/index.js';
import { users } from '../../db/schema/users.js';
import { APP_ERROR_CODES, AppError } from '../../utils/AppError.js';

const safeUserColumns = {
  id: users.id,
  email: users.email,
  fullName: users.fullName,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

export const register = async (input: {
  email: string;
  password: string;
  fullName: string;
}) => {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const [user] = await db
    .insert(users)
    .values({ email: input.email, fullName: input.fullName, passwordHash })
    .returning(safeUserColumns);
  if (!user) throw AppError.internalError('Failed to create user');
  return user;
};

export const login = async (input: { email: string; password: string }) => {
  const [account] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);
  if (!account || !(await bcrypt.compare(input.password, account.passwordHash))) {
    throw new AppError('Invalid email or password', {
      statusCode: 401,
      code: APP_ERROR_CODES.INVALID_CREDENTIALS,
    });
  }
  const token = jwt.sign({ userId: account.id, email: account.email }, env.JWT_SECRET, {
    expiresIn: '7d',
  });
  return {
    token,
    user: { id: account.id, email: account.email, fullName: account.fullName },
  };
};

export const restoreSession = async (userId: string) => {
  const [user] = await db
    .select(safeUserColumns)
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) throw AppError.unauthorized('User account no longer exists');
  return user;
};

export const guestDemoLogin = async () => {
  const demoEmail = 'guest.evaluator@coordra.app';
  let [account] = await db
    .select()
    .from(users)
    .where(eq(users.email, demoEmail))
    .limit(1);

  if (!account) {
    const passwordHash = await bcrypt.hash('GuestDemoPassword123!', 10);
    const [newUser] = await db
      .insert(users)
      .values({ email: demoEmail, fullName: 'Guest Evaluator', passwordHash })
      .returning();
    if (!newUser) throw AppError.internalError('Failed to initialize demo guest user');
    account = newUser;
  }

  const token = jwt.sign({ userId: account.id, email: account.email }, env.JWT_SECRET, {
    expiresIn: '7d',
  });
  return {
    token,
    user: { id: account.id, email: account.email, fullName: account.fullName },
  };
};
