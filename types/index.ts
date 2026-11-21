import type { Types } from "mongoose";
import type { NextResponse } from "next/server";

import type { VoteType } from "@/constants/votes";
import type { FieldErrors } from "@/lib/http-errors";

export interface Tag {
  _id: string;
  name: string;
}

// A tag in the tags list, with how many questions use it
export interface TagListItem extends Tag {
  questions: number;
}

export interface Author {
  _id: string;
  name: string;
  // Users without a profile picture fall back to a default avatar
  image?: string;
}

// A user in the community list. Only what's shown publicly: never the
// email, which would let anyone collect every user's address.
export interface UserListItem {
  _id: string;
  name: string;
  username: string;
  image?: string;
  reputation: number;
}

// A user's public profile. Never the email: profiles are public, and
// getUser can be called by anyone.
export interface UserProfile {
  _id: string;
  name: string;
  username: string;
  image?: string;
  bio?: string;
  location?: string;
  portfolio?: string;
  reputation: number;
  // An ISO date string: it comes from the server as JSON
  createdAt: string;
}

export interface Question {
  _id: string;
  title: string;
  tags: Tag[];
  author: Author;
  upvotes: number;
  answers: number;
  views: number;
  // An ISO date string: it comes from the server as JSON
  createdAt: string;
}

// An answer as the question page shows it. author is null when the user
// was deleted: the answer stays, shown as "Deleted user".
export interface Answer {
  _id: string;
  author: Author | null;
  content: string;
  upvotes: number;
  downvotes: number;
  // An ISO date string: it comes from the server as JSON
  createdAt: string;
}

// An answer on its author's profile: also says which question it
// answers, for the "Read more" link
export interface UserAnswer extends Answer {
  question: string;
}

// A question's or answer's counts after a vote, and the signed-in user's
// vote on it (null: not voted)
export interface VoteResult {
  upvotes: number;
  downvotes: number;
  userVote: VoteType | null;
}

// One hit from the navbar's global search. An answer links to its question.
export interface GlobalSearchResult {
  id: string;
  type: "question" | "answer" | "user" | "tag";
  title: string;
}

// A job from the JSearch API (lib/jobs.ts), cut down to what a card shows
export interface Job {
  id: string;
  title: string;
  employer?: string;
  logo?: string;
  // Where the job is posted. Both are http(s) links.
  applyLink?: string;
  employerWebsite?: string;
  // Already readable, e.g. "Full-time"
  employmentType?: string;
  description?: string;
  city?: string;
  state?: string;
  // ISO 3166-1 alpha-2, e.g. "EG"
  country?: string;
  // Already readable, e.g. "191K–294K a year"
  salary?: string;
}

// ---- Responses returned by server actions and API routes ----

export interface SuccessResponse<T = null> {
  success: true;
  data: T;
  status?: number;
}

export interface ErrorResponse {
  success: false;
  status: number;
  error: {
    message: string;
    details?: FieldErrors;
  };
}

// A union, so checking `success` tells TypeScript which one you have:
// if (res.success) { res.data } else { res.error.message }
export type ActionResponse<T = null> = SuccessResponse<T> | ErrorResponse;

// What an API route handler returns
export type APIResponse<T = null> = NextResponse<ActionResponse<T>>;

// What a value looks like after a trip through JSON (an API response):
// Dates and ObjectIds arrive as strings. e.g. Serialized<IUserDoc> has
// _id: string and createdAt: string.
export type Serialized<T> = T extends Date | Types.ObjectId
  ? string
  : T extends (infer U)[]
    ? Serialized<U>[]
    : T extends object
      ? { [K in keyof T]: Serialized<T[K]> }
      : T;
