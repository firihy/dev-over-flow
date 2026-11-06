import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ConflictError,
  type FieldErrors,
  RequestError,
  ValidationError,
} from "@/lib/http-errors";
import logger from "@/lib/logger";
import type { ErrorResponse } from "@/types";

// "api": API routes, returns a NextResponse
// "server": server actions, returns a plain object
export type ErrorResponseType = "api" | "server";

const toErrorResponse = (
  status: number,
  message: string,
  details?: FieldErrors,
): ErrorResponse => ({
  success: false,
  status,
  error: { message, details },
});

// A unique index rejected the write (MongoDB error code 11000),
// e.g. a second tag "react" or voting twice on the same question
const isDuplicateKeyError = (
  error: unknown,
): error is Error & { code: number; keyValue?: Record<string, unknown> } =>
  error instanceof Error && "code" in error && error.code === 11000;

// Turns Mongoose errors into the error classes the user should see
const fromMongooseError = (error: unknown): RequestError | null => {
  // A schema rule failed (required, min, enum...) on create/save
  if (error instanceof mongoose.Error.ValidationError) {
    const fieldErrors: FieldErrors = {};
    for (const [field, fieldError] of Object.entries(error.errors)) {
      fieldErrors[field] = [fieldError.message];
    }
    return new ValidationError(fieldErrors);
  }

  // e.g. an invalid ObjectId like /questions/abc
  if (error instanceof mongoose.Error.CastError) {
    return new ValidationError({ [error.path]: [`Invalid ${error.path}.`] });
  }

  if (isDuplicateKeyError(error)) {
    // Only field names, never the values, end up in the message
    const fields = Object.keys(error.keyValue ?? {}).join(", ");
    return new ConflictError(
      fields ? `Duplicate value for ${fields}.` : "Already exists.",
    );
  }

  return null;
};

// Turns any thrown value into { status, message, details }
const parseError = (thrown: unknown): ErrorResponse => {
  const error = fromMongooseError(thrown) ?? thrown;

  if (error instanceof RequestError) {
    return toErrorResponse(error.statusCode, error.message, error.errors);
  }

  if (error instanceof z.ZodError) {
    const validationError = ValidationError.fromZodError(error);
    return toErrorResponse(
      validationError.statusCode,
      validationError.message,
      validationError.errors,
    );
  }

  // Anything else is a bug or an outage. Log the real error (with its
  // stack) for us and only show its message while developing: database
  // and driver errors can reveal internal details.
  logger.error({ err: error }, "Unexpected error");

  if (error instanceof Error && process.env.NODE_ENV !== "production") {
    return toErrorResponse(500, error.message);
  }

  return toErrorResponse(500, "Something went wrong. Please try again.");
};

// Overloads: the return type follows the responseType you pass,
// so callers never need a cast
function handleError(
  error: unknown,
  responseType: "api",
): NextResponse<ErrorResponse>;
function handleError(error: unknown, responseType?: "server"): ErrorResponse;
function handleError(
  error: unknown,
  responseType: ErrorResponseType = "server",
): NextResponse<ErrorResponse> | ErrorResponse {
  const response = parseError(error);

  // 4xx errors are user mistakes (bad input, not signed in...), not bugs,
  // so they get "warn". Field messages can quote what the user typed
  // (Mongoose: "`veiw` is not a valid enum value"), so log field names only.
  if (response.status < 500) {
    const { message, details } = response.error;
    logger.warn(
      {
        status: response.status,
        responseType,
        fields: details && Object.keys(details),
      },
      details ? "Validation failed" : message,
    );
  }

  return responseType === "api"
    ? NextResponse.json(response, { status: response.status })
    : response;
}

export default handleError;
