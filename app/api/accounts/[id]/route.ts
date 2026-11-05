import { NextResponse } from "next/server";

import Account, { type IAccountDoc } from "@/database/account.model";
import handleError from "@/lib/handlers/error";
import { parseJsonBody } from "@/lib/handlers/parse-json-body";
import { NotFoundError, ValidationError } from "@/lib/http-errors";
import dbConnect from "@/lib/mongoose";
import { hashPassword } from "@/lib/password";
import { AccountUpdateSchema } from "@/lib/validations";
import type { APIResponse } from "@/types";

type Context = RouteContext<"/api/accounts/[id]">;

// GET /api/accounts/[id]
export async function GET(
  _request: Request,
  { params }: Context,
): Promise<APIResponse<IAccountDoc>> {
  try {
    const { id } = await params;
    await dbConnect();

    const account = await Account.findById(id).lean<IAccountDoc>();
    if (!account) throw new NotFoundError("Account");

    return NextResponse.json({ success: true, data: account });
  } catch (error) {
    return handleError(error, "api");
  }
}

// PUT /api/accounts/[id]: updates only the fields that are sent
export async function PUT(
  request: Request,
  { params }: Context,
): Promise<APIResponse<IAccountDoc>> {
  try {
    const { id } = await params;
    const data = AccountUpdateSchema.parse(await parseJsonBody(request));

    await dbConnect();

    if (data.password) {
      // GitHub/Google accounts log in through the provider, not a password
      const account = await Account.findById(id)
        .select("provider")
        .lean<Pick<IAccountDoc, "provider">>();
      if (!account) throw new NotFoundError("Account");
      if (account.provider !== "credentials") {
        throw new ValidationError({
          password: ["Only email/password accounts can have a password."],
        });
      }
      data.password = await hashPassword(data.password);
    }

    const updatedAccount = await Account.findByIdAndUpdate(id, data, {
      returnDocument: "after",
      runValidators: true,
    }).lean<IAccountDoc>();
    if (!updatedAccount) throw new NotFoundError("Account");

    return NextResponse.json({ success: true, data: updatedAccount });
  } catch (error) {
    return handleError(error, "api");
  }
}

// DELETE /api/accounts/[id]: removes the account only, never the user
export async function DELETE(
  _request: Request,
  { params }: Context,
): Promise<APIResponse<IAccountDoc>> {
  try {
    const { id } = await params;
    await dbConnect();

    const deletedAccount =
      await Account.findByIdAndDelete(id).lean<IAccountDoc>();
    if (!deletedAccount) throw new NotFoundError("Account");

    return NextResponse.json({ success: true, data: deletedAccount });
  } catch (error) {
    return handleError(error, "api");
  }
}
