"use server";

// Server actions: every export here can be called from the browser with a
// POST, so each one validates its own input.

import type { QueryFilter } from "mongoose";
import type { z } from "zod";

import Question, { type IQuestion } from "@/database/question.model";
import Tag, { type ITag, type ITagDoc } from "@/database/tag.model";
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
  GetTagQuestionsSchema,
  TagsSearchParamsSchema,
} from "@/lib/validations";
import type {
  ActionResponse,
  Question as QuestionCardData,
  TagListItem,
} from "@/types";

export type GetTagsInput = z.input<typeof TagsSearchParamsSchema>;
export type GetTagQuestionsInput = z.input<typeof GetTagQuestionsSchema>;

type TagFields = Pick<ITagDoc, "_id" | "name" | "questions">;

// What each filter sorts by. _id comes last so tags with the same count or
// date keep a fixed order, and none repeat or go missing between pages.
const SORTS = {
  popular: { questions: -1, name: 1, _id: 1 },
  recent: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  name: { name: 1, _id: 1 },
} as const;

// The tag name index's collation: names sort ignoring case, so "angular"
// comes before "React" (a plain sort puts every capital first)
const NAME_COLLATION = { locale: "en", strength: 2 };

// One page of tags for the tags page, most used first unless a filter says
// otherwise. Public: no sign-in needed.
export async function getTags(
  input: GetTagsInput,
): Promise<ActionResponse<{ tags: TagListItem[]; isNext: boolean }>> {
  try {
    // Use the parsed params: they have the defaults and the trimmed query
    const { params } = await action({
      params: input,
      schema: TagsSearchParamsSchema,
    });
    const { page, pageSize, query, filter = "popular" } = params;

    const filterQuery: QueryFilter<ITag> = {};
    if (query) {
      filterQuery.name = { $regex: escapeRegex(query), $options: "i" };
    }

    // One extra: if it comes back, there's a next page. Cheaper than
    // counting every match with countDocuments().
    const docs = await Tag.find(filterQuery, "name questions")
      .collation(NAME_COLLATION)
      .sort(SORTS[filter])
      .skip((page - 1) * pageSize)
      .limit(pageSize + 1)
      .lean<TagFields[]>();

    const tags = docs.slice(0, pageSize).map((tag) => ({
      _id: tag._id.toString(),
      name: tag.name,
      questions: tag.questions,
    }));

    return {
      success: true,
      status: 200,
      data: { tags, isNext: docs.length > pageSize },
    };
  } catch (error) {
    return handleError(error);
  }
}

// One tag and a page of the questions that use it, newest first.
// Public: no sign-in needed. A bad tag ID is a 400, an unknown one a 404.
export async function getTagQuestions(input: GetTagQuestionsInput): Promise<
  ActionResponse<{
    tag: TagListItem;
    questions: QuestionCardData[];
    isNext: boolean;
  }>
> {
  try {
    const { params } = await action({
      params: input,
      schema: GetTagQuestionsSchema,
    });
    const { tagId, page, pageSize, query } = params;

    const filterQuery: QueryFilter<IQuestion> = { tags: tagId };
    if (query) {
      const pattern = { $regex: escapeRegex(query), $options: "i" };
      filterQuery.$or = [{ title: pattern }, { content: pattern }];
    }

    // The tag and its questions don't depend on each other, so load both
    // at once. One extra question tells us if there's a next page.
    const [tag, docs] = await Promise.all([
      Tag.findById(tagId, "name questions").lean<TagFields>(),
      Question.find(filterQuery)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize + 1)
        .populate(CARD_POPULATE)
        .lean<ListedQuestion[]>(),
    ]);
    if (!tag) throw new NotFoundError("Tag");

    return {
      success: true,
      status: 200,
      data: {
        tag: {
          _id: tag._id.toString(),
          name: tag.name,
          questions: tag.questions,
        },
        questions: toQuestionCards(docs.slice(0, pageSize)),
        isNext: docs.length > pageSize,
      },
    };
  } catch (error) {
    return handleError(error);
  }
}
