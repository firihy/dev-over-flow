import { type Model, model, models, Schema, Types } from "mongoose";

export interface IQuestion {
  title: string;
  content: string;
  tags: Types.ObjectId[];
  views: number;
  upvotes: number;
  downvotes: number;
  answers: number;
  author: Types.ObjectId;
}

// What a saved question looks like: `timestamps` adds these two fields
export interface IQuestionDoc extends IQuestion {
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    // Same limits as AskQuestionSchema, so data that skips the form is
    // still checked
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 100,
    },
    content: { type: String, required: true, trim: true },
    tags: {
      type: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
      validate: {
        validator: (tags: Types.ObjectId[]) =>
          tags.length >= 1 && tags.length <= 3,
        message: "A question needs between 1 and 3 tags.",
      },
    },
    views: { type: Number, default: 0 },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    answers: { type: Number, default: 0 },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // Speeds up the profile page ("questions by this user")
      index: true,
    },
  },
  { timestamps: true },
);

// Speeds up the tag page ("questions with this tag")
QuestionSchema.index({ tags: 1 });

// Reuse the model on dev reloads (see user.model.ts)
const Question =
  (models.Question as Model<IQuestion> | undefined) ??
  model<IQuestion>("Question", QuestionSchema);

export default Question;
