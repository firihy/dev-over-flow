import { type Model, model, models, Schema, Types } from "mongoose";

import type { SavedDoc } from "@/database/types";

// Links one tag to one question
export interface ITagQuestion {
  tag: Types.ObjectId;
  question: Types.ObjectId;
}

// What a saved document looks like (see types.ts)
export interface ITagQuestionDoc extends ITagQuestion, SavedDoc {}

const TagQuestionSchema = new Schema<ITagQuestion>(
  {
    tag: { type: Schema.Types.ObjectId, ref: "Tag", required: true },
    question: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
      // Speeds up "tags of this question" and cleanup on question delete
      index: true,
    },
  },
  { timestamps: true },
);

// Each tag–question pair only once. Starts with `tag`, so it also speeds
// up the tag page ("questions with this tag").
TagQuestionSchema.index({ tag: 1, question: 1 }, { unique: true });

// Reuse the model on dev reloads (see user.model.ts)
const TagQuestion =
  (models.TagQuestion as Model<ITagQuestion> | undefined) ??
  model<ITagQuestion>("TagQuestion", TagQuestionSchema);

export default TagQuestion;
