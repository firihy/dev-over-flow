import { NextResponse } from "next/server";

import User, { type IUserDoc } from "@/database/user.model";
import handleError from "@/lib/handlers/error";
import { ConflictError, RequestError } from "@/lib/http-errors";
import dbConnect from "@/lib/mongoose";
import { UserSchema } from "@/lib/validations";
import type { APIResponse } from "@/types";

// List users
export async function GET(): Promise<APIResponse<IUserDoc[]>> {
  try {
    await dbConnect();

    // lean(): plain objects, lighter than full documents for read-only data
    const users = await User.find().lean<IUserDoc[]>();

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return handleError(error, "api");
  }
}

// Create a user
export async function POST(request: Request): Promise<APIResponse<IUserDoc>> {
  try {
    // A body that isn't JSON is the client's mistake (400), not a crash (500)
    const body: unknown = await request.json().catch(() => {
      throw new RequestError(400, "Invalid JSON body.");
    });

    // Throws a ZodError on bad input; handleError turns it into a 400
    // with the message for each field. Unknown keys (like reputation)
    // are dropped.
    const data = UserSchema.parse(body);

    await dbConnect();

    // One query for both checks. If two requests slip past it at the same
    // moment, the unique indexes still reject the second one (also a 409).
    const existingUser = await User.findOne({
      $or: [{ email: data.email }, { username: data.username }],
    });
    if (existingUser) {
      throw new ConflictError(
        existingUser.email === data.email
          ? "User already exists."
          : "Username already exists.",
      );
    }

    const newUser = await User.create(data);

    return NextResponse.json(
      { success: true, data: newUser.toObject<IUserDoc>() },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error, "api");
  }
}
