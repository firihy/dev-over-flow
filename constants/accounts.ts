// Ways to log in. Lives here (not in the model) so client code, like the
// Zod schemas used by forms, can import it without bundling Mongoose.
// OAuth providers sign in through GitHub/Google; "credentials" is
// email/password.
export const OAUTH_PROVIDERS = ["github", "google"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export const ACCOUNT_PROVIDERS = [...OAUTH_PROVIDERS, "credentials"] as const;
export type AccountProvider = (typeof ACCOUNT_PROVIDERS)[number];
