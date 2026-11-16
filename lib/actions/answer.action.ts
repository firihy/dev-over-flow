"use server";

// Server actions: every export here can be called from the browser with a
// POST, so each one validates its own input.

import { revalidatePath } from "next/cache";
import type { z } from "zod";

import type { AnswerFilterValue } from "@/constants/filters";
import ROUTES from "@/constants/routes";
import Answer, { type IAnswerDoc } from "@/database/answer.model";
import Question from "@/database/question.model";
import type { IUserDoc } from "@/database/user.model";
import action from "@/lib/handlers/action";
import handleError from "@/lib/handlers/error";
import { NotFoundError, UnauthorizedError } from "@/lib/http-errors";
import dbConnect from "@/lib/mongoose";
import { AnswerServerSchema, GetAnswersSchema } from "@/lib/validations";
import type { ActionResponse, Answer as AnswerData, Serialized } from "@/types";

export type CreateAnswerInput = z.input<typeof AnswerServerSchema>;
export type GetAnswersInput = z.input<typeof GetAnswersSchema>;

// An answer loaded with its author's name and picture and .lean()
type ListedAnswer = Omit<IAnswerDoc, "author"> & {
  author: Pick<IUserDoc, "_id" | "name" | "image"> | null;
};

// Every sort ends with _id, so answers with the same date or votes keep
// a fixed order across pages
const SORTS: Record<AnswerFilterValue, Record<string, 1 | -1>> = {
  latest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  popular: { upvotes: -1, createdAt: -1, _id: -1 },
};

// Posts an answer for the signed-in user and adds one to the question's
// answer count.
export async function createAnswer(
  input: CreateAnswerInput,
): Promise<ActionResponse<Serialized<IAnswerDoc>>> {
  try {
    const { params, session } = await action({
      params: input,
      schema: AnswerServerSchema,
      authorize: true,
    });
    const { questionId, content } = params;

    const userId = session.user?.id;
    if (!userId) throw new UnauthorizedError();

    const { connection } = await dbConnect();

    // The answer and the count are saved together or not at all.
    // connection.transaction() also retries on temporary errors, so
    // everything inside must be safe to run again.
    const answer = await connection.transaction(async (dbSession) => {
      // $inc runs in the database in one step, so answers posted at the
      // same moment all count. timestamps: false keeps updatedAt for real
      // edits of the question.
      const question = await Question.findByIdAndUpdate(
        questionId,
        { $inc: { answers: 1 } },
        { session: dbSession, timestamps: false, projection: { _id: 1 } },
      );
      if (!question) throw new NotFoundError("Question");

      const [created] = await Answer.create(
        [{ author: userId, question: questionId, content }],
        { session: dbSession },
      );
      return created;
    });

    // Shows the new answer count (and later the answer) on the page
    revalidatePath(ROUTES.QUESTION(questionId));

    return {
      success: true,
      status: 201,
      // A plain object for the browser: ObjectIds and Dates become strings
      data: JSON.parse(
        JSON.stringify(answer.toObject()),
      ) as Serialized<IAnswerDoc>,
    };
  } catch (error) {
    return handleError(error);
  }
}

// One page of a question's answers, newest first unless a filter says
// otherwise. Public: no sign-in needed. An unknown question just has no
// answers; the page checks the question itself.
export async function getAnswers(
  input: GetAnswersInput,
): Promise<ActionResponse<{ answers: AnswerData[]; isNext: boolean }>> {
  try {
    // Use the parsed params: they have the defaults and the pageSize cap
    const { params } = await action({
      params: input,
      schema: GetAnswersSchema,
    });
    const { questionId, page, pageSize, filter = "latest" } = params;

    // One extra: if it comes back, there's a next page. Cheaper than
    // counting, and the question already stores its answer count.
    const docs = await Answer.find({ question: questionId })
      .sort(SORTS[filter])
      .skip((page - 1) * pageSize)
      .limit(pageSize + 1)
      .populate({ path: "author", select: "name image" })
      .lean<ListedAnswer[]>();

    const isNext = docs.length > pageSize;

    // Only the fields the page shows, as plain strings
    const answers = docs
      .slice(0, pageSize)
      .map(({ _id, author, content, upvotes, downvotes, createdAt }) => ({
        _id: _id.toString(),
        author: author && {
          _id: author._id.toString(),
          name: author.name,
          image: author.image,
        },
        content,
        upvotes,
        downvotes,
        createdAt: createdAt.toISOString(),
      }));

    return { success: true, status: 200, data: { answers, isNext } };
  } catch (error) {
    return handleError(error);
  }
}
