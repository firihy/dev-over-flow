import { type Model, model, models, Schema, Types } from "mongoose";

export interface IVote {
  author: Types.ObjectId;
  id: Types.ObjectId;
  type: "question" | "answer";
  voteType: "upvote" | "downvote";
}

// What a saved vote looks like: `timestamps` adds these two fields
export interface IVoteDoc extends IVote {
  createdAt: Date;
  updatedAt: Date;
}

const VoteSchema = new Schema<IVote>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    id: { type: Schema.Types.ObjectId, required: true },
    type: { type: String, enum: ["question", "answer"], required: true },
    voteType: { type: String, enum: ["upvote", "downvote"], required: true },
  },
  { timestamps: true },
);

// Reuse the model on dev reloads (see user.model.ts)
const Vote =
  (models.Vote as Model<IVote> | undefined) ?? model<IVote>("Vote", VoteSchema);

export default Vote;
