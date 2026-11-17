"use server";

// Server actions: every export here can be called from the browser with a
// POST, so each one validates its own input.

import type { QueryFilter } from "mongoose";
import type { z } from "zod";

import User, { type IUser, type IUserDoc } from "@/database/user.model";
import action from "@/lib/handlers/action";
import handleError from "@/lib/handlers/error";
import { escapeRegex } from "@/lib/regex";
import { UsersSearchParamsSchema } from "@/lib/validations";
import type { ActionResponse, UserListItem } from "@/types";

export type GetUsersInput = z.input<typeof UsersSearchParamsSchema>;

type UserFields = Pick<
  IUserDoc,
  "_id" | "name" | "username" | "image" | "reputation"
>;

// What each filter sorts by. _id comes last so users with the same date or
// reputation (most have 0) keep a fixed order, and none repeat or go
// missing between pages.
const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  popular: { reputation: -1, _id: 1 },
} as const;

// One page of users for the community page, newest first unless a filter
// says otherwise. Public: no sign-in needed. Searches the name and the
// username only: searching emails would tell anyone who has an account.
export async function getUsers(
  input: GetUsersInput,
): Promise<ActionResponse<{ users: UserListItem[]; isNext: boolean }>> {
  try {
    // Use the parsed params: they have the defaults and the trimmed query
    const { params } = await action({
      params: input,
      schema: UsersSearchParamsSchema,
    });
    const { page, pageSize, query, filter = "newest" } = params;

    const filterQuery: QueryFilter<IUser> = {};
    if (query) {
      const pattern = { $regex: escapeRegex(query), $options: "i" };
      filterQuery.$or = [{ name: pattern }, { username: pattern }];
    }

    // One extra: if it comes back, there's a next page. Cheaper than
    // counting every match with countDocuments().
    const docs = await User.find(filterQuery, "name username image reputation")
      .sort(SORTS[filter])
      .skip((page - 1) * pageSize)
      .limit(pageSize + 1)
      .lean<UserFields[]>();

    const users = docs.slice(0, pageSize).map((user) => ({
      _id: user._id.toString(),
      name: user.name,
      username: user.username,
      image: user.image,
      reputation: user.reputation ?? 0,
    }));

    return {
      success: true,
      status: 200,
      data: { users, isNext: docs.length > pageSize },
    };
  } catch (error) {
    return handleError(error);
  }
}
