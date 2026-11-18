"use server";

// Server actions: every export here can be called from the browser with a
// POST, so each one validates its own input.

import type { QueryFilter } from "mongoose";
import type { z } from "zod";

import Answer, { type IAnswerDoc } from "@/database/answer.model";
import Question from "@/database/question.model";
import User, { type IUser, type IUserDoc } from "@/database/user.model";
import action from "@/lib/handlers/action";
import handleError from "@/lib/handlers/error";
import { NotFoundError } from "@/lib/http-errors";
import {
  CARD_POPULATE,
  type ListedQuestion,
  toQuestionCards,
} from "@/lib/questions";
import { escapeRegex } from "@/lib/regex";
import {
  GetUserPostsSchema,
  GetUserSchema,
  UsersSearchParamsSchema,
} from "@/lib/validations";
import type {
  ActionResponse,
  Question as QuestionCardData,
  UserAnswer,
  UserListItem,
  UserProfile,
} from "@/types";

export type GetUsersInput = z.input<typeof UsersSearchParamsSchema>;
export type GetUserInput = z.input<typeof GetUserSchema>;
export type GetUserPostsInput = z.input<typeof GetUserPostsSchema>;

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

type ProfileFields = Pick<
  IUserDoc,
  | "_id"
  | "name"
  | "username"
  | "image"
  | "bio"
  | "location"
  | "portfolio"
  | "reputation"
  | "createdAt"
>;

// One user's public profile, with how many questions and answers they
// posted. Public: no sign-in needed. Loads only the public fields, so the
// email never leaves the server.
export async function getUser(input: GetUserInput): Promise<
  ActionResponse<{
    user: UserProfile;
    totalQuestions: number;
    totalAnswers: number;
  }>
> {
  try {
    const { params } = await action({ params: input, schema: GetUserSchema });
    const { userId } = params;

    // Independent of each other, so all at once. Both counts use the
    // author index.
    const [user, totalQuestions, totalAnswers] = await Promise.all([
      User.findById(
        userId,
        "name username image bio location portfolio reputation createdAt",
      ).lean<ProfileFields>(),
      Question.countDocuments({ author: userId }),
      Answer.countDocuments({ author: userId }),
    ]);
    if (!user) throw new NotFoundError("User");

    return {
      success: true,
      status: 200,
      data: {
        user: {
          _id: user._id.toString(),
          name: user.name,
          username: user.username,
          image: user.image,
          bio: user.bio,
          location: user.location,
          portfolio: user.portfolio,
          reputation: user.reputation ?? 0,
          createdAt: user.createdAt.toISOString(),
        },
        totalQuestions,
        totalAnswers,
      },
    };
  } catch (error) {
    return handleError(error);
  }
}

// One page of a user's questions for their profile's "Top Posts": most
// upvoted first, then newest. _id last so ties keep a fixed order between
// pages. Public: no sign-in needed. An unknown user just has none; the
// page checks the user itself.
export async function getUserQuestions(
  input: GetUserPostsInput,
): Promise<ActionResponse<{ questions: QuestionCardData[]; isNext: boolean }>> {
  try {
    const { params } = await action({
      params: input,
      schema: GetUserPostsSchema,
    });
    const { userId, page, pageSize } = params;

    // One extra: if it comes back, there's a next page
    const docs = await Question.find({ author: userId })
      .sort({ upvotes: -1, createdAt: -1, _id: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize + 1)
      .populate(CARD_POPULATE)
      .lean<ListedQuestion[]>();

    return {
      success: true,
      status: 200,
      data: {
        questions: toQuestionCards(docs.slice(0, pageSize)),
        isNext: docs.length > pageSize,
      },
    };
  } catch (error) {
    return handleError(error);
  }
}

// An answer loaded with its author's name and picture and .lean()
type ListedAnswer = Omit<IAnswerDoc, "author"> & {
  author: Pick<IUserDoc, "_id" | "name" | "image"> | null;
};

// One page of a user's answers for their profile, newest first. Public:
// no sign-in needed. An unknown user just has none; the page checks the
// user itself.
export async function getUserAnswers(
  input: GetUserPostsInput,
): Promise<ActionResponse<{ answers: UserAnswer[]; isNext: boolean }>> {
  try {
    const { params } = await action({
      params: input,
      schema: GetUserPostsSchema,
    });
    const { userId, page, pageSize } = params;

    // One extra: if it comes back, there's a next page
    const docs = await Answer.find({ author: userId })
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize + 1)
      .populate({ path: "author", select: "name image" })
      .lean<ListedAnswer[]>();

    // Only the fields the card shows, as plain strings
    const answers = docs
      .slice(0, pageSize)
      .map(
        ({
          _id,
          author,
          question,
          content,
          upvotes,
          downvotes,
          createdAt,
        }) => ({
          _id: _id.toString(),
          author: author && {
            _id: author._id.toString(),
            name: author.name,
            image: author.image,
          },
          question: question.toString(),
          content,
          upvotes,
          downvotes,
          createdAt: createdAt.toISOString(),
        }),
      );

    return {
      success: true,
      status: 200,
      data: { answers, isNext: docs.length > pageSize },
    };
  } catch (error) {
    return handleError(error);
  }
}
