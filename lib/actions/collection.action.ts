"use server";

// Server actions: every export here can be called from the browser with a
// POST, so each one validates its own input.

import { type PipelineStage, Types } from "mongoose";
import { revalidatePath } from "next/cache";
import type { z } from "zod";

import { auth } from "@/auth";
import ROUTES from "@/constants/routes";
import Collection from "@/database/collection.model";
import Question from "@/database/question.model";
import action from "@/lib/handlers/action";
import handleError, { isDuplicateKeyError } from "@/lib/handlers/error";
import { NotFoundError, UnauthorizedError } from "@/lib/http-errors";
import { recordInteractionOnce } from "@/lib/interactions";
import {
  CARD_POPULATE,
  type ListedQuestion,
  toQuestionCards,
} from "@/lib/questions";
import { escapeRegex } from "@/lib/regex";
import {
  CollectionBaseSchema,
  CollectionSearchParamsSchema,
} from "@/lib/validations";
import type { ActionResponse, Question as QuestionCardData } from "@/types";

export type CollectionBaseInput = z.input<typeof CollectionBaseSchema>;
export type GetSavedQuestionsInput = z.input<
  typeof CollectionSearchParamsSchema
>;

// createdAt is when the question was saved (the Collection row's).
// _id last, so equal values keep the same order from page to page.
const SORTS = {
  mostrecent: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  mostvoted: { "question.upvotes": -1, createdAt: -1, _id: -1 },
  mostanswered: { "question.answers": -1, createdAt: -1, _id: -1 },
} as const;

// Saves the question for the signed-in user, or unsaves it if it was
// already saved. Returns what is saved now.
export async function toggleSaveQuestion(
  input: CollectionBaseInput,
): Promise<ActionResponse<{ saved: boolean }>> {
  try {
    const { params, session } = await action({
      params: input,
      schema: CollectionBaseSchema,
      authorize: true,
    });
    const { questionId } = params;

    const userId = session.user?.id;
    if (!userId) throw new UnauthorizedError();

    // Each step is a single database write, so two clicks at the same
    // moment can't both decide "not saved yet" and fail on the second
    // create. The filter always has the user, so nobody can unsave
    // someone else's question.
    const filter = { author: userId, question: questionId };

    let saved: boolean;
    const { deletedCount } = await Collection.deleteOne(filter);
    if (deletedCount > 0) {
      // It was saved: now it's not. Works even if the question was
      // deleted since, so old saves can still be removed.
      saved = false;
    } else {
      if (!(await Question.exists({ _id: questionId }))) {
        throw new NotFoundError("Question");
      }
      try {
        await Collection.create(filter);
      } catch (error) {
        // The unique { author, question } index: another click saved it
        // a moment ago, which is the result we wanted anyway
        if (!isDuplicateKeyError(error)) throw error;
      }
      saved = true;

      // Saving shows interest, so recommendations can use it
      await recordInteractionOnce({
        userId,
        action: "bookmark",
        target: "question",
        targetId: questionId,
      });
    }

    // The star on the question page, and the list of saved questions
    revalidatePath(ROUTES.QUESTION(questionId));
    revalidatePath(ROUTES.COLLECTION);

    return { success: true, status: 200, data: { saved } };
  } catch (error) {
    return handleError(error);
  }
}

// Whether the signed-in user saved the question. Signed-out users simply
// have nothing saved: that's not an error.
export async function hasSavedQuestion(
  input: CollectionBaseInput,
): Promise<ActionResponse<{ saved: boolean }>> {
  try {
    const { params } = await action({
      params: input,
      schema: CollectionBaseSchema,
    });

    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: true, status: 200, data: { saved: false } };

    // Uses the { author, question } index
    const saved = await Collection.exists({
      author: userId,
      question: params.questionId,
    });

    return { success: true, status: 200, data: { saved: !!saved } };
  } catch (error) {
    return handleError(error);
  }
}

// One page of the signed-in user's saved questions, most recently saved
// first unless a filter says otherwise.
export async function getSavedQuestions(
  input: GetSavedQuestionsInput,
): Promise<ActionResponse<{ questions: QuestionCardData[]; isNext: boolean }>> {
  try {
    const { params, session } = await action({
      params: input,
      schema: CollectionSearchParamsSchema,
      authorize: true,
    });
    const { page, pageSize, query, filter = "mostrecent" } = params;

    const userId = session.user?.id;
    if (!userId) throw new UnauthorizedError();

    // A Collection row only has author and question, so the search and
    // the vote/answer sorts need the question itself: join it in with
    // $lookup. One query for the page, whatever the filter.
    const pipeline: PipelineStage[] = [
      // aggregate() doesn't cast strings to ObjectIds like find() does.
      // Uses the { author, question } index.
      { $match: { author: new Types.ObjectId(userId) } },
      {
        $lookup: {
          from: Question.collection.name,
          localField: "question",
          foreignField: "_id",
          as: "question",
        },
      },
      // A save whose question was deleted has nothing to join: drop it
      { $unwind: "$question" },
    ];
    if (query) {
      const pattern = { $regex: escapeRegex(query), $options: "i" };
      pipeline.push({
        $match: {
          $or: [{ "question.title": pattern }, { "question.content": pattern }],
        },
      });
    }
    pipeline.push(
      { $sort: SORTS[filter] },
      { $skip: (page - 1) * pageSize },
      // One extra: if it comes back, there's a next page
      { $limit: pageSize + 1 },
      // Keep only the question, without its (long) body
      { $replaceRoot: { newRoot: "$question" } },
      { $project: { content: 0 } },
    );

    const saved = await Collection.aggregate<ListedQuestion>(pipeline);
    const isNext = saved.length > pageSize;

    // Load the tag names and authors, like the other question lists
    const docs = await Question.populate<ListedQuestion>(
      saved.slice(0, pageSize),
      CARD_POPULATE.map((path) => ({ ...path, options: { lean: true } })),
    );

    return {
      success: true,
      status: 200,
      data: { questions: toQuestionCards(docs), isNext },
    };
  } catch (error) {
    return handleError(error);
  }
}
