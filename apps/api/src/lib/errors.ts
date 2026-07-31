import type { ApiErrorCode } from "@productstudio/shared-types";

export class DomainError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class UnauthenticatedError extends DomainError {
  constructor(message = "Authentication required") {
    super("UNAUTHENTICATED", message, 401);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "Forbidden") {
    super("FORBIDDEN", message, 403);
  }
}

export class NotFoundError extends DomainError {
  constructor(message = "Not found") {
    super("NOT_FOUND", message, 404);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("VALIDATION_ERROR", message, 400, details);
  }
}

export class VersionConflictError extends DomainError {
  constructor(currentVersion: number) {
    super(
      "VERSION_CONFLICT",
      "Page was modified by another session. Reload to get the latest version.",
      409,
      { currentVersion },
    );
  }
}

export class ResourceInUseError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("RESOURCE_IN_USE", message, 409, details);
  }
}

export class UnprocessableError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("UNPROCESSABLE", message, 422, details);
  }
}
