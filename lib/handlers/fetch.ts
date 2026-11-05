import "server-only";

import logger from "@/lib/logger";
import type { ActionResponse, ErrorResponse } from "@/types";

export interface FetchOptions extends RequestInit {
  // Milliseconds before the request is cancelled
  timeout?: number;
}

const DEFAULT_TIMEOUT = 5000;

const errorResponse = (status: number, message: string): ErrorResponse => ({
  success: false,
  status,
  error: { message },
});

// Our routes always answer { success: true, data } or
// { success: false, status, error }
const isActionResponse = (body: unknown): body is ActionResponse<unknown> =>
  typeof body === "object" &&
  body !== null &&
  "success" in body &&
  typeof body.success === "boolean";

// Calls one of our API routes and always resolves to an ActionResponse,
// so callers only need to check `success`:
//   const res = await fetchHandler<User>(url);
//   if (res.success) res.data; else res.error.message;
// The only thing it throws is the AbortError when the caller passes its
// own `signal` and cancels the request.
export async function fetchHandler<T>(
  url: string,
  {
    timeout = DEFAULT_TIMEOUT,
    headers: customHeaders,
    signal,
    ...options
  }: FetchOptions = {},
): Promise<ActionResponse<T>> {
  // new Headers() accepts an object, an array or a Headers instance
  const headers = new Headers(customHeaders);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Cancel after `timeout` ms, or earlier if the caller cancels.
  // AbortSignal.timeout() cleans up after itself (no clearTimeout needed).
  const timeoutSignal = AbortSignal.timeout(timeout);
  const signals = signal ? [signal, timeoutSignal] : [timeoutSignal];

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: AbortSignal.any(signals),
    });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      logger.warn({ url, timeout }, "Request timed out");
      return errorResponse(504, "The request timed out. Please try again.");
    }
    // The caller cancelled it on purpose, so let them handle it
    if (err instanceof Error && err.name === "AbortError") throw err;

    // The server is down, or the URL points nowhere
    logger.error({ err, url }, "Request failed");
    return errorResponse(503, "Couldn't reach the server. Please try again.");
  }

  // Wrong URLs and crashes can answer with an HTML page, which
  // response.json() would fail on with "Unexpected token '<'"
  const isJson = response.headers
    .get("Content-Type")
    ?.includes("application/json");
  const body: unknown = isJson ? await response.json().catch(() => null) : null;

  // Return our route's answer as it is: on errors it holds the real
  // message and the field errors ("Email is required.")
  if (isActionResponse(body)) return body as ActionResponse<T>;

  logger.error(
    {
      url,
      status: response.status,
      contentType: response.headers.get("Content-Type"),
    },
    "Unexpected response",
  );
  return response.ok
    ? errorResponse(502, "The server sent an unexpected response.")
    : errorResponse(response.status, `Request failed (${response.status}).`);
}
