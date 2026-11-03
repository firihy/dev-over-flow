import { type Model, model, models, Schema, Types } from "mongoose";

// A question a user has saved
export interface ICollection {
  author: Types.ObjectId;
  question: Types.ObjectId;
}

// What a saved entry looks like: `timestamps` adds these two fields
export interface ICollectionDoc extends ICollection {
  createdAt: Date;
  updatedAt: Date;
}

const CollectionSchema = new Schema<ICollection>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: Schema.Types.ObjectId, ref: "Question", required: true },
  },
  { timestamps: true },
);

// Reuse the model on dev reloads (see user.model.ts)
const Collection =
  (models.Collection as Model<ICollection> | undefined) ??
  model<ICollection>("Collection", CollectionSchema);

export default Collection;
