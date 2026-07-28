import { z } from 'zod';

const normalizedEmailSchema = z
  .email({
    message: 'Invalid email address',
  })
  .trim()
  .toLowerCase()
  .max(254, {
    message: 'Email cannot exceed 254 characters',
  });

const passwordSchema = z
  .string({
    error: (issue) =>
      issue.input === undefined ? 'Password is required' : 'Password must be a string',
  })
  .min(12, {
    message: 'Password must be at least 12 characters',
  })
  .max(128, {
    message: 'Password cannot exceed 128 characters',
  });

const fullNameSchema = z
  .string({
    error: (issue) =>
      issue.input === undefined ? 'Full name is required' : 'Full name must be a string',
  })
  .trim()
  .min(2, {
    message: 'Full name must be at least 2 characters',
  })
  .max(100, {
    message: 'Full name cannot exceed 100 characters',
  });

export const createUserSchema = z.object({
  body: z.object({
    email: normalizedEmailSchema,
    password: passwordSchema,
    fullName: fullNameSchema,
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
