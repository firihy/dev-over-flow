// Browser-side calls to our API routes. lib/api.ts is server-only (and
// its server-to-server requests carry no cookies); these use the
// browser's fetch on the same site, so the user's session cookie goes
// along and the routes can check who is signed in.
import type { z } from "zod";

import type { AIAnswerSchema } from "@/lib/validations";
import type { ActionResponse, ErrorResponse } from "@/types";

// An AI answer can take a while to write
const AI_TIMEOUT = 30_000;

const errorResponse = (status: number, message: string): ErrorResponse => ({
  success: false,
  status,
  error: { message },
});

const isActionResponse = (body: unknown): body is ActionResponse<unknown> =>
  typeof body === "object" &&
  body !== null &&
  "success" in body &&
  typeof body.success === "boolean";

// POSTs JSON and always resolves to an ActionResponse: check `success`.
// The only thing it throws is the AbortError when the caller cancels.
async function postJson<T>(
  url: string,
  body: unknown,
  { timeout, signal }: { timeout: number; signal?: AbortSignal },
): Promise<ActionResponse<T>> {
  const timeoutSignal = AbortSignal.timeout(timeout);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return errorResponse(504, "This is taking too long. Please try again.");
    }
    if (err instanceof Error && err.name === "AbortError") throw err;
    return errorResponse(
      503,
      "Couldn't reach the server. Check your connection.",
    );
  }

  const json: unknown = await response.json().catch(() => null);
  if (isActionResponse(json)) return json as ActionResponse<T>;

  return errorResponse(
    response.ok ? 502 : response.status,
    "The server sent an unexpected response.",
  );
}

export const apiClient = {
  ai: {
    // Writes an answer to the question, or improves `userAnswer` when given
    getAnswer: (
      input: z.input<typeof AIAnswerSchema>,
      options: { signal?: AbortSignal } = {},
    ) =>
      postJson<string>("/api/ai/answers", input, {
        timeout: AI_TIMEOUT,
        ...options,
      }),
  },
};
