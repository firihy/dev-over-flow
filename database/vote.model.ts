import { type Model, model, models, Schema, Types } from "mongoose";

export const VOTE_TARGETS = ["question", "answer"] as const;
export type VoteTarget = (typeof VOTE_TARGETS)[number];

export const VOTE_TYPES = ["upvote", "downvote"] as const;
export type VoteType = (typeof VOTE_TYPES)[number];

export interface IVote {
  author: Types.ObjectId;
  // The question or answer being voted on. Not called `id`: Mongoose
  // already uses `doc.id` for the document's own _id.
  actionId: Types.ObjectId;
  actionType: VoteTarget;
  voteType: VoteType;
}

// What a saved vote looks like: `timestamps` adds these two fields
export interface IVoteDoc extends IVote {
  createdAt: Date;
  updatedAt: Date;
}

const VoteSchema = new Schema<IVote>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actionId: { type: Schema.Types.ObjectId, required: true },
    actionType: { type: String, enum: VOTE_TARGETS, required: true },
    voteType: { type: String, enum: VOTE_TYPES, required: true },
  },
  { timestamps: true },
);

// Reuse the model on dev reloads (see user.model.ts)
const Vote =
  (models.Vote as Model<IVote> | undefined) ?? model<IVote>("Vote", VoteSchema);

export default Vote;
