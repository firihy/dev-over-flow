import "server-only";

import bcrypt from "bcryptjs";

// Cost factor: each +1 doubles the work. 12 takes a few hundred ms,
// slow enough to make guessing expensive, fast enough for a login.
const SALT_ROUNDS = 12;

// Never store a password as-is: save this hash instead.
// bcrypt adds a random salt, so the same password hashes differently each time.
export const hashPassword = (password: string) =>
  bcrypt.hash(password, SALT_ROUNDS);

// true when `password` is the one that produced `hash`
export const verifyPassword = (password: string, hash: string) =>
  bcrypt.compare(password, hash);
