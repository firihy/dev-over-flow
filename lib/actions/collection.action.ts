"use server";

// Server actions: every export here can be called from the browser with a
// POST, so each one validates its own input.

import { revalidatePath } from "next/cache";
import type { z } from "zod";

import { auth } from "@/auth";
import ROUTES from "@/constants/routes";
import Collection from "@/database/collection.model";
import Question from "@/database/question.model";
import action from "@/lib/handlers/action";
import handleError, { isDuplicateKeyError } from "@/lib/handlers/error";
import { NotFoundError, UnauthorizedError } from "@/lib/http-errors";
import { CollectionBaseSchema } from "@/lib/validations";
import type { ActionResponse } from "@/types";

export type CollectionBaseInput = z.input<typeof CollectionBaseSchema>;

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
