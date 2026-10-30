export class BisonError extends Error {
  code: string;
  statusCode?: number;

  constructor(message: string, code: string, statusCode?: number) {
    super(message);
    this.name = 'BisonError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class AuthError extends BisonError {
  constructor(message = 'Authentication failed. Run "bison login" or set EMAILBISON_API_KEY and EMAILBISON_BASE_URL.') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}

export class NotFoundError extends BisonError {
  constructor(message = 'Resource not found.') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends BisonError {
  constructor(message = 'Validation failed.') {
    super(message, 'VALIDATION_ERROR', 422);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends BisonError {
  retryAfter?: number;

  constructor(message = 'Rate limit exceeded. Try again later.', retryAfter?: number) {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ServerError extends BisonError {
  constructor(message = 'Server error. Try again later.') {
    super(message, 'SERVER_ERROR', 500);
    this.name = 'ServerError';
  }
}

export function classifyHttpError(status: number, body: string): BisonError {
  const parsed = safeParse(body);
  const message = parsed?.message ?? parsed?.error ?? body;

  if (status === 401 || status === 403) return new AuthError(message);
  if (status === 404) return new NotFoundError(message);
  if (status === 422) return new ValidationError(message);
  if (status === 429) return new RateLimitError(message);
  if (status >= 500) return new ServerError(message);
  return new BisonError(message, 'HTTP_ERROR', status);
}

function safeParse(text: string): Record<string, string> | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function formatError(error: unknown): { error: string; code: string } {
  if (error instanceof BisonError) {
    return { error: error.message, code: error.code };
  }
  if (error instanceof Error) {
    return { error: error.message, code: 'UNKNOWN_ERROR' };
  }
  return { error: String(error), code: 'UNKNOWN_ERROR' };
}
