import type { Types } from "mongoose";

// Fields every saved document gets on top of its own: MongoDB adds _id,
// and `timestamps: true` adds createdAt and updatedAt. Each model's IXDoc
// extends this.
//
// It describes the data only, on purpose (not `extends Document`): these
// types are mostly used for results passed around as plain objects, which
// don't have .save() and the other document methods. Documents from
// Model.find() are already fully typed by the model itself.
export interface SavedDoc {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
