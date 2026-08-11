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

  GONE: 'GONE',

  AI_DISABLED: 'AI_DISABLED',

  AI_PROVIDER_ERROR: 'AI_PROVIDER_ERROR',

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

  static badRequest(message: string = 'Bad request', details?: unknown) {
    return new AppError(message, {
      statusCode: 400,
      code: APP_ERROR_CODES.BAD_REQUEST,
      details,
    });
  }

  static unauthorized(message: string = 'Authentication required') {
    return new AppError(message, {
      statusCode: 401,
      code: APP_ERROR_CODES.AUTHENTICATION_REQUIRED,
    });
  }

  static forbidden(
    message: string = 'You do not have permission to perform this action'
  ) {
    return new AppError(message, { statusCode: 403, code: APP_ERROR_CODES.FORBIDDEN });
  }

  static notFound(message: string = 'Not found') {
    return new AppError(message, {
      statusCode: 404,
      code: APP_ERROR_CODES.RESOURCE_NOT_FOUND,
    });
  }

  static conflict(message: string = 'Conflict') {
    return new AppError(message, { statusCode: 409, code: APP_ERROR_CODES.CONFLICT });
  }

  static gone(message: string = 'Gone') {
    return new AppError(message, { statusCode: 410, code: APP_ERROR_CODES.GONE });
  }

  static serviceUnavailable(
    message: string,
    code: typeof APP_ERROR_CODES.AI_DISABLED | typeof APP_ERROR_CODES.AI_PROVIDER_ERROR
  ) {
    return new AppError(message, { statusCode: 503, code });
  }

  static internalError(message: string = 'Internal server error', cause?: unknown) {
    return new AppError(message, {
      statusCode: 500,
      code: APP_ERROR_CODES.INTERNAL_ERROR,
      cause,
    });
  }
}
