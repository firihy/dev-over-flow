import { z } from "zod";

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

  password: z
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
    }),
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
export const UserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required." })
    .max(50, { message: "Name cannot exceed 50 characters." }),

  username: z
    .string()
    .trim()
    .min(3, { message: "Username must be at least 3 characters long." })
    .max(30, { message: "Username cannot exceed 30 characters." }),

  // Trim and lowercase first so " John@Mail.com " matches the stored
  // "john@mail.com" in the duplicate check
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ message: "Please provide a valid email address." })),

  bio: z.string().optional(),
  image: httpUrl.optional(),
  location: z.string().optional(),
  portfolio: httpUrl.optional(),
});
