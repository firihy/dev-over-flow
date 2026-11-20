// Not "use server": this takes a user id from its caller, so it must never
// be callable from the browser (see lib/interactions.ts).
import "server-only";

import type { QueryFilter } from "mongoose";

import Interaction, {
  type InteractionAction,
} from "@/database/interaction.model";
import Question, { type IQuestion } from "@/database/question.model";
import {
  CARD_POPULATE,
  type ListedQuestion,
  toQuestionCards,
} from "@/lib/questions";
import { escapeRegex } from "@/lib/regex";
import type { Question as QuestionCardData } from "@/types";

// How many of the user's latest interactions decide what they like. The
// same ones are left out of the results: they've seen those already.
const RECENT_INTERACTIONS = 200;

// What shows interest in a question. Searches, edits and deletes don't.
const INTEREST_ACTIONS: InteractionAction[] = [
  "view",
  "upvote",
  "bookmark",
  "post",
];

interface RecommendationParams {
  userId: string;
  query?: string;
  page: number;
  pageSize: number;
}

// Questions the user hasn't seen that share a tag with ones they read,
// upvoted, saved or asked, most upvoted first. Never their own questions.
// A user with no activity yet gets the most upvoted questions instead, so
// the list isn't empty on their first visit.
export const getRecommendedQuestions = async ({
  userId,
  query,
  page,
  pageSize,
}: RecommendationParams): Promise<{
  questions: QuestionCardData[];
  isNext: boolean;
}> => {
  const interactions = await Interaction.find(
    {
      user: userId,
      actionTarget: "question",
      action: { $in: INTEREST_ACTIONS },
    },
    { actionId: 1 },
  )
    .sort({ createdAt: -1 })
    .limit(RECENT_INTERACTIONS)
    .lean();
  const seenIds = interactions.map(({ actionId }) => actionId);

  const seen = await Question.find(
    { _id: { $in: seenIds } },
    { tags: 1 },
  ).lean();
  // A Set, so a tag used by many questions counts once
  const tagIds = [...new Set(seen.flatMap(({ tags }) => tags.map(String)))];

  const filter: QueryFilter<IQuestion> = {
    _id: { $nin: seenIds },
    author: { $ne: userId },
  };
  if (tagIds.length > 0) filter.tags = { $in: tagIds };
  if (query) {
    const pattern = { $regex: escapeRegex(query), $options: "i" };
    filter.$or = [{ title: pattern }, { content: pattern }];
  }

  // One extra: if it comes back, there's a next page (see getQuestions)
  const docs = await Question.find(filter)
    .sort({ upvotes: -1, views: -1, _id: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize + 1)
    .populate(CARD_POPULATE)
    .lean<ListedQuestion[]>();

  return {
    questions: toQuestionCards(docs.slice(0, pageSize)),
    isNext: docs.length > pageSize,
  };
};
