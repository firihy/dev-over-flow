import { z } from "zod";

// Errors that carry an HTTP status. Throw these for problems the user
// should see; handleError turns them into a response.

export type FieldErrors = Record<string, string[]>;

export class RequestError extends Error {
  statusCode: number;
  errors?: FieldErrors;

  constructor(statusCode: number, message: string, errors?: FieldErrors) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    // Set by hand: class names get mangled when the code is minified
    this.name = "RequestError";
  }
}

export class ValidationError extends RequestError {
  // formErrors: errors about the whole form (e.g. from .refine())
  constructor(fieldErrors: FieldErrors, formErrors: string[] = []) {
    super(
      400,
      ValidationError.formatMessage(fieldErrors, formErrors),
      fieldErrors,
    );
    this.name = "ValidationError";
  }

  // Field errors go under their field; errors from .refine() without a
  // path apply to the whole form
  static fromZodError(error: z.ZodError) {
    const { fieldErrors, formErrors } = z.flattenError(error);
    return new ValidationError(fieldErrors as FieldErrors, formErrors);
  }

  // Our schema messages are full sentences ("Email is required."),
  // so join them with a space
  static formatMessage(fieldErrors: FieldErrors, formErrors: string[] = []) {
    return [...formErrors, ...Object.values(fieldErrors).flat()].join(" ");
  }
}

export class UnauthorizedError extends RequestError {
  constructor(message = "Unauthorized") {
    super(401, message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends RequestError {
  constructor(message = "Forbidden") {
    super(403, message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends RequestError {
  // e.g. new NotFoundError("Question") -> "Question not found"
  constructor(resource: string) {
    super(404, `${resource} not found`);
    this.name = "NotFoundError";
  }
}

// Something already exists, e.g. "User already exists" or a second vote
export class ConflictError extends RequestError {
  constructor(message = "Already exists") {
    super(409, message);
    this.name = "ConflictError";
  }
}
