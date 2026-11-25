export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'INTERNAL_SERVER_ERROR'
  | 'RATE_LIMITED'
  | 'EXTERNAL_SERVICE_ERROR';

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';

    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, details?: Record<string, unknown>): AppError {
    return new AppError('BAD_REQUEST', message, details);
  }

  static internal(message: string, details?: Record<string, unknown>): AppError {
    return new AppError('INTERNAL_SERVER_ERROR', message, details);
  }

  static rateLimited(message: string, details?: Record<string, unknown>): AppError {
    return new AppError('RATE_LIMITED', message, details);
  }

  static notFound(message: string, details?: Record<string, unknown>): AppError {
    return new AppError('NOT_FOUND', message, details);
  }

  static external(message: string, details?: Record<string, unknown>): AppError {
    return new AppError('EXTERNAL_SERVICE_ERROR', message, details);
  }
}
