import { type Model, model, models, Schema, Types } from "mongoose";

import type { SavedDoc } from "@/database/types";

export const VOTE_TARGETS = ["question", "answer"] as const;
export type VoteTarget = (typeof VOTE_TARGETS)[number];

export const VOTE_TYPES = ["upvote", "downvote"] as const;
export type VoteType = (typeof VOTE_TYPES)[number];

export interface IVote {
  author: Types.ObjectId;
  // The question or answer being voted on. Not called `id`: Mongoose
  // already uses `doc.id` for the document's own _id.
  actionId: Types.ObjectId;
  actionTarget: VoteTarget;
  voteType: VoteType;
}

// What a saved document looks like (see types.ts)
export interface IVoteDoc extends IVote, SavedDoc {}

const VoteSchema = new Schema<IVote>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actionId: { type: Schema.Types.ObjectId, required: true },
    actionTarget: { type: String, enum: VOTE_TARGETS, required: true },
    voteType: { type: String, enum: VOTE_TYPES, required: true },
  },
  { timestamps: true },
);

// One vote per user per item. Changing a vote updates this document
// instead of adding another, so double-clicks can't inflate the counts.
// Starts with `author`, so it also speeds up "this user's votes".
VoteSchema.index({ author: 1, actionId: 1, actionTarget: 1 }, { unique: true });

// Reuse the model on dev reloads (see user.model.ts)
const Vote =
  (models.Vote as Model<IVote> | undefined) ?? model<IVote>("Vote", VoteSchema);

export default Vote;
