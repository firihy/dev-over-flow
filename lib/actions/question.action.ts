"use server";

// Server actions: every export here can be called from the browser with a
// POST, so each one validates its own input.

import type { QueryFilter } from "mongoose";
import { revalidatePath } from "next/cache";
import type { z } from "zod";

import Answer from "@/database/answer.model";
import Collection from "@/database/collection.model";
import Question, {
  type IQuestion,
  type IQuestionDoc,
} from "@/database/question.model";
import TagQuestion from "@/database/tag-question.model";
import Tag, { type ITagDoc } from "@/database/tag.model";
import type { IUserDoc } from "@/database/user.model";
import Vote from "@/database/vote.model";
import action from "@/lib/handlers/action";
import handleError from "@/lib/handlers/error";
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/http-errors";
import {
  changeReputation,
  deleteInteractionsOf,
  recordInteraction,
} from "@/lib/interactions";
import dbConnect from "@/lib/mongoose";
import {
  CARD_POPULATE,
  type ListedQuestion,
  toQuestionCards,
} from "@/lib/questions";
import { escapeRegex } from "@/lib/regex";
import { postPoints } from "@/lib/reputation";
import {
  AskQuestionSchema,
  DeleteQuestionSchema,
  EditQuestionSchema,
  GetQuestionSchema,
  IncrementViewsSchema,
  QuestionsSearchParamsSchema,
} from "@/lib/validations";
import type {
  ActionResponse,
  Question as QuestionCardData,
  Serialized,
} from "@/types";

export type CreateQuestionInput = z.input<typeof AskQuestionSchema>;
export type EditQuestionInput = z.input<typeof EditQuestionSchema>;
export type GetQuestionInput = z.input<typeof GetQuestionSchema>;
export type IncrementViewsInput = z.input<typeof IncrementViewsSchema>;
export type GetQuestionsInput = z.input<typeof QuestionsSearchParamsSchema>;
export type DeleteQuestionInput = z.input<typeof DeleteQuestionSchema>;

// A question with its tags and author loaded (populated) instead of just
// their ids. author is null when the user was deleted.
export type QuestionDetails = Omit<IQuestionDoc, "tags" | "author"> & {
  tags: ITagDoc[];
  author: Pick<IUserDoc, "_id" | "name" | "image"> | null;
};

// Same collation as the Tag name index: the lookup ignores case and uses
// the index (see tag.model.ts)
const TAG_NAME_COLLATION = { locale: "en", strength: 2 };

// Posts a question for the signed-in user. Its tags are created the first
// time they're used, and every tag's question count goes up by one.
export async function createQuestion(
  input: CreateQuestionInput,
): Promise<ActionResponse<Serialized<IQuestionDoc>>> {
  try {
    const { params, session } = await action({
      params: input,
      schema: AskQuestionSchema,
      authorize: true,
    });
    const { title, content, tags } = params;

    const userId = session.user?.id;
    if (!userId) throw new UnauthorizedError();

    const { connection } = await dbConnect();

    // The tags, their counts, the question and its links are saved
    // together or not at all. connection.transaction() also retries on
    // temporary errors, so everything inside must be safe to run again.
    const question = await connection.transaction(async (dbSession) => {
      // Tags first: the question needs their ids (1 to 3 are required).
      // An exact match, not a regex built from the input: "c++" or ".*"
      // would be read as a pattern.
      const tagIds = [];
      for (const name of tags) {
        // upsert: creates { name, questions: 1 } when the tag is new
        const tag = await Tag.findOneAndUpdate(
          { name },
          { $inc: { questions: 1 } },
          {
            upsert: true,
            returnDocument: "after",
            collation: TAG_NAME_COLLATION,
            session: dbSession,
          },
        );
        tagIds.push(tag._id);
      }

      const [created] = await Question.create(
        [{ title, content, tags: tagIds, author: userId }],
        { session: dbSession },
      );

      await TagQuestion.insertMany(
        tagIds.map((tag) => ({ tag, question: created._id })),
        { session: dbSession },
      );

      // Posting earns reputation and goes in the activity log
      await recordInteraction(
        {
          userId,
          action: "post",
          target: "question",
          targetId: created._id.toString(),
        },
        dbSession,
      );
      await changeReputation(
        [{ userId, points: postPoints("question") }],
        dbSession,
      );

      return created;
    });

    return {
      success: true,
      status: 201,
      // A plain object for the browser: ObjectIds and Dates become strings
      data: JSON.parse(
        JSON.stringify(question.toObject()),
      ) as Serialized<IQuestionDoc>,
    };
  } catch (error) {
    return handleError(error);
  }
}

// Updates the title, content and tags of a question. Only its author can.
// Tags are compared by name, ignoring case: kept tags are left alone, new
// ones count one more question, removed ones one less.
export async function editQuestion(
  input: EditQuestionInput,
): Promise<ActionResponse<Serialized<IQuestionDoc>>> {
  try {
    const { params, session } = await action({
      params: input,
      schema: EditQuestionSchema,
      authorize: true,
    });
    const { questionId, title, content, tags } = params;

    const userId = session.user?.id;
    if (!userId) throw new UnauthorizedError();

    const { connection } = await dbConnect();

    // Same as createQuestion: all or nothing, and safe to run again
    const question = await connection.transaction(async (dbSession) => {
      const found = await Question.findById(questionId).session(dbSession);
      if (!found) throw new NotFoundError("Question");
      if (!found.author.equals(userId)) {
        throw new ForbiddenError("Only the author can edit this question");
      }

      // The tags it has now, by lowercase name ("React" = "react")
      const currentTags = await Tag.find({ _id: { $in: found.tags } }).session(
        dbSession,
      );
      const currentIds = new Map(
        currentTags.map((tag) => [tag.name.toLowerCase(), tag._id]),
      );
      const wanted = new Set(tags.map((name) => name.toLowerCase()));
      const removedIds = currentTags
        .filter((tag) => !wanted.has(tag.name.toLowerCase()))
        .map((tag) => tag._id);

      // The new list, in the order the user typed it
      const tagIds = [];
      const addedIds = [];
      for (const name of tags) {
        const currentId = currentIds.get(name.toLowerCase());
        if (currentId) {
          tagIds.push(currentId);
          continue;
        }
        // An exact match, not a regex (see createQuestion)
        const tag = await Tag.findOneAndUpdate(
          { name },
          { $inc: { questions: 1 } },
          {
            upsert: true,
            returnDocument: "after",
            collation: TAG_NAME_COLLATION,
            session: dbSession,
          },
        );
        tagIds.push(tag._id);
        addedIds.push(tag._id);
      }

      if (removedIds.length > 0) {
        // $inc skips `min: 0`, so the filter keeps counts from going negative
        await Tag.updateMany(
          { _id: { $in: removedIds }, questions: { $gt: 0 } },
          { $inc: { questions: -1 } },
          { session: dbSession },
        );
        await TagQuestion.deleteMany(
          { question: found._id, tag: { $in: removedIds } },
          { session: dbSession },
        );
      }

      if (addedIds.length > 0) {
        await TagQuestion.insertMany(
          addedIds.map((tag) => ({ tag, question: found._id })),
          { session: dbSession },
        );
      }

      // save() runs the schema rules again (title length, 1 to 3 tags)
      found.set({ title, content, tags: tagIds });
      await found.save({ session: dbSession });
      return found;
    });

    return {
      success: true,
      status: 200,
      data: JSON.parse(
        JSON.stringify(question.toObject()),
      ) as Serialized<IQuestionDoc>,
    };
  } catch (error) {
    return handleError(error);
  }
}

// Loads one question with its tags. No sign-in needed: questions are
// public, and this is also callable as a POST like every action here.
export async function getQuestion(
  input: GetQuestionInput,
): Promise<ActionResponse<Serialized<QuestionDetails>>> {
  try {
    const { params } = await action({
      params: input,
      schema: GetQuestionSchema,
    });

    const question = await Question.findById(params.questionId)
      .populate<{ tags: ITagDoc[] }>("tags")
      .populate<{ author: QuestionDetails["author"] }>("author", "name image")
      .lean();
    if (!question) throw new NotFoundError("Question");

    return {
      success: true,
      status: 200,
      data: JSON.parse(JSON.stringify(question)) as Serialized<QuestionDetails>,
    };
  } catch (error) {
    return handleError(error);
  }
}

// What each filter sorts by. _id comes last so questions with the same
// date or votes keep a fixed order, and none repeat or go missing between
// pages.
const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  popular: { upvotes: -1, createdAt: -1, _id: -1 },
  unanswered: { createdAt: -1, _id: -1 },
} as const;

// One page of questions for the home page, newest first unless a filter
// says otherwise. Public: no sign-in needed.
export async function getQuestions(
  input: GetQuestionsInput,
): Promise<ActionResponse<{ questions: QuestionCardData[]; isNext: boolean }>> {
  try {
    // Use the parsed params: they have the defaults and the trimmed query
    const { params } = await action({
      params: input,
      schema: QuestionsSearchParamsSchema,
    });
    const { page, pageSize, query, filter = "newest" } = params;

    const filterQuery: QueryFilter<IQuestion> = {};
    if (query) {
      const pattern = { $regex: escapeRegex(query), $options: "i" };
      filterQuery.$or = [{ title: pattern }, { content: pattern }];
    }
    if (filter === "unanswered") filterQuery.answers = 0;

    // One extra: if it comes back, there's a next page. Cheaper than
    // counting every match with countDocuments().
    const docs = await Question.find(filterQuery)
      .sort(SORTS[filter])
      .skip((page - 1) * pageSize)
      .limit(pageSize + 1)
      .populate(CARD_POPULATE)
      .lean<ListedQuestion[]>();

    const isNext = docs.length > pageSize;

    const questions = toQuestionCards(docs.slice(0, pageSize));

    return { success: true, status: 200, data: { questions, isNext } };
  } catch (error) {
    return handleError(error);
  }
}

// Adds one view to a question. Called from the browser when a question page
// opens. Public: anyone can call it, so it only ever adds 1.
export async function incrementViews(
  input: IncrementViewsInput,
): Promise<ActionResponse<{ views: number }>> {
  try {
    const { params } = await action({
      params: input,
      schema: IncrementViewsSchema,
    });

    // $inc is done by the database in one step, so two views at the same
    // moment both count (read, add 1, save would lose one). timestamps:
    // false keeps updatedAt for real edits, not views.
    const question = await Question.findByIdAndUpdate(
      params.questionId,
      { $inc: { views: 1 } },
      { returnDocument: "after", timestamps: false, projection: { views: 1 } },
    ).lean();
    if (!question) throw new NotFoundError("Question");

    return { success: true, status: 200, data: { views: question.views } };
  } catch (error) {
    return handleError(error);
  }
}

// How many questions the right sidebar's "Top Questions" shows
const HOT_QUESTIONS_LIMIT = 5;

// The most viewed questions for the right sidebar, then the most upvoted.
// _id comes last so ties keep a fixed order. Only the title is loaded: a
// question's body can be long and the sidebar doesn't show it.
// Public and takes no input, so there's nothing to validate.
export async function getHotQuestions(): Promise<
  ActionResponse<{ _id: string; title: string }[]>
> {
  try {
    await dbConnect();

    const docs = await Question.find({}, "title")
      .sort({ views: -1, upvotes: -1, _id: -1 })
      .limit(HOT_QUESTIONS_LIMIT)
      .lean<Pick<IQuestionDoc, "_id" | "title">[]>();

    const questions = docs.map(({ _id, title }) => ({
      _id: _id.toString(),
      title,
    }));

    return { success: true, status: 200, data: questions };
  } catch (error) {
    return handleError(error);
  }
}

// Deletes a question and everything that belongs to it: its answers, the
// votes on both, the copies users saved and its tag links. Each of its
// tags counts one question less. Only its author can.
export async function deleteQuestion(
  input: DeleteQuestionInput,
): Promise<ActionResponse> {
  try {
    const { params, session } = await action({
      params: input,
      schema: DeleteQuestionSchema,
      authorize: true,
    });
    const { questionId } = params;

    const userId = session.user?.id;
    if (!userId) throw new UnauthorizedError();

    const { connection } = await dbConnect();

    // All or nothing, so no vote or answer is left pointing at a deleted
    // question. Safe to run again (see createQuestion).
    await connection.transaction(async (dbSession) => {
      const found = await Question.findById(questionId, "author tags").session(
        dbSession,
      );
      if (!found) throw new NotFoundError("Question");
      if (!found.author.equals(userId)) {
        throw new ForbiddenError("Only the author can delete this question");
      }

      // The answers' ids first: their votes go too
      const answerIds = await Answer.find({ question: found._id })
        .session(dbSession)
        .distinct("_id");

      await Vote.deleteMany(
        {
          $or: [
            { actionId: found._id, actionTarget: "question" },
            { actionId: { $in: answerIds }, actionTarget: "answer" },
          ],
        },
        { session: dbSession },
      );
      await Answer.deleteMany({ question: found._id }, { session: dbSession });
      await Collection.deleteMany(
        { question: found._id },
        { session: dbSession },
      );
      await TagQuestion.deleteMany(
        { question: found._id },
        { session: dbSession },
      );
      // The filter keeps counts from going negative (see editQuestion)
      await Tag.updateMany(
        { _id: { $in: found.tags }, questions: { $gt: 0 } },
        { $inc: { questions: -1 } },
        { session: dbSession },
      );
      await found.deleteOne({ session: dbSession });

      // The log lines about the question and its answers go too. Then the
      // delete is logged and the reputation from posting is taken back.
      await deleteInteractionsOf("answer", answerIds, dbSession);
      await deleteInteractionsOf("question", [found._id], dbSession);
      await recordInteraction(
        {
          userId,
          action: "delete",
          target: "question",
          targetId: questionId,
        },
        dbSession,
      );
      await changeReputation(
        [{ userId, points: postPoints("question", -1) }],
        dbSession,
      );
    });

    // The question was on many pages (home, its tags, profiles, saved
    // lists) and in the right sidebar, which every page shows
    revalidatePath("/", "layout");

    return { success: true, status: 200, data: null };
  } catch (error) {
    return handleError(error);
  }
}
