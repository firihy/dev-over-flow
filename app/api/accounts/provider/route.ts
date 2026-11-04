import { NextResponse } from "next/server";

import Account, { type IAccountDoc } from "@/database/account.model";
import handleError from "@/lib/handlers/error";
import { parseJsonBody } from "@/lib/handlers/parse-json-body";
import { NotFoundError } from "@/lib/http-errors";
import dbConnect from "@/lib/mongoose";
import { AccountFieldsSchema } from "@/lib/validations";
import type { APIResponse } from "@/types";

// Both are required. An id is only unique per provider: GitHub user
// "12345" and Google user "12345" are different people. (With partial(),
// {} would pass and findOne({}) would return the first account.)
const ProviderLookupSchema = AccountFieldsSchema.pick({
  provider: true,
  providerAccountId: true,
});

// POST /api/accounts/provider: find the account for a provider login
export async function POST(
  request: Request,
): Promise<APIResponse<IAccountDoc>> {
  try {
    const { provider, providerAccountId } = ProviderLookupSchema.parse(
      await parseJsonBody(request),
    );

    await dbConnect();

    const account = await Account.findOne({
      provider,
      providerAccountId,
    }).lean<IAccountDoc>();
    if (!account) throw new NotFoundError("Account");

    return NextResponse.json({ success: true, data: account });
  } catch (error) {
    return handleError(error, "api");
  }
}
