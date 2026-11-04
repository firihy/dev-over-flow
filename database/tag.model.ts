import { type Model, model, models, Schema } from "mongoose";

import type { SavedDoc } from "@/database/types";

export interface ITag {
  name: string;
  questions: number;
}

// What a saved document looks like (see types.ts)
export interface ITagDoc extends ITag, SavedDoc {}

const TagSchema = new Schema<ITag>(
  {
    // Uniqueness is enforced by the case-insensitive index below
    name: { type: String, required: true, trim: true },
    // How many questions use this tag
    // `min` only checks create/save; guard `$inc` decrements in the filter
    questions: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

// One tag per name, ignoring case: "React" and "react" are the same tag.
// Strength 2 compares letters but not case, and the name is still stored
// the way it was first typed. To look a tag up case-insensitively (and use
// this index), add the same `.collation({ locale: "en", strength: 2 })` to
// the query.
TagSchema.index(
  { name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } },
);

// Reuse the model on dev reloads (see user.model.ts)
const Tag =
  (models.Tag as Model<ITag> | undefined) ?? model<ITag>("Tag", TagSchema);

export default Tag;
