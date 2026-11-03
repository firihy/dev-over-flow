import { type Model, model, models, Schema } from "mongoose";

export interface ITag {
  name: string;
  questions: number;
}

// What a saved tag looks like: `timestamps` adds these two fields
export interface ITagDoc extends ITag {
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema = new Schema<ITag>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    // How many questions use this tag
    questions: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Reuse the model on dev reloads (see user.model.ts)
const Tag =
  (models.Tag as Model<ITag> | undefined) ?? model<ITag>("Tag", TagSchema);

export default Tag;
