"use server";

// Server actions: every export here can be called from the browser with a
// POST, so each one validates its own input.

import type { QueryFilter } from "mongoose";
import type { z } from "zod";

import Tag, { type ITag, type ITagDoc } from "@/database/tag.model";
import action from "@/lib/handlers/action";
import handleError from "@/lib/handlers/error";
import { escapeRegex } from "@/lib/regex";
import { TagsSearchParamsSchema } from "@/lib/validations";
import type { ActionResponse, TagListItem } from "@/types";

export type GetTagsInput = z.input<typeof TagsSearchParamsSchema>;

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
      .lean<Pick<ITagDoc, "_id" | "name" | "questions">[]>();

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
