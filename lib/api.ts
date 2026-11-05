import "server-only";

import type { z } from "zod";

import type { AccountProvider } from "@/constants/accounts";
import type { IAccountDoc } from "@/database/account.model";
import type { IUserDoc } from "@/database/user.model";
import { fetchHandler } from "@/lib/handlers/fetch";
import type {
  AccountSchema,
  AccountUpdateSchema,
  UserSchema,
} from "@/lib/validations";
import type { Serialized } from "@/types";

// API_BASE_URL is only needed when the API lives somewhere else. By
// default we call this same server: Next sets PORT to the port it runs
// on (4317 for `npm run dev`).
const API_BASE_URL =
  process.env.API_BASE_URL ||
  `http://localhost:${process.env.PORT ?? 3000}/api`;

// What the routes answer with (Dates and ObjectIds arrive as strings)
type User = Serialized<IUserDoc>;
type Account = Serialized<IAccountDoc>;

// What the routes accept: the input types of the same Zod schemas they
// validate with, so a missing or unknown field is a type error here
type UserInput = z.input<typeof UserSchema>;
type AccountInput = z.input<typeof AccountSchema>;
type AccountUpdateInput = z.input<typeof AccountUpdateSchema>;

const post = (body: unknown) => ({
  method: "POST",
  body: JSON.stringify(body),
});
const put = (body: unknown) => ({ method: "PUT", body: JSON.stringify(body) });
const del = { method: "DELETE" };

// Server-side client for our API routes. Every method resolves to an
// ActionResponse: check `success` before reading `data`.
export const api = {
  users: {
    getAll: () => fetchHandler<User[]>(`${API_BASE_URL}/users`),
    getById: (id: string) =>
      fetchHandler<User>(`${API_BASE_URL}/users/${encodeURIComponent(id)}`),
    getByEmail: (email: string) =>
      fetchHandler<User>(`${API_BASE_URL}/users/email`, post({ email })),
    create: (userData: UserInput) =>
      fetchHandler<User>(`${API_BASE_URL}/users`, post(userData)),
    update: (id: string, userData: Partial<UserInput>) =>
      fetchHandler<User>(
        `${API_BASE_URL}/users/${encodeURIComponent(id)}`,
        put(userData),
      ),
    delete: (id: string) =>
      fetchHandler<User>(
        `${API_BASE_URL}/users/${encodeURIComponent(id)}`,
        del,
      ),
  },
  accounts: {
    getAll: () => fetchHandler<Account[]>(`${API_BASE_URL}/accounts`),
    getById: (id: string) =>
      fetchHandler<Account>(
        `${API_BASE_URL}/accounts/${encodeURIComponent(id)}`,
      ),
    // Both are needed: an id is only unique per provider
    getByProvider: (provider: AccountProvider, providerAccountId: string) =>
      fetchHandler<Account>(
        `${API_BASE_URL}/accounts/provider`,
        post({ provider, providerAccountId }),
      ),
    create: (accountData: AccountInput) =>
      fetchHandler<Account>(`${API_BASE_URL}/accounts`, post(accountData)),
    update: (id: string, accountData: AccountUpdateInput) =>
      fetchHandler<Account>(
        `${API_BASE_URL}/accounts/${encodeURIComponent(id)}`,
        put(accountData),
      ),
    delete: (id: string) =>
      fetchHandler<Account>(
        `${API_BASE_URL}/accounts/${encodeURIComponent(id)}`,
        del,
      ),
  },
};
