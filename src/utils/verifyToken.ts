import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env.js';

export type AuthTokenPayload = JwtPayload & { userId?: string; email?: string };

export const verifyAuthToken = (token: string): { userId: string; email?: string } => {
  const decoded = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
  if (!decoded.userId) throw new Error('Invalid authentication token');
  return { userId: decoded.userId, ...(decoded.email ? { email: decoded.email } : {}) };
};
