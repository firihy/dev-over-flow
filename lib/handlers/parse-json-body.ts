import { RequestError } from "@/lib/http-errors";

// request.json() throws on a body that isn't JSON. That's the client's
// mistake, so answer 400 instead of crashing with a 500.
export const parseJsonBody = (request: Request): Promise<unknown> =>
  request.json().catch(() => {
    throw new RequestError(400, "Invalid JSON body.");
  });
