import { type Model, model, models, Schema, Types } from "mongoose";

export interface IAnswer {
  author: Types.ObjectId;
  question: Types.ObjectId;
  content: string;
  upvotes: number;
  downvotes: number;
}

// What a saved answer looks like: `timestamps` adds these two fields
export interface IAnswerDoc extends IAnswer {
  createdAt: Date;
  updatedAt: Date;
}

const AnswerSchema = new Schema<IAnswer>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // Speeds up the profile page ("answers by this user")
      index: true,
    },
    question: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
      // Speeds up the question page ("answers to this question")
      index: true,
    },
    content: { type: String, required: true, trim: true },
    // `min` only checks create/save; guard `$inc` decrements in the filter
    upvotes: { type: Number, default: 0, min: 0 },
    downvotes: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

// Reuse the model on dev reloads (see user.model.ts)
const Answer =
  (models.Answer as Model<IAnswer> | undefined) ??
  model<IAnswer>("Answer", AnswerSchema);

export default Answer;
