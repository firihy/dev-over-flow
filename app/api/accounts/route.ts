import { NextResponse } from "next/server";

import Account, { type IAccountDoc } from "@/database/account.model";
import User from "@/database/user.model";
import handleError from "@/lib/handlers/error";
import { parseJsonBody } from "@/lib/handlers/parse-json-body";
import { ConflictError, NotFoundError } from "@/lib/http-errors";
import dbConnect from "@/lib/mongoose";
import { hashPassword } from "@/lib/password";
import { AccountSchema } from "@/lib/validations";
import type { APIResponse } from "@/types";

// List accounts (the password hash is hidden by select: false)
export async function GET(): Promise<APIResponse<IAccountDoc[]>> {
  try {
    await dbConnect();

    const accounts = await Account.find().lean<IAccountDoc[]>();

    return NextResponse.json({ success: true, data: accounts });
  } catch (error) {
    return handleError(error, "api");
  }
}

// Create an account for an existing user
export async function POST(
  request: Request,
): Promise<APIResponse<IAccountDoc>> {
  try {
    const data = AccountSchema.parse(await parseJsonBody(request));

    await dbConnect();

    // Don't create accounts that belong to nobody
    if (!(await User.exists({ _id: data.userId }))) {
      throw new NotFoundError("User");
    }

    // The unique index on { provider, providerAccountId } also catches two
    // requests arriving at the same moment (handleError answers 409)
    const existingAccount = await Account.exists({
      provider: data.provider,
      providerAccountId: data.providerAccountId,
    });
    if (existingAccount) {
      throw new ConflictError(
        "An account with the same provider already exists.",
      );
    }

    const newAccount = await Account.create({
      ...data,
      password: data.password && (await hashPassword(data.password)),
    });

    // select: false only hides the password in queries; the document
    // returned by create() still has the hash, so leave it out
    const { password: _password, ...account } =
      newAccount.toObject<IAccountDoc>();

    return NextResponse.json({ success: true, data: account }, { status: 201 });
  } catch (error) {
    return handleError(error, "api");
  }
}
