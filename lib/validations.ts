import { z } from "zod";

import { ACCOUNT_PROVIDERS } from "@/constants/accounts";

// Rules for a new password, shared by sign-up and accounts
const passwordSchema = z
  .string()
  .min(6, { message: "Password must be at least 6 characters long." })
  .max(100, { message: "Password cannot exceed 100 characters." })
  .regex(/[A-Z]/, {
    message: "Password must contain at least one uppercase letter.",
  })
  .regex(/[a-z]/, {
    message: "Password must contain at least one lowercase letter.",
  })
  .regex(/[0-9]/, { message: "Password must contain at least one number." })
  .regex(/[^a-zA-Z0-9]/, {
    message: "Password must contain at least one special character.",
  });

export const SignInSchema = z.object({
  email: z
    .email({ message: "Please provide a valid email address." })
    .min(1, { message: "Email is required." }),

  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long." })
    .max(100, { message: "Password cannot exceed 100 characters." }),
});

export const SignUpSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long." })
    .max(30, { message: "Username cannot exceed 30 characters." })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "Username can only contain letters, numbers, and underscores.",
    }),

  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required." })
    .max(50, { message: "Name cannot exceed 50 characters." })
    .regex(/^[\p{L}\s'-]+$/u, {
      message:
        "Name can only contain letters, spaces, apostrophes, and hyphens.",
    }),

  email: z
    .email({ message: "Please provide a valid email address." })
    .min(1, { message: "Email is required." }),

  password: passwordSchema,
});

export const AskQuestionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, { message: "Title must be at least 5 characters long." })
    .max(100, { message: "Title cannot exceed 100 characters." }),

  content: z.string().trim().min(1, { message: "Body is required." }),

  tags: z
    .array(
      z
        .string()
        .trim()
        .min(1, { message: "Tag is required." })
        .max(30, { message: "Tag cannot exceed 30 characters." }),
    )
    .min(1, { message: "At least one tag is required." })
    .max(3, { message: "Cannot add more than 3 tags." }),
});

// Only http(s): z.url() alone also accepts "javascript:alert(1)",
// which would run when the link is clicked
const httpUrl = z.url({
  protocol: /^https?$/,
  message: "Please provide a valid URL.",
});

// Body of POST /api/users. Lenient on username on purpose: OAuth sign-in
// creates users here too, and GitHub usernames can contain hyphens.
// No `reputation`: users must not set their own (the model defaults it to 0).
// `.string({ error })` is the message when a required field is missing.
export const UserSchema = z.object({
  name: z
    .string({ error: "Name is required." })
    .trim()
    .min(1, { message: "Name is required." })
    .max(50, { message: "Name cannot exceed 50 characters." }),

  username: z
    .string({ error: "Username is required." })
    .trim()
    .min(3, { message: "Username must be at least 3 characters long." })
    .max(30, { message: "Username cannot exceed 30 characters." }),

  // Trim and lowercase first so " John@Mail.com " matches the stored
  // "john@mail.com" in the duplicate check
  email: z
    .string({ error: "Email is required." })
    .trim()
    .toLowerCase()
    .pipe(z.email({ message: "Please provide a valid email address." })),

  bio: z.string().optional(),
  image: httpUrl.optional(),
  location: z.string().optional(),
  portfolio: httpUrl.optional(),
});

// A MongoDB ObjectId: 24 hex characters. Checked here (not with mongoose)
// because this file is also used in the browser.
const objectIdSchema = (field: string) =>
  z
    .string({ error: `${field} is required.` })
    .regex(/^[a-f\d]{24}$/i, { message: `Invalid ${field}.` });

// Fields of an account. Kept without refinements so routes can
// .pick()/.partial() it (Zod refuses that on refined schemas).
export const AccountFieldsSchema = z.object({
  userId: objectIdSchema("User ID"),
  name: z
    .string({ error: "Name is required." })
    .trim()
    .min(1, { message: "Name is required." }),
  image: httpUrl.optional(),
  password: passwordSchema.optional(),
  provider: z.enum(ACCOUNT_PROVIDERS, {
    error: `Provider must be one of: ${ACCOUNT_PROVIDERS.join(", ")}.`,
  }),
  providerAccountId: z
    .string({ error: "Provider Account ID is required." })
    .trim()
    .min(1, { message: "Provider Account ID is required." }),
});

// Body of POST /api/accounts. Only email/password ("credentials")
// accounts have a password; GitHub/Google ones never do.
export const AccountSchema = AccountFieldsSchema.refine(
  (account) => account.provider !== "credentials" || account.password,
  { message: "Password is required.", path: ["password"] },
).refine((account) => account.provider === "credentials" || !account.password, {
  message: "Only email/password accounts can have a password.",
  path: ["password"],
});

// Body of PUT /api/accounts/[id]. Only these can change: userId, provider
// and providerAccountId identify the login, so changing them would move it
// to another user or identity.
export const AccountUpdateSchema = AccountFieldsSchema.pick({
  name: true,
  image: true,
  password: true,
}).partial();
