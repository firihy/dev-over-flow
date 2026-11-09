// Checks an email/password login. Only the Credentials provider's
// authorize() in auth.ts calls this.
import "server-only";

import { randomBytes } from "node:crypto";

import Account from "@/database/account.model";
import User from "@/database/user.model";
import dbConnect from "@/lib/mongoose";
import { hashPassword, verifyPassword } from "@/lib/password";
import { SignInSchema } from "@/lib/validations";

// What Auth.js needs to create the session: `id` becomes token.sub
export interface CredentialsUser {
  id: string;
  name: string;
  email: string;
  image?: string;
}

// A hash of a random password nobody knows, made once on first use.
// Unknown emails are checked against it so they take as long as real
// ones: otherwise a fast "no" would tell attackers which emails exist.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () =>
  (dummyHash ??= hashPassword(randomBytes(16).toString("hex")));

// Returns the user, or null for anything wrong (bad input, unknown email,
// wrong password). One answer for every failure, so the response doesn't
// reveal which part was wrong.
export async function signInWithCredentials(
  input: unknown,
): Promise<CredentialsUser | null> {
  const result = SignInSchema.safeParse(input);
  if (!result.success) return null;
  const { email, password } = result.data;

  await dbConnect();

  // Sign-up stores the email as the credentials account's id.
  // password has select: false, so ask for it here.
  const account = await Account.findOne({
    provider: "credentials",
    providerAccountId: email,
  }).select("+password");

  if (!account?.password) {
    await verifyPassword(password, await getDummyHash());
    return null;
  }

  if (!(await verifyPassword(password, account.password))) return null;

  const user = await User.findById(account.userId);
  if (!user) return null;

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    image: user.image,
  };
}
