# Auth layer

How users sign in to DevFlow, where their data lives, and how the rest of the
app finds out who is signed in.

**Stack:** Auth.js v5 (`next-auth@5 beta`), JWT sessions (no database
adapter), Mongoose for users and accounts, Zod for validation, and bcrypt for
passwords.

**Status:**

- GitHub and Google sign-in work end to end, tested with real logins.
- Email/password sign-up and sign-in work end to end.
- What's still missing is listed in [Not done yet](#8-not-done-yet).

---

## 0. Mental models (read this first)

Seven small ideas explain almost everything below. If a detail later is
confusing, come back here and find which idea it belongs to.

### 0.1 A person and their keys: User vs Account

Think of a **User** as a person and **Accounts** as the keys on their
keyring. Each key opens the same door, the person's profile.

```mermaid
flowchart LR
  subgraph Keyring["One person's keyring"]
    K1["🔑 GitHub key<br/>(Account: github)"]
    K2["🔑 Google key<br/>(Account: google)"]
    K3["🔑 Password key<br/>(Account: credentials)"]
  end
  K1 --> P["👤 User<br/>name, username, email, image"]
  K2 --> P
  K3 --> P
```

- Signing in = showing **any** key. We look up the key, then follow it to
  the person.
- A new GitHub/Google key with an email we already know is **added to that
  person's keyring** (linking).
- A new **password** key for an email we already know is **refused**.
  Anyone could type your email, so that would hand them a key to your
  account.

### 0.2 Three doors, one wristband

There are three ways in: GitHub, Google and email/password. Each one does
its own checks, but they all end the same way: we work out **our** user id
and put it on a wristband, the session cookie.

```mermaid
flowchart LR
  G[GitHub door] --> Q{"Who is this<br/>in OUR database?"}
  O[Google door] --> Q
  E[Email + password door] --> Q
  Q --> ID["our user id<br/>(token.sub)"]
  ID --> W["🎟️ wristband<br/>= encrypted JWT cookie"]
```

The rest of the app never asks _how_ you got in. It only reads the
wristband: `session.user.id` is always our MongoDB user id, whichever door
you used.

### 0.3 Check hard once, glance after

| Moment                  | What happens                                                                           | Touches the DB? | Speed                                 |
| ----------------------- | -------------------------------------------------------------------------------------- | --------------- | ------------------------------------- |
| **Signing in** (rare)   | Ask GitHub/Google or check the password, find or create the user, issue the wristband. | Yes             | Slow on purpose: bcrypt takes ~400 ms |
| **Every request after** | `auth()` decrypts the cookie and reads the id.                                         | **No**          | Very fast                             |

That's why the DB helpers are loaded with `await import(...)` inside the
sign-in code only. `proxy.ts` reads the wristband on every page request and
must stay light.

The flip side: the wristband is a **photo taken at sign-in**. If the user
changes their name or picture later, the avatar keeps the old photo until
they sign in again.

### 0.4 The bouncer doesn't explain

When a password sign-in fails, the bouncer says only **"Invalid email or
password."** Never "no such email" or "wrong password", and not even faster
or slower depending on why. Each hint would tell an attacker which emails
have accounts. So `verifyCredentials` returns `null` for every failure,
and it still runs bcrypt (against a dummy hash) when the email is unknown.

Sign-up can't hide this ("this email already exists"), which is normal for
sign-up forms.

### 0.5 Public buttons vs back-office helpers

| Kind                                      | Where                           | Who can call it                             | Rule                                                                    |
| ----------------------------------------- | ------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| **Rulebook**                              | `auth.ts`                       | Auth.js                                     | Decides who may sign in and what goes on the wristband.                 |
| **Public buttons** (`"use server"`)       | `lib/actions/*.action.ts`       | **Anyone**: every export is a POST endpoint | Validate everything (`action()` + Zod), trust nothing from the browser. |
| **Back-office helpers** (`"server-only"`) | `lib/auth/*`, `lib/password.ts` | Only our server code                        | Can trust their caller. They are never exposed as endpoints.            |

That's why `signInWithOAuth` isn't an API route. A public "link this
GitHub id to that email" button would let anyone take over any account.

### 0.6 The password is checked in exactly one place

```mermaid
flowchart LR
  SU[sign-up action] -- "signIn('credentials')" --> AZ["authorize()<br/>→ verifyCredentials"]
  SI[sign-in action] -- "signIn('credentials')" --> AZ
  AZ --> R{password OK?}
  R -- yes --> W[🎟️ wristband]
  R -- no --> X[CredentialsSignin → 401]
```

The actions never compare passwords themselves. They hand the email and
password to Auth.js, which runs `authorize()`. One place to get right, and
one place to harden later (for example rate limiting).

### 0.7 All or nothing

Creating a user always means creating **two** documents: a User and its
first Account. They are written in a **transaction**: either both are saved
or neither is, so there is never a person with no key, or a key with no
person. Slow work (bcrypt) happens **before** the transaction, because a
transaction may retry.

---

## 1. The pieces

| File                                                | What it does                                                                                                                                                                                                                             |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.ts`                                           | Auth.js config: the GitHub, Google and Credentials providers, and the `signIn`, `jwt` and `session` callbacks. Exports `handlers`, `auth`, `signIn` and `signOut`.                                                                       |
| `app/api/auth/[...nextauth]/route.ts`               | Mounts Auth.js at `/api/auth/*` (sign-in, callback, session, sign-out).                                                                                                                                                                  |
| `proxy.ts`                                          | Next 16 proxy (formerly middleware). It runs `auth` on every page request so the session is available. It skips `/api`, `_next`, images and icons.                                                                                       |
| `lib/auth/sign-in-with-oauth.ts`                    | Server-only. Finds or creates the User and Account behind a GitHub or Google login, in a transaction.                                                                                                                                    |
| `lib/auth/verify-credentials.ts`                    | Server-only. `verifyCredentials` checks an email/password login and returns the user or `null`. It takes the same time whether or not the email exists. Only `authorize()` calls it.                                                     |
| `lib/actions/auth.action.ts`                        | Server actions. `signUpWithCredentials` creates the User and a `credentials` Account in a transaction, then signs the user in. `signInWithCredentials` signs in with email and password. `signOutUser` signs out and goes to `/sign-in`. |
| `lib/password.ts`                                   | `hashPassword` (bcrypt, cost 12) and `verifyPassword`.                                                                                                                                                                                   |
| `lib/validations.ts`                                | `SignInSchema`, `SignUpSchema` and `SignInWithOAuthSchema`. Emails are trimmed and lowercased before they are checked.                                                                                                                   |
| `constants/accounts.ts`                             | `OAUTH_PROVIDERS` (`github`, `google`) and `ACCOUNT_PROVIDERS` (adds `credentials`). It is free of Mongoose, so client code can import it.                                                                                               |
| `database/user.model.ts`                            | The person: profile data, plus a unique `username` and `email`.                                                                                                                                                                          |
| `database/account.model.ts`                         | One login method for a user. Unique on `(provider, providerAccountId)`. `password` is `select: false`.                                                                                                                                   |
| `lib/handlers/action.ts`                            | Server-action helper: validates input, checks the session with `authorize: true`, and connects to the DB. It throws on problems.                                                                                                         |
| `components/forms/AuthForm.tsx`                     | The sign-in/sign-up form. It runs the server action, shows field errors under the inputs, and on success shows a toast and redirects to `/`.                                                                                             |
| `components/forms/SocialAuthForm.tsx`               | "Log in with GitHub/Google" buttons. They call `signIn(provider)` from `next-auth/react`.                                                                                                                                                |
| `components/navigation/LeftSidebar.tsx`             | Uses `auth()` to pick Log Out (a form posting to `signOutUser`) or Log In / Sign Up, and passes the user id to `NavLinks`.                                                                                                               |
| `components/navigation/navbar/MobileNavigation.tsx` | The same for the phone menu. The Log Out button also closes the menu.                                                                                                                                                                    |
| `components/navigation/navbar/index.tsx`            | The navbar. Uses `auth()` to show the signed-in user's `UserAvatar`.                                                                                                                                                                     |
| `components/UserAvatar.tsx`                         | Round avatar linking to `/profile/<id>`. Shows the picture, or the initials when there is none or it fails to load.                                                                                                                      |
| `app/layout.tsx`                                    | Passes the server session into `<SessionProvider>` for client components.                                                                                                                                                                |

```mermaid
flowchart LR
  subgraph Browser
    SAF[SocialAuthForm<br/>signIn provider]
    AF[AuthForm<br/>sign-up / sign-in]
    LO[Log Out forms<br/>sidebar + mobile menu]
    CC[Client components<br/>useSession]
  end

  subgraph Next.js server
    PX[proxy.ts<br/>auth on page requests]
    RH["/api/auth/[...nextauth]<br/>handlers"]
    AUTH[auth.ts<br/>providers + callbacks]
    SIO[lib/auth/sign-in-with-oauth.ts]
    SIC[lib/auth/verify-credentials.ts]
    SUA[lib/actions/auth.action.ts<br/>signUpWithCredentials<br/>signInWithCredentials<br/>signOutUser]
    ACT[lib/handlers/action.ts]
    RSC[Server components<br/>Navbar, LeftSidebar,<br/>MobileNavigation: auth]
  end

  subgraph Providers
    GH[GitHub]
    GO[Google]
  end

  DB[(MongoDB<br/>users / accounts)]

  SAF --> RH
  RH <--> GH
  RH <--> GO
  RH --> AUTH
  AF -- server action --> SUA
  LO -- server action --> SUA
  SUA --> ACT
  SUA -- "signIn('credentials')" --> AUTH
  SUA --> DB
  AUTH -- "jwt: dynamic import" --> SIO
  AUTH -- "authorize: dynamic import" --> SIC
  SIO --> DB
  SIC --> DB
  PX --> AUTH
  RSC --> AUTH
  ACT --> AUTH
  CC -. session from layout .-> RSC
```

---

## 2. Data model

A **User** is a person. An **Account** is one way that person logs in. One
user can have several accounts. For example, the same email used through
GitHub and through Google gives one user with two accounts.

```mermaid
erDiagram
  USER ||--o{ ACCOUNT : "logs in with"
  USER {
    ObjectId _id PK
    string name
    string username UK "3-30 chars"
    string email UK "lowercased"
    string image "optional"
    string bio
    string location
    string portfolio
    number reputation "default 0"
  }
  ACCOUNT {
    ObjectId _id PK
    ObjectId userId FK "indexed"
    string name "provider's name, refreshed each sign-in"
    string image "provider's avatar"
    string password "bcrypt hash, select:false, credentials only"
    string provider "github | google | credentials"
    string providerAccountId "provider's user id; the email for credentials"
  }
```

| Login type  | `provider`    | `providerAccountId`    | `password`  |
| ----------- | ------------- | ---------------------- | ----------- |
| GitHub      | `github`      | GitHub user id         | none        |
| Google      | `google`      | Google user id         | none        |
| Email/pass. | `credentials` | the email (lowercased) | bcrypt hash |

Why the profile lives on both documents: the provider's name and image are
refreshed on the **Account** at every sign-in. The **User** keeps what the
person set in their profile, so signing in never overwrites their edits.

---

## 3. OAuth sign-in, step by step

```mermaid
sequenceDiagram
  autonumber
  actor U as User
  participant B as Browser
  participant NA as /api/auth/* (Auth.js)
  participant P as GitHub / Google
  participant CB as auth.ts callbacks
  participant S as signInWithOAuth
  participant DB as MongoDB

  U->>B: Click "Log in with GitHub"
  B->>NA: signIn("github", { redirectTo: "/" })
  NA->>P: Redirect to consent screen
  P-->>NA: Redirect back with code
  NA->>P: Exchange code for tokens and profile
  NA->>CB: signIn({ user, account })
  alt unknown provider, or no email
    CB-->>NA: false
    NA-->>B: /api/auth/error?error=AccessDenied
  else ok
    CB-->>NA: true
    NA->>CB: jwt({ token, user, account, profile })
    CB->>S: await import(...), then signInWithOAuth(...)
    S->>DB: transaction: find/link/create (see section 4)
    DB-->>S: userId
    S-->>CB: { userId }
    CB-->>NA: token.sub = our userId
    NA-->>B: Set encrypted JWT cookie, redirect to "/"
  end
```

What the `jwt` callback sends to `signInWithOAuth`:

| Field               | Value                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| `provider`          | `account.provider` (`github` or `google`)                                                          |
| `providerAccountId` | `account.providerAccountId`                                                                        |
| `user.name`         | `user.name`, else the GitHub `login`, else the part of the email before `@`. Cut to 50 characters. |
| `user.email`        | `user.email` (required: `signIn` already rejected users without one)                               |
| `user.image`        | `user.image` or `undefined`                                                                        |
| `user.username`     | The GitHub `login`, else the name. It is only a suggestion and gets slugified later.               |

If `signInWithOAuth` throws, the sign-in fails. That is on purpose: if the
callback returned the token anyway, `token.sub` would still be the GitHub or
Google id, which isn't one of our user ids.

---

## 4. Inside `signInWithOAuth`

Everything runs in `connection.transaction(...)`. A new user is never left
without an account, and temporary errors retry the whole function.

```mermaid
flowchart TD
  A[Input] --> V{SignInWithOAuthSchema<br/>valid?}
  V -- no --> VE[throw ValidationError]
  V -- yes --> T[[Start transaction]]
  T --> F{Account with this<br/>provider + providerAccountId?}
  F -- yes --> UPD[Refresh account name/image] --> R1[return account.userId]
  F -- no --> E{User with<br/>this email?}
  E -- yes --> LINK[Use that user<br/>= link new login]
  E -- no --> UN[Build username]
  UN --> NEW[Create User]
  LINK --> ACC[Create Account]
  NEW --> ACC
  ACC --> R2[return user._id]
```

### Building the username

```mermaid
flowchart LR
  S1["suggestion<br/>(GitHub login / name)"] --> SL1{slug length ≥ 3?}
  SL1 -- yes --> BASE
  SL1 -- no --> S2[part of the email before @] --> SL2{slug length ≥ 3?}
  SL2 -- yes --> BASE
  SL2 -- no --> USR["'user'"] --> BASE
  BASE[base] --> TAKEN{taken?}
  TAKEN -- no --> DONE[use base]
  TAKEN -- yes --> SUF["base-xxxx<br/>(random 4 hex, up to 5 tries)"] --> DONE
```

`slugify(text, { lower, strict, trim })` keeps only `a-z`, `0-9` and `-`.
Some examples:

| Input                      | Result                                                                 |
| -------------------------- | ---------------------------------------------------------------------- |
| `John Doe`                 | `john-doe` (or `john-doe-67b5` if taken)                               |
| `محمد`, email `x@mail.com` | slug is empty, the email part is too short, so `user` (or `user-d274`) |
| GitHub login `octocat`     | `octocat`                                                              |

---

## 5. Email/password sign-up

The sign-up page passes the `signUpWithCredentials` server action to
`AuthForm` as `onSubmit`. Server actions are public POST endpoints, so the
action validates its own input with `SignUpSchema`.

```mermaid
sequenceDiagram
  autonumber
  actor U as User
  participant F as AuthForm (/sign-up)
  participant SA as signUpWithCredentials
  participant DB as MongoDB
  participant AJ as Auth.js signIn("credentials")

  U->>F: Fill username, name, email, password
  F->>F: Client-side check (SignUpSchema)
  F->>SA: server action call
  SA->>SA: action(): validate, trim + lowercase email
  alt invalid input
    SA-->>F: 400 + field errors
  end
  SA->>SA: hashPassword (bcrypt, cost 12, before the transaction)
  SA->>DB: transaction start
  SA->>DB: email taken? username taken?
  alt taken
    SA-->>F: 400 { email / username: [message] }
  else free
    SA->>DB: create User + Account(provider "credentials",<br/>providerAccountId = email, password = hash)
    DB-->>SA: commit
    SA->>AJ: signIn("credentials", { email, password, redirect: false })
    AJ-->>SA: session cookie set
    SA-->>F: { success: true }
    F->>U: toast "Signed up successfully", go to "/"
  end
```

Details:

- **Hash before the transaction.** bcrypt is slow on purpose. The
  transaction may retry, and the hash shouldn't be recomputed each time.
- **Both "taken" checks are reported together** as one `ValidationError`,
  so the form can show "email exists" and "username taken" at once, each
  under its field.
- **A race between two sign-ups** that both pass the checks is caught by
  the unique indexes. `handleError` turns the duplicate-key error into a 409.
- **Sign-in runs after the commit, in its own `try`.** If it fails, the
  account still exists, so the user gets "Your account was created, but we
  couldn't sign you in" instead of a false "sign-up failed".
- **An email that already belongs to a GitHub/Google user is rejected.**
  Linking it would let anyone who knows your email set a password on your
  account.

---

## 6. Email/password sign-in

The sign-in page passes the `signInWithCredentials` server action to
`AuthForm`. The action doesn't check the password itself. It calls
`signIn("credentials")`, and Auth.js runs the Credentials provider's
`authorize()`, which calls `verifyCredentials`. So the password is checked
in exactly one place, for both sign-in and the automatic sign-in after
sign-up.

```mermaid
sequenceDiagram
  autonumber
  actor U as User
  participant F as AuthForm (/sign-in)
  participant SA as signInWithCredentials<br/>(server action)
  participant NA as Auth.js
  participant AZ as authorize()
  participant V as verifyCredentials
  participant DB as MongoDB

  U->>F: Fill email, password
  F->>F: Client-side check (SignInSchema)
  F->>SA: server action call
  SA->>SA: action(): validate, trim + lowercase email
  alt invalid input
    SA-->>F: 400 + field errors
  end
  SA->>NA: signIn("credentials", { email, password, redirect: false })
  NA->>AZ: authorize(credentials)
  AZ->>V: await import(...), then verifyCredentials(credentials)
  V->>DB: Account.findOne({ provider: "credentials",<br/>providerAccountId: email }).select("+password")
  alt no account
    V->>V: bcrypt.compare against a dummy hash<br/>(same time as a real check)
    V-->>AZ: null
  else account found
    V->>V: verifyPassword(password, account.password)
    alt wrong password
      V-->>AZ: null
    else right password
      V->>DB: User.findById(account.userId)
      V-->>AZ: { id, name, email, image }
    end
  end
  alt null
    NA-->>SA: throws CredentialsSignin
    SA-->>F: 401 "Invalid email or password."
    F->>U: toast "Sign-in failed"
  else user
    NA->>NA: signIn callback allows credentials<br/>jwt: token.sub = user.id (our id)
    NA-->>SA: session cookie set
    SA-->>F: { success: true }
    F->>U: toast "Signed in successfully", go to "/"
  end
```

Why every failure gives the same answer: different errors for "unknown
email", "no password on this account (GitHub/Google user)" and "wrong
password" would tell an attacker which emails have an account and how they
log in.

- **Same message:** `verifyCredentials` returns `null` for all of them, and
  the action turns Auth.js's `CredentialsSignin` into one 401.
- **Same timing:** an unknown email is checked against a dummy hash. Tested:
  an unknown email and a wrong password both take about 410 ms.
- **Other errors** (for example the database is down) aren't
  `CredentialsSignin`, so they go through `handleError`. They are logged as
  real errors and show as a 500.

---

## 7. Reading the session

There is no session table. The session is an encrypted JWT in a cookie. The
`session` callback copies `token.sub` (our user id) to `session.user.id`.
This works the same for every provider:

- **OAuth:** the `jwt` callback sets `token.sub`.
- **Credentials:** Auth.js sets `token.sub` from the `id` that
  `authorize()` returned.

```mermaid
sequenceDiagram
  participant B as Browser
  participant PX as proxy.ts
  participant RSC as Server component / action
  participant A as auth()

  B->>PX: GET /some-page (with cookie)
  PX->>A: decode JWT
  A-->>PX: session (or null)
  PX->>RSC: render
  RSC->>A: auth()
  A-->>RSC: { user: { id, name, email, image } }
  Note over A: jwt() runs again but returns early<br/>(no `account` outside sign-in),<br/>so the DB isn't touched
```

Where it's used:

- **Server components:** `const session = await auth()` (`Navbar`, `LeftSidebar`, `MobileNavigation`, `app/layout.tsx`).
- **Server actions:** `action({ ..., authorize: true })` throws `UnauthorizedError` (401) when signed out.
- **Client components:** `useSession()`, through the `SessionProvider` set up in `app/layout.tsx`.
- **Sign-out:** the `signOutUser` server action (see below).

**Keeping Mongoose out of the proxy:** `proxy.ts` runs `auth.ts` on every
page request. Both DB helpers are loaded with `await import(...)` only while
signing in, so ordinary requests never load Mongoose.

### What the signed-in user sees

| Place                         | Signed out      | Signed in                                                    |
| ----------------------------- | --------------- | ------------------------------------------------------------ |
| Navbar                        | —               | `UserAvatar`: the picture, or initials ("Zed Avatar" → "ZA") |
| Left sidebar (tablet/desktop) | Log In, Sign Up | Log Out. "Profile" link in `NavLinks`                        |
| Mobile menu (phone)           | Log In, Sign Up | Log Out. "Profile" link in `NavLinks`                        |

The avatar's name and picture come from the **session**, not the database.
They are copied into the JWT at sign-in, so a profile change only shows
after the next sign-in.

`UserAvatar` uses Radix's `AvatarImage` (a plain `<img>`), not
`next/image`. Radix only shows the initials fallback when its own image
fails to load. `referrerPolicy="no-referrer"` is there because Google avatar
URLs can refuse requests that say which site they came from.

### Signing out

Both Log Out buttons are forms that post to one server action,
`signOutUser`.

```mermaid
sequenceDiagram
  autonumber
  actor U as User
  participant F as Log Out form<br/>(sidebar or mobile menu)
  participant SA as signOutUser<br/>(server action)
  participant AJ as Auth.js signOut
  participant B as Browser

  U->>F: Click "Log Out"
  Note over F: Mobile: SheetClose on the button<br/>also closes the menu
  F->>SA: POST (server action)
  SA->>AJ: signOut({ redirectTo: "/sign-in" })
  AJ-->>B: Delete the session cookie
  AJ-->>B: Redirect to /sign-in
  B->>B: Server components render signed out<br/>(no avatar, Log In / Sign Up)
```

Because the session is only a cookie (JWT), signing out just deletes that
cookie. There is no session row to remove from the database. A copy of the
token taken before sign-out stays valid until it expires (30 days by
default).

---

## 8. Not done yet

| Gap                                                                                                                                                                 | Where                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| No rate limit on login or sign-up attempts, so passwords can be brute-forced.                                                                                       | `auth.ts`, `auth.action.ts` |
| bcrypt only uses the first 72 bytes of a password, but the schema allows 100 characters.                                                                            | `passwordSchema`            |
| The avatar and name in the session don't update after a profile change until the next sign-in. Fix: refresh them in the `jwt` callback with `trigger === "update"`. | `auth.ts`                   |
| Usernames are case-sensitive: `John` and `john` can both exist.                                                                                                     | `user.model.ts`             |
| No email verification for email/password sign-ups.                                                                                                                  | —                           |
| No route protection (no `authorized` callback in the proxy).                                                                                                        | `proxy.ts`                  |
| The `/api/users` and `/api/accounts` routes don't check auth.                                                                                                       | `app/api/**`                |

---

## 9. Security notes

- **No public "link account" endpoint.** `signInWithOAuth` is deliberately
  not an API route. A public route that links any provider id to any email
  would let someone take over an account. Only the `jwt` callback calls it,
  after GitHub or Google has confirmed who the user is.
- **Email linking trusts the provider.** Google verifies emails. A GitHub
  primary email may not be verified, so someone with an unverified GitHub
  email matching yours could be linked to your user. A possible hardening:
  only link when the email is verified, for example by checking
  `profile.email_verified` for Google and the GitHub emails API for GitHub.
- **Sign-up reveals that an email is registered** ("An account with this
  email already exists"). Every sign-up form without email verification
  does this. Sign-in doesn't (see section 6).
- **`/api/*` is not protected by the proxy.** The matcher excludes `api`.
  `/api/users` and `/api/accounts` are currently public, so each route must
  check `auth()` itself before it is exposed for real.
- **The proxy doesn't block any pages.** It only attaches the session.
- **Passwords.** They are hashed with bcrypt at cost 12, and the hash is
  never read unless `.select("+password")` asks for it. Only `lib/password.ts`
  touches bcrypt.
- **Secrets.** These come from `.env.local` (see `.env.example`):
  `AUTH_SECRET`, `AUTH_TRUST_HOST`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`,
  `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` and `MONGODB_URI`.

---

## 10. Error cases

| Situation                                                           | What the user sees                                                                                |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| OAuth: unknown provider, or no email                                | `signIn` returns `false`, which shows the Auth.js **AccessDenied** page.                          |
| OAuth: invalid data from the provider (e.g. a bad image URL)        | `ValidationError` is thrown in `jwt`, and Auth.js shows its error page.                           |
| OAuth: a DB error or no free username                               | The transaction is aborted, nothing is saved, and the Auth.js error page is shown.                |
| OAuth: the user cancels the consent screen                          | Auth.js sends them back with an error, and `SocialAuthForm` shows a toast.                        |
| Sign-up: invalid input                                              | Messages under the fields (checked in the browser, then again on the server).                     |
| Sign-up: email or username taken                                    | "An account with this email already exists." / "This username is already taken." under the field. |
| Sign-up: two sign-ups race                                          | 409 "Duplicate value for …" toast.                                                                |
| Sign-up: saved, but the sign-in afterwards failed                   | Toast: "Your account was created, but we couldn't sign you in. Please sign in."                   |
| Sign-up: server unreachable                                         | Toast: "Something went wrong. Please check your connection and try again."                        |
| Sign-in: invalid input                                              | Messages under the fields (browser, then server).                                                 |
| Sign-in: unknown email, wrong password, or GitHub/Google-only email | Toast "Sign-in failed: Invalid email or password." (401, the same for every cause).               |
| Sign-in: database or other server error                             | Toast with a 500 error. The real error is logged on the server.                                   |
