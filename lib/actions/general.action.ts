"use server";

// Server actions: every export here can be called from the browser with a
// POST, so each one validates its own input.

import type { z } from "zod";

import Answer from "@/database/answer.model";
import Question from "@/database/question.model";
import Tag from "@/database/tag.model";
import User from "@/database/user.model";
import action from "@/lib/handlers/action";
import handleError from "@/lib/handlers/error";
import { escapeRegex } from "@/lib/regex";
import { toPlainText } from "@/lib/utils";
import { GlobalSearchSchema } from "@/lib/validations";
import type { ActionResponse, GlobalSearchResult } from "@/types";

export type GlobalSearchInput = z.input<typeof GlobalSearchSchema>;

// A few of each kind when searching everything, more when narrowed to one
const LIMIT_ALL = 2;
const LIMIT_ONE = 8;

// Searches questions (title), answers (text), users (name, username) and
// tags (name). Public: no sign-in needed. Never reads or returns an email.
export async function globalSearch(
  input: GlobalSearchInput,
): Promise<ActionResponse<GlobalSearchResult[]>> {
  try {
    const { params } = await action({
      params: input,
      schema: GlobalSearchSchema,
    });
    const { type } = params;
    const pattern = { $regex: escapeRegex(params.query), $options: "i" };
    const limit = type ? LIMIT_ONE : LIMIT_ALL;
    const wants = (kind: GlobalSearchResult["type"]) => !type || type === kind;

    const [questions, answers, users, tags] = await Promise.all([
      wants("question")
        ? Question.find({ title: pattern }, "title")
            .sort({ createdAt: -1, _id: -1 })
            .limit(limit)
            .lean()
        : [],
      wants("answer")
        ? Answer.find({ content: pattern }, "content question")
            .sort({ createdAt: -1, _id: -1 })
            .limit(limit)
            .lean()
        : [],
      wants("user")
        ? User.find({ $or: [{ name: pattern }, { username: pattern }] }, "name")
            .sort({ reputation: -1, _id: 1 })
            .limit(limit)
            .lean()
        : [],
      wants("tag")
        ? Tag.find({ name: pattern }, "name")
            .sort({ questions: -1, _id: 1 })
            .limit(limit)
            .lean()
        : [],
    ]);

    const results: GlobalSearchResult[] = [
      ...questions.map((question) => ({
        id: question._id.toString(),
        type: "question" as const,
        title: question.title,
      })),
      ...answers.map((answer) => ({
        // An answer has no page of its own: link to its question
        id: answer.question.toString(),
        type: "answer" as const,
        title: toPlainText(answer.content, 90),
      })),
      ...users.map((user) => ({
        id: user._id.toString(),
        type: "user" as const,
        title: user.name,
      })),
      ...tags.map((tag) => ({
        id: tag._id.toString(),
        type: "tag" as const,
        title: tag.name,
      })),
    ];

    return { success: true, status: 200, data: results };
  } catch (error) {
    return handleError(error);
  }
}
