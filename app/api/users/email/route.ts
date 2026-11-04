import { NextResponse } from "next/server";

import User, { type IUserDoc } from "@/database/user.model";
import handleError from "@/lib/handlers/error";
import { parseJsonBody } from "@/lib/handlers/parse-json-body";
import { NotFoundError } from "@/lib/http-errors";
import dbConnect from "@/lib/mongoose";
import { UserSchema } from "@/lib/validations";
import type { APIResponse } from "@/types";

// POST, not GET ?email=..., so the email stays out of URLs and server logs
const EmailSchema = UserSchema.pick({ email: true });

// POST /api/users/email: find a user by email
export async function POST(request: Request): Promise<APIResponse<IUserDoc>> {
  try {
    // pick(), not partial(): email must be required. With partial(), {}
    // passes and findOne({ email: undefined }) becomes findOne({}),
    // which returns the first user in the database.
    const { email } = EmailSchema.parse(await parseJsonBody(request));

    await dbConnect();

    const user = await User.findOne({ email }).lean<IUserDoc>();
    if (!user) throw new NotFoundError("User");

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return handleError(error, "api");
  }
}
