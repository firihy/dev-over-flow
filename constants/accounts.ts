// Ways to log in. Lives here (not in the model) so client code, like the
// Zod schemas used by forms, can import it without bundling Mongoose.
export const ACCOUNT_PROVIDERS = ["github", "google", "credentials"] as const;
export type AccountProvider = (typeof ACCOUNT_PROVIDERS)[number];
