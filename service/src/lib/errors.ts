/**
 * Custom error classes for consistent error handling
 */

/**
 * Base error class for all custom errors
 */
export class CustomAppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found Error
 */
export class NotFoundError extends CustomAppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * 400 Bad Request Error
 */
export class BadRequestError extends CustomAppError {
  constructor(message: string = 'Bad request') {
    super(message, 400);
  }
}

/**
 * 403 Forbidden Error
 */
export class ForbiddenError extends CustomAppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403);
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalError extends CustomAppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500);
  }
}
