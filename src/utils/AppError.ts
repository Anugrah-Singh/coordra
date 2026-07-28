export const APP_ERROR_CODES = {
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',

  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  INVALID_AUTH_TOKEN: 'INVALID_AUTH_TOKEN',

  FORBIDDEN: 'FORBIDDEN',

  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',

  ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',

  CONFLICT: 'CONFLICT',

  RATE_LIMITED: 'RATE_LIMITED',

  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',

  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[keyof typeof APP_ERROR_CODES];

type AppErrorOptions = {
  statusCode: number;
  code: AppErrorCode;
  details?: unknown;
  cause?: unknown;
};

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: AppErrorCode;
  readonly details?: unknown;

  constructor(message: string, options: AppErrorOptions) {
    super(message, {
      cause: options.cause,
    });

    this.name = 'AppError';
    this.statusCode = options.statusCode;
    this.code = options.code;

    if (options.details !== undefined) {
      this.details = options.details;
    }

    Object.setPrototypeOf(this, new.target.prototype);

    Error.captureStackTrace?.(this, AppError);
  }
}
