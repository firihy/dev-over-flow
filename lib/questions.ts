// Turning loaded questions into the data a QuestionCard shows. Shared by
// the lists in question.action.ts and tag.action.ts (a "use server" file
// may only export async functions, so this can't live there).

import type { IQuestionDoc } from "@/database/question.model";
import type { ITagDoc } from "@/database/tag.model";
import type { IUserDoc } from "@/database/user.model";
import type { Question as QuestionCardData } from "@/types";

// What to populate for a card: only the tag names and the author's
// name and picture
export const CARD_POPULATE = [
  { path: "tags", select: "name" },
  { path: "author", select: "name image" },
];

// A question loaded with CARD_POPULATE and .lean()
export type ListedQuestion = Omit<IQuestionDoc, "tags" | "author"> & {
  tags: Pick<ITagDoc, "_id" | "name">[];
  author: Pick<IUserDoc, "_id" | "name" | "image"> | null;
};

// Only the fields the card shows. A question whose author was deleted
// comes back with author: null and is left out.
export const toQuestionCards = (docs: ListedQuestion[]): QuestionCardData[] =>
  docs.flatMap(({ author, ...q }) =>
    author
      ? [
          {
            _id: q._id.toString(),
            title: q.title,
            tags: q.tags.map((tag) => ({
              _id: tag._id.toString(),
              name: tag.name,
            })),
            author: {
              _id: author._id.toString(),
              name: author.name,
              image: author.image,
            },
            upvotes: q.upvotes,
            answers: q.answers,
            views: q.views,
            createdAt: q.createdAt.toISOString(),
          },
        ]
      : [],
  );
