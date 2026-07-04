// Typed application errors. Routes throw these; a single Fastify error handler
// maps them to status codes so handlers stay free of response plumbing.
export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
    // Optional machine-readable payload, e.g. per-field validation errors.
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const notFound = (what = 'Resource') => new AppError(404, `${what} not found.`);
export const badRequest = (message: string, details?: unknown) => new AppError(400, message, details);
export const unprocessable = (message: string, details?: unknown) => new AppError(422, message, details);
