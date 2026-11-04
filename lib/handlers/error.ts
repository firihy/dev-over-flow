import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ConflictError,
  type FieldErrors,
  RequestError,
  ValidationError,
} from "@/lib/http-errors";

// "api": API routes, returns a NextResponse
// "server": server actions, returns a plain object
export type ErrorResponseType = "api" | "server";

export interface ErrorResponse {
  success: false;
  status: number;
  error: {
    message: string;
    details?: FieldErrors;
  };
}

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
    const { fieldErrors, formErrors } = z.flattenError(error);
    const validationError = new ValidationError(
      fieldErrors as FieldErrors,
      formErrors,
    );
    return toErrorResponse(
      validationError.statusCode,
      validationError.message,
      validationError.errors,
    );
  }

  if (error instanceof Error) {
    return toErrorResponse(500, error.message);
  }

  return toErrorResponse(500, "An unexpected error occurred");
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

  return responseType === "api"
    ? NextResponse.json(response, { status: response.status })
    : response;
}

export default handleError;
