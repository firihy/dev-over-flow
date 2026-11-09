import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

import { OAUTH_PROVIDERS, type OAuthProvider } from "@/constants/accounts";

const isOAuthProvider = (provider: string): provider is OAuthProvider =>
  (OAUTH_PROVIDERS as readonly string[]).includes(provider);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub,
    Google,
    // Email/password. authorize() returns our user, or null for a wrong
    // login (Auth.js then reports a CredentialsSignin error). The returned
    // `id` becomes token.sub, so the token already carries our user id.
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        // Loaded only while signing in, so the proxy doesn't load
        // Mongoose (see the jwt callback)
        const { signInWithCredentials } =
          await import("@/lib/auth/sign-in-with-credentials");
        return signInWithCredentials(credentials);
      },
    }),
  ],
  callbacks: {
    // Runs first on every sign-in: false shows the "Access denied" page
    signIn({ user, account }) {
      if (!account) return false;
      // authorize() already checked the email and password
      if (account.provider === "credentials") return true;
      if (!isOAuthProvider(account.provider)) return false;
      // We find and create users by email, so it's required
      return Boolean(user.email);
    },

    // Runs when the login cookie is created (`account` is only set then)
    // and on every request that reads the session (proxy.ts, auth()).
    async jwt({ token, user, account, profile }) {
      if (!account || !isOAuthProvider(account.provider) || !user.email) {
        return token;
      }

      // Loaded only while signing in, so the proxy (which runs this on
      // every page request) doesn't load Mongoose
      const { signInWithOAuth } = await import("@/lib/auth/sign-in-with-oauth");

      const login = typeof profile?.login === "string" ? profile.login : "";
      const name = (user.name || login || user.email.split("@")[0]).slice(
        0,
        50,
      );

      // Throws on failure, which stops the sign-in. Not `return token`:
      // token.sub would still be the GitHub/Google id, and the user would
      // be signed in with an id that isn't one of ours.
      const { userId } = await signInWithOAuth({
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        user: {
          name,
          email: user.email,
          image: user.image ?? undefined,
          // GitHub login, else the name (made into a username later)
          username: login || name,
        },
      });

      // From now on the token carries our user id
      token.sub = userId;
      return token;
    },

    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
