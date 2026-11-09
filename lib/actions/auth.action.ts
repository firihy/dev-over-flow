"use server";

// Server actions: every export here can be called from the browser with a
// POST, so each one validates its own input.

import { CredentialsSignin } from "next-auth";
import type { z } from "zod";

import { signIn, signOut } from "@/auth";
import ROUTES from "@/constants/routes";
import Account from "@/database/account.model";
import User from "@/database/user.model";
import action from "@/lib/handlers/action";
import handleError from "@/lib/handlers/error";
import {
  type FieldErrors,
  UnauthorizedError,
  ValidationError,
} from "@/lib/http-errors";
import logger from "@/lib/logger";
import dbConnect from "@/lib/mongoose";
import { hashPassword } from "@/lib/password";
import { SignInSchema, SignUpSchema } from "@/lib/validations";
import type { ActionResponse } from "@/types";

export type SignUpInput = z.input<typeof SignUpSchema>;
export type SignInInput = z.input<typeof SignInSchema>;

// Creates a user with an email/password account, then signs them in.
export async function signUpWithCredentials(
  input: SignUpInput,
): Promise<ActionResponse> {
  let params: z.output<typeof SignUpSchema>;

  try {
    ({ params } = await action({ params: input, schema: SignUpSchema }));
    const { name, username, email, password } = params;

    // Hash before the transaction: it's slow (on purpose) and would
    // otherwise run again on every retry
    const hashedPassword = await hashPassword(password);

    const { connection } = await dbConnect();

    // User and account are saved together or not at all
    await connection.transaction(async (session) => {
      // Field errors show under the matching input in the form.
      // (Two sign-ups racing past these checks hit the unique index
      // instead, which handleError turns into a 409.)
      const taken: FieldErrors = {};
      if (await User.exists({ email }).session(session)) {
        taken.email = ["An account with this email already exists."];
      }
      if (await User.exists({ username }).session(session)) {
        taken.username = ["This username is already taken."];
      }
      if (Object.keys(taken).length > 0) throw new ValidationError(taken);

      const [user] = await User.create([{ name, username, email }], {
        session,
      });

      await Account.create(
        [
          {
            userId: user._id,
            name,
            provider: "credentials",
            // The email identifies a credentials login
            providerAccountId: email,
            password: hashedPassword,
          },
        ],
        { session },
      );
    });
  } catch (error) {
    return handleError(error);
  }

  // Outside the try above: the account is saved by now, so a failure here
  // must not be reported as a failed sign-up
  try {
    // Sets the session cookie. redirect: false because the form decides
    // where to go next.
    await signIn("credentials", {
      email: params.email,
      password: params.password,
      redirect: false,
    });
  } catch (error) {
    logger.error({ err: error }, "Sign-in after sign-up failed");
    return {
      success: false,
      status: 500,
      error: {
        message:
          "Your account was created, but we couldn't sign you in. Please sign in.",
      },
    };
  }

  return { success: true, data: null };
}

// Signs in with email and password. The password is checked in one
// place only: the Credentials provider's authorize() (verifyCredentials).
export async function signInWithCredentials(
  input: SignInInput,
): Promise<ActionResponse> {
  try {
    // Validates and normalizes the email (" A@B.com" -> "a@b.com")
    const { params } = await action({ params: input, schema: SignInSchema });

    // Sets the session cookie. redirect: false because the form decides
    // where to go next.
    await signIn("credentials", { ...params, redirect: false });

    return { success: true, data: null };
  } catch (error) {
    // authorize() returned null. Same message for an unknown email and a
    // wrong password, so it doesn't reveal which emails have an account.
    if (error instanceof CredentialsSignin) {
      return handleError(new UnauthorizedError("Invalid email or password."));
    }
    return handleError(error);
  }
}

// Clears the session cookie and goes to the sign-in page. Used by the
// Log Out forms (sidebar and mobile menu). signOut ends with a redirect,
// so nothing after it runs.
export async function signOutUser(): Promise<void> {
  await signOut({ redirectTo: ROUTES.SIGN_IN });
}
