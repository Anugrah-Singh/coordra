import { z } from 'zod';

export const paginationQuerySchema = {
  page: z
    .string()
    .regex(/^\d+$/, { message: 'Page must be a positive number' })
    .optional(),

  limit: z
    .string()
    .regex(/^\d+$/, { message: 'Limit must be a positive number' })
    .optional(),
};

export type PaginationQuery = {
  page?: string | undefined;
  limit?: string | undefined;
};