"use server";

// Server actions: every export here can be called from the browser with a
// POST, so each one validates its own input. Helpers that must not be
// callable that way (like changing a count) are kept unexported.

import type { ClientSession, Types } from "mongoose";
import { revalidatePath } from "next/cache";
import type { z } from "zod";

import { auth } from "@/auth";
import ROUTES from "@/constants/routes";
import type { VoteTarget, VoteType } from "@/constants/votes";
import Answer from "@/database/answer.model";
import Question from "@/database/question.model";
import Vote from "@/database/vote.model";
import action from "@/lib/handlers/action";
import handleError from "@/lib/handlers/error";
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/http-errors";
import { changeReputation, recordInteraction } from "@/lib/interactions";
import dbConnect from "@/lib/mongoose";
import { type ReputationChange, voteChanges } from "@/lib/reputation";
import { CreateVoteSchema, GetUserVotesSchema } from "@/lib/validations";
import type { ActionResponse, VoteResult } from "@/types";

export type CreateVoteInput = z.input<typeof CreateVoteSchema>;
export type GetUserVotesInput = z.input<typeof GetUserVotesSchema>;

const COUNT_FIELD = {
  upvote: "upvotes",
  downvote: "downvotes",
} as const satisfies Record<VoteType, string>;

const TARGET_NAME = {
  question: "Question",
  answer: "Answer",
} as const satisfies Record<VoteTarget, string>;

// Who wrote the voted item, and which question page shows it
const findTarget = async (
  targetType: VoteTarget,
  targetId: string,
  session: ClientSession,
): Promise<{ author: Types.ObjectId; questionId: string } | null> => {
  if (targetType === "question") {
    const question = await Question.findById(targetId, { author: 1 })
      .session(session)
      .lean();
    return question && { author: question.author, questionId: targetId };
  }

  const answer = await Answer.findById(targetId, { author: 1, question: 1 })
    .session(session)
    .lean();
  return (
    answer && { author: answer.author, questionId: answer.question.toString() }
  );
};

// Adds to or takes from the item's vote counts. Not exported: as a server
// action, anyone could call it to change any count.
const updateVoteCounts = async (
  targetType: VoteTarget,
  targetId: string,
  change: Partial<Record<"upvotes" | "downvotes", 1 | -1>>,
  session: ClientSession,
) => {
  // $inc runs in the database in one step, so votes cast at the same
  // moment all count. timestamps: false keeps updatedAt for real edits.
  const options = {
    session,
    timestamps: false,
    returnDocument: "after",
    projection: { upvotes: 1, downvotes: 1 },
  } as const;
  const update = { $inc: change };

  const updated =
    targetType === "question"
      ? await Question.findByIdAndUpdate(targetId, update, options).lean()
      : await Answer.findByIdAndUpdate(targetId, update, options).lean();
  if (!updated) throw new NotFoundError(TARGET_NAME[targetType]);

  return { upvotes: updated.upvotes, downvotes: updated.downvotes };
};

// Votes on a question or answer for the signed-in user:
// - no vote yet -> adds it
// - same way again -> removes it
// - the other way -> switches it
// Returns the new counts and the user's vote, so the buttons can show
// exactly what was saved.
export async function createVote(
  input: CreateVoteInput,
): Promise<ActionResponse<VoteResult>> {
  try {
    const { params, session } = await action({
      params: input,
      schema: CreateVoteSchema,
      authorize: true,
    });
    const { targetId, targetType, voteType } = params;

    const userId = session.user?.id;
    if (!userId) throw new UnauthorizedError();

    const { connection } = await dbConnect();

    // The vote and the counts are saved together or not at all.
    // connection.transaction() also retries on temporary errors (like two
    // clicks at once), so everything inside must be safe to run again.
    const { questionId, ...result } = await connection.transaction(
      async (dbSession) => {
        const target = await findTarget(targetType, targetId, dbSession);
        if (!target) throw new NotFoundError(TARGET_NAME[targetType]);

        if (target.author?.toString() === userId) {
          throw new ForbiddenError(`You can't vote on your own ${targetType}.`);
        }

        const filter = {
          author: userId,
          actionId: targetId,
          actionTarget: targetType,
        };
        const existing = await Vote.findOne(filter, { voteType: 1 })
          .session(dbSession)
          .lean();

        let userVote: VoteType | null;
        let change: Partial<Record<"upvotes" | "downvotes", 1 | -1>>;
        // Reputation moves with the vote: a new vote earns it, removing the
        // vote takes it back, so voting on and off can't farm points
        const authorId = target.author?.toString();
        const reputation: ReputationChange[] = [];
        const points = (type: VoteType, sign: 1 | -1) => {
          if (authorId)
            reputation.push(...voteChanges(type, sign, userId, authorId));
        };

        if (!existing) {
          await Vote.create([{ ...filter, voteType }], { session: dbSession });
          userVote = voteType;
          change = { [COUNT_FIELD[voteType]]: 1 };
          points(voteType, 1);
        } else if (existing.voteType === voteType) {
          await Vote.deleteOne({ _id: existing._id }, { session: dbSession });
          userVote = null;
          change = { [COUNT_FIELD[voteType]]: -1 };
          points(voteType, -1);
        } else {
          await Vote.updateOne(
            { _id: existing._id },
            { voteType },
            { session: dbSession },
          );
          userVote = voteType;
          // The old way loses one, the new way gains one
          change = {
            [COUNT_FIELD[existing.voteType]]: -1,
            [COUNT_FIELD[voteType]]: 1,
          };
          points(existing.voteType, -1);
          points(voteType, 1);
        }

        await changeReputation(reputation, dbSession);
        // A vote that is taken back isn't something the user did
        if (userVote) {
          await recordInteraction(
            { userId, action: userVote, target: targetType, targetId },
            dbSession,
          );
        }

        const counts = await updateVoteCounts(
          targetType,
          targetId,
          change,
          dbSession,
        );
        return { questionId: target.questionId, ...counts, userVote };
      },
    );

    // The question page shows the counts (an answer's are on its question)
    revalidatePath(ROUTES.QUESTION(questionId));

    return { success: true, status: 200, data: result };
  } catch (error) {
    return handleError(error);
  }
}

// The signed-in user's votes on the given questions and answers, as
// { [id]: "upvote" | "downvote" }. Items without a vote are left out.
// One query for a whole page (the question and its answers). Signed-out
// users simply have no votes: that's not an error.
export async function getUserVotes(
  input: GetUserVotesInput,
): Promise<ActionResponse<Record<string, VoteType>>> {
  try {
    const { params } = await action({
      params: input,
      schema: GetUserVotesSchema,
    });

    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || params.targetIds.length === 0) {
      return { success: true, status: 200, data: {} };
    }

    // Uses the { author, actionId, actionTarget } index
    const votes = await Vote.find(
      { author: userId, actionId: { $in: params.targetIds } },
      { actionId: 1, voteType: 1 },
    ).lean();

    const data: Record<string, VoteType> = {};
    for (const vote of votes) data[vote.actionId.toString()] = vote.voteType;

    return { success: true, status: 200, data };
  } catch (error) {
    return handleError(error);
  }
}
