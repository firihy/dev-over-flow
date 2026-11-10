import type { Types } from "mongoose";
import type { NextResponse } from "next/server";

import type { FieldErrors } from "@/lib/http-errors";

export interface Tag {
  _id: string;
  name: string;
}

export interface Author {
  _id: string;
  name: string;
  // Users without a profile picture fall back to a default avatar
  image?: string;
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
