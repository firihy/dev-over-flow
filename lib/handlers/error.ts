import { NextResponse } from "next/server";
import { z } from "zod";

import {
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

// Turns any thrown value into { status, message, details }
const parseError = (error: unknown): ErrorResponse => {
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
