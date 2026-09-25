import "server-only";

/**
 * Typed authorization failures. server/auth throws them; each layer translates
 * them its own way: route handlers answer 401/403, pages call notFound() so a
 * brand's existence is not revealed (TASK-003, Q17).
 */
export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor(message = "Sign in to continue.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(message = "You do not have access to this brand.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function isAuthError(error: unknown): error is UnauthorizedError | ForbiddenError {
  return error instanceof UnauthorizedError || error instanceof ForbiddenError;
}
