import { type Model, model, models, Schema, Types } from "mongoose";

import type { SavedDoc } from "@/database/types";

// A question a user has saved
export interface ICollection {
  author: Types.ObjectId;
  question: Types.ObjectId;
}

// What a saved document looks like (see types.ts)
export interface ICollectionDoc extends ICollection, SavedDoc {}

const CollectionSchema = new Schema<ICollection>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: Schema.Types.ObjectId, ref: "Question", required: true },
  },
  { timestamps: true },
);

// A user can save a question only once. Starts with `author`, so it also
// speeds up the "Collections" page ("questions this user saved").
CollectionSchema.index({ author: 1, question: 1 }, { unique: true });

// Reuse the model on dev reloads (see user.model.ts)
const Collection =
  (models.Collection as Model<ICollection> | undefined) ??
  model<ICollection>("Collection", CollectionSchema);

export default Collection;
