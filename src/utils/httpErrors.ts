import {
  APP_ERROR_CODES,
  AppError,
} from './AppError.js';

export const badRequest = (
  message: string,
  details?: unknown
): AppError =>
  new AppError(message, {
    statusCode: 400,
    code: APP_ERROR_CODES.BAD_REQUEST,
    details,
  });

export const unauthorized = (
  message = 'Authentication required'
): AppError =>
  new AppError(message, {
    statusCode: 401,
    code:
      APP_ERROR_CODES.AUTHENTICATION_REQUIRED,
  });

export const forbidden = (
  message = 'You do not have permission to perform this action'
): AppError =>
  new AppError(message, {
    statusCode: 403,
    code: APP_ERROR_CODES.FORBIDDEN,
  });

export const notFound = (
  message: string
): AppError =>
  new AppError(message, {
    statusCode: 404,
    code: APP_ERROR_CODES.RESOURCE_NOT_FOUND,
  });

export const conflict = (
  message: string
): AppError =>
  new AppError(message, {
    statusCode: 409,
    code: APP_ERROR_CODES.CONFLICT,
  });

export const internalError = (
  message = 'Internal server error',
  cause?: unknown
): AppError =>
  new AppError(message, {
    statusCode: 500,
    code: APP_ERROR_CODES.INTERNAL_ERROR,
    cause,
  });