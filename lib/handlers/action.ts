// Not "use server": that would turn this helper into a server action,
// which anyone can call with a direct POST request. server-only keeps it
// on the server without exposing it.
import "server-only";

import type { Session } from "next-auth";
import type { z } from "zod";

import { auth } from "@/auth";
import { UnauthorizedError, ValidationError } from "@/lib/http-errors";
import dbConnect from "@/lib/mongoose";

// session is only looked up when authorize is true
interface ActionResult<P, A extends boolean> {
  params: P;
  session: A extends true ? Session : null;
}

// The steps every server action starts with:
// 1. authorize: true -> the user must be signed in (401 otherwise)
// 2. schema -> params are validated and returned *parsed* (trimmed,
//    lowercased, unknown keys removed), so use the returned params
// 3. connect to the database
//
// Every problem is thrown, so wrap it like the API routes do:
//   try {
//     const { params, session } = await action({ params: input, schema, authorize: true });
//     ...
//   } catch (error) {
//     return handleError(error);
//   }
async function action<S extends z.ZodType, A extends boolean = false>(options: {
  params: z.input<S>;
  schema: S;
  authorize?: A;
}): Promise<ActionResult<z.output<S>, A>>;
async function action<A extends boolean = false>(options?: {
  authorize?: A;
}): Promise<ActionResult<undefined, A>>;
async function action({
  params,
  schema,
  authorize = false,
}: {
  params?: unknown;
  schema?: z.ZodType;
  authorize?: boolean;
} = {}): Promise<ActionResult<unknown, boolean>> {
  // Auth first: signed-out users get no validation details and cause no
  // further work
  let session: Session | null = null;
  if (authorize) {
    session = await auth();
    if (!session?.user) throw new UnauthorizedError();
  }

  // Validate even when params is missing (undefined fails the schema).
  // safeParseAsync also supports async refinements; errors that aren't
  // validation failures (bugs) are thrown as they are.
  let data: unknown;
  if (schema) {
    const result = await schema.safeParseAsync(params);
    if (!result.success) throw ValidationError.fromZodError(result.error);
    data = result.data;
  }

  await dbConnect();

  return { params: data, session };
}

export default action;
