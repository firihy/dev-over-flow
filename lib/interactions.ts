// Not "use server": these helpers write to the database with ids the caller
// gives them, so they must never be callable from the browser. server-only
// keeps them on the server (see lib/handlers/action.ts).
import "server-only";

import type { ClientSession, Types } from "mongoose";

import Interaction, {
  type InteractionAction,
  type InteractionTarget,
} from "@/database/interaction.model";
import User from "@/database/user.model";
import type { ReputationChange } from "@/lib/reputation";

interface InteractionEvent {
  userId: string;
  action: InteractionAction;
  target: InteractionTarget;
  targetId: string;
}

const toDocument = ({
  userId,
  action,
  target,
  targetId,
}: InteractionEvent) => ({
  user: userId,
  action,
  actionTarget: target,
  actionId: targetId,
});

// Adds a line to the activity log. Pass the transaction's session so the
// line is saved (or dropped) together with the action it describes.
export const recordInteraction = async (
  event: InteractionEvent,
  session: ClientSession,
) => {
  await Interaction.create([toDocument(event)], { session });
};

// Removes the log lines about deleted questions or answers, so nothing in
// the log points at something that no longer exists.
export const deleteInteractionsOf = async (
  target: InteractionTarget,
  ids: Types.ObjectId[],
  session: ClientSession,
) => {
  await Interaction.deleteMany(
    { actionId: { $in: ids }, actionTarget: target },
    { session },
  );
};

// Logs something the user did at most once per item, like viewing or saving
// a question: doing it again changes nothing. Used for recommendations,
// where "seen it twice" says no more than "seen it".
export const recordInteractionOnce = async (event: InteractionEvent) => {
  // The filter's values become the new line's fields, so the update has
  // nothing of its own to set (Mongoose adds the timestamps)
  await Interaction.updateOne(toDocument(event), {}, { upsert: true });
};

// Adds the points to each user's reputation (negative points take away).
// $inc runs in the database in one step, so changes made at the same moment
// all count. timestamps: false keeps updatedAt for real profile edits.
export const changeReputation = async (
  changes: ReputationChange[],
  session: ClientSession,
) => {
  const real = changes.filter(({ points }) => points !== 0);
  if (real.length === 0) return;

  await User.bulkWrite(
    real.map(({ userId, points }) => ({
      updateOne: {
        filter: { _id: userId },
        update: { $inc: { reputation: points } },
      },
    })),
    { session, timestamps: false },
  );
};
