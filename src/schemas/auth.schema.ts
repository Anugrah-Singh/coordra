import { z } from 'zod';

export const loginSchema =
  z.object({
    body: z.object({
      email: z
        .email({
          message:
            'Invalid email address',
        })
        .trim()
        .toLowerCase()
        .max(254, {
          message:
            'Email cannot exceed 254 characters',
        }),

      password: z
        .string({
          error: (issue) =>
            issue.input ===
            undefined
              ? 'Password is required'
              : 'Password must be a string',
        })
        .min(1, {
          message:
            'Password is required',
        })
        .max(128, {
          message:
            'Password cannot exceed 128 characters',
        }),
    }),
  });

export type LoginInput =
  z.infer<
    typeof loginSchema
  >['body'];