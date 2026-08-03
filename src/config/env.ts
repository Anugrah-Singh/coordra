import 'dotenv/config';

import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    PORT: z.coerce.number().int().min(1).max(65_535).default(8000),

    DATABASE_URL: z
      .url({
        message: 'DATABASE_URL must be a valid PostgreSQL URL',
      })
      .refine(
        (value) => {
          const protocol = new URL(value).protocol;

          return protocol === 'postgres:' || protocol === 'postgresql:';
        },
        {
          message: 'DATABASE_URL must use the postgres:// or postgresql:// protocol',
        }
      )
      .transform((value) => {
        const url = new URL(value);
        const sslMode = url.searchParams.get('sslmode');

        if (sslMode === 'prefer' || sslMode === 'require' || sslMode === 'verify-ca') {
          url.searchParams.set('sslmode', 'verify-full');
        }

        return url.toString();
      }),

    JWT_SECRET: z.string().min(32, {
      message: 'JWT_SECRET must contain at least 32 characters',
    }),

    FRONTEND_URL: z
      .url({
        message: 'FRONTEND_URL must be a valid URL',
      })
      .default('http://localhost:3000')
      .transform((value) => new URL(value).origin),

    DB_POOL_MAX: z.coerce.number().int().min(1).max(50).default(20),

    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(0),

    DEMO_MODE: z
      .string()
      .default('false')
      .transform((val) => val.toLowerCase())
      .pipe(z.enum(['true', 'false']))
      .transform((value) => value === 'true'),

    AI_ENABLED: z
      .string()
      .default('false')
      .transform((val) => val.toLowerCase())
      .pipe(z.enum(['true', 'false']))
      .transform((value) => value === 'true'),

    AI_PROVIDER: z.string().trim().min(1).default('groq'),

    GROQ_API_KEY: z.string().trim().min(1).optional(),

    GROQ_MODEL: z.string().trim().min(1).default('openai/gpt-oss-20b'),

    AI_MAX_STEPS: z.coerce.number().int().min(1).max(8).default(4),

    SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(60_000).default(10_000),
  })
  .superRefine((value, context) => {
    if (value.AI_ENABLED && !value.GROQ_API_KEY) {
      context.addIssue({
        code: 'custom',
        path: ['GROQ_API_KEY'],
        message: 'GROQ_API_KEY is required when AI_ENABLED=true',
      });
    }
    if (value.AI_ENABLED && value.AI_PROVIDER !== 'groq') {
      context.addIssue({
        code: 'custom',
        path: ['AI_PROVIDER'],
        message: `Unsupported AI provider “${value.AI_PROVIDER}”; expected “groq”`,
      });
    }
  });

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const details = result.error.issues
    .map((issue) => {
      const field = issue.path.join('.') || 'environment';
      return `- ${field}: ${issue.message}`;
    })
    .join('\n');

  throw new Error(`Invalid environment configuration:\n${details}`);
}

export const env = result.data;
