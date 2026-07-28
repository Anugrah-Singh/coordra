import { db } from '../db/index.js';
import bcrypt from 'bcrypt';
import { users } from '../db/schema/users.js';
import { CreateUserInput } from '../schemas/user.schema.js';

export const createUser = async (data: CreateUserInput) => {
  const saltRounds = 10;
  const hashedSecurePassword = await bcrypt.hash(data.password, saltRounds);
  const result = await db
    .insert(users)
    .values({
      email: data.email,
      fullName: data.fullName,
      passwordHash: hashedSecurePassword,
    })
    .returning();

  return result[0];
};
