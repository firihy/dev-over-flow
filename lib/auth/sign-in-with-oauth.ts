// Not an API route on purpose: a public route that links a provider id to
// any email would let anyone take over an account (link their own GitHub
// id to the victim's email, then sign in with GitHub). Only the Auth.js
// signIn callback calls this, after GitHub/Google confirmed who it is.
import "server-only";

import { randomBytes } from "node:crypto";

import type { ClientSession } from "mongoose";
import slugify from "slugify";
import type { z } from "zod";

import Account from "@/database/account.model";
import User from "@/database/user.model";
import { ValidationError } from "@/lib/http-errors";
import dbConnect from "@/lib/mongoose";
import { SignInWithOAuthSchema } from "@/lib/validations";

export type SignInWithOAuthInput = z.input<typeof SignInWithOAuthSchema>;

// Same limits as UserSchema
const USERNAME_MIN = 3;
const USERNAME_MAX = 30;

// "John Doe" -> "john-doe". strict drops anything that isn't a-z, 0-9 or
// "-", so a name like "محمد" becomes "" and needs a fallback.
const toSlug = (text: string) =>
  slugify(text, { lower: true, strict: true, trim: true }).slice(
    0,
    USERNAME_MAX,
  );

// The suggestion (GitHub login, Google name), else the part of the email
// before "@", else "user"
const baseUsername = (suggestion: string | undefined, email: string) => {
  for (const text of [suggestion ?? "", email.split("@")[0]]) {
    const slug = toSlug(text);
    if (slug.length >= USERNAME_MIN) return slug;
  }
  return "user";
};

// usernames are unique: two Google users named "John Doe" must both be
// able to sign up, so the second one becomes e.g. "john-doe-4f2a"
const uniqueUsername = async (base: string, session: ClientSession) => {
  if (!(await User.exists({ username: base }).session(session))) return base;

  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = randomBytes(2).toString("hex");
    const candidate = `${base.slice(0, USERNAME_MAX - suffix.length - 1)}-${suffix}`;
    if (!(await User.exists({ username: candidate }).session(session))) {
      return candidate;
    }
  }
  // Practically never happens; the unique index would reject it anyway
  throw new Error(`Couldn't find a free username for "${base}"`);
};

// Finds or creates the user behind a GitHub/Google login and returns our
// user id (not the provider's). Throws ValidationError for bad input.
//
// 1. This login was used before -> its account says which user it is.
//    The provider's name/image are refreshed on the account only, so
//    sign-ins never overwrite what the user set on their profile.
// 2. First time with this login -> link it to the user with the same
//    email, or create a new user. Note: this trusts the provider's email.
//    Google verifies emails; GitHub's primary email may not be verified.
//
// Runs in a transaction: a new user is never left without its account.
export async function signInWithOAuth(
  input: SignInWithOAuthInput,
): Promise<{ userId: string }> {
  const result = await SignInWithOAuthSchema.safeParseAsync(input);
  if (!result.success) throw ValidationError.fromZodError(result.error);
  const { provider, providerAccountId, user } = result.data;

  // Only set the image when the provider sent one
  const profile = { name: user.name, ...(user.image && { image: user.image }) };

  const { connection } = await dbConnect();

  // transaction() commits, aborts on errors, retries on temporary
  // errors and ends the session. On a retry the whole function runs again.
  return connection.transaction(async (session) => {
    const account = await Account.findOneAndUpdate(
      { provider, providerAccountId },
      { $set: profile },
      { session },
    );
    if (account) return { userId: account.userId.toString() };

    let existingUser = await User.findOne({ email: user.email }).session(
      session,
    );
    if (!existingUser) {
      const username = await uniqueUsername(
        baseUsername(user.username, user.email),
        session,
      );
      [existingUser] = await User.create(
        [{ ...profile, username, email: user.email }],
        { session },
      );
    }

    await Account.create(
      [{ ...profile, userId: existingUser._id, provider, providerAccountId }],
      { session },
    );

    return { userId: existingUser._id.toString() };
  });
}
