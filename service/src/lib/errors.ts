export class CustomAppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'SERVER_ERROR'
  ) {
    super(message);
    this.name = 'CustomAppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, CustomAppError.prototype);
  }
}

// Common error types
export class NotFoundError extends CustomAppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class BadRequestError extends CustomAppError {
  constructor(message: string = 'Bad request') {
    super(message, 400, 'BAD_REQUEST');
  }
}

export class ConflictError extends CustomAppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}
