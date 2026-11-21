# Dev Overflow

A community Q&A site for developers, in the style of Stack Overflow. Ask
questions, answer them, vote, save the ones you want to keep, and earn
reputation and badges.

## Features

- **Questions and answers** written in a Markdown editor, with search, sort
  (newest, popular, unanswered, recommended), tags and pagination.
- **Votes, saved questions and views**, with reputation and badges that grow
  with them.
- **Recommended** questions based on what you have viewed, asked and voted on.
- **AI answers** from Groq, written into the answer editor for you to edit.
- **Community** page with every user, a **profile** page per user, and an
  **Edit Profile** form for your own.
- **Global search** in the navbar: questions, answers, users and tags.
- **Jobs** page with listings from JSearch, searchable and filterable by
  country.
- **Sign-in** with email and password, GitHub or Google.
- Light and dark themes.

## Tech stack

Next.js (App Router, server actions), React, TypeScript, Tailwind CSS,
shadcn/ui, MongoDB with Mongoose, Auth.js (NextAuth v5), Zod and React Hook
Form, and the Vercel AI SDK with Groq.

## Getting started

You need Node.js 20 or newer and a MongoDB database (a free
[MongoDB Atlas](https://www.mongodb.com/atlas) cluster works).

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev                  # http://localhost:4317
```

### Environment variables

Set these in `.env.local` (never commit that file). `.env.example` lists them
all with comments.

| Variable                               | What it is                                                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_SECRET`                          | Random secret for sessions. Make one with `npx auth secret`.                                                              |
| `AUTH_TRUST_HOST`                      | `true` to run `next start` on localhost.                                                                                  |
| `MONGODB_URI`                          | MongoDB connection string.                                                                                                |
| `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | GitHub OAuth app, for "Sign in with GitHub".                                                                              |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Google OAuth client, for "Sign in with Google".                                                                           |
| `GROQ_API_KEY`                         | Groq key for AI answers, from [console.groq.com/keys](https://console.groq.com/keys).                                     |
| `RAPID_API_KEY`                        | RapidAPI key for the Jobs page. Subscribe to [JSearch](https://rapidapi.com) (the free plan allows 200 requests a month). |
| `LOG_LEVEL`, `API_BASE_URL`            | Optional: log level, and where `lib/api.ts` sends requests.                                                               |

Without `RAPID_API_KEY` the app still works; the Jobs page shows a message
instead of listings. Job searches are cached for an hour to spare the monthly
limit.

### Scripts

| Command             | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Dev server on port 4317.                      |
| `npm run build`     | Production build.                             |
| `npm start`         | Serve the production build on port 4317.      |
| `npm run lint`      | ESLint. `npm run lint:fix` fixes what it can. |
| `npm run format`    | Prettier.                                     |
| `npm run typecheck` | Generate route types, then `tsc --noEmit`.    |

Git hooks (Husky and lint-staged) run ESLint and Prettier on staged files.

## Project layout

```
app/          Pages and API routes (App Router)
components/   UI: cards, forms, filters, navigation, ui/ (shadcn)
constants/    Routes, filter options, empty-state texts, countries
database/     Mongoose models
lib/          Server actions (lib/actions), validation, helpers
types/        Shared TypeScript types
docs/         How authentication and the database work
```

## More documentation

- [`docs/AUTH.md`](docs/AUTH.md): sign-in, sessions and who may do what.
- [`docs/DATABASE.md`](docs/DATABASE.md): collections, indexes and queries.

## Deploying

Deploy on [Vercel](https://vercel.com/new) and add the environment variables
above in the project settings.
