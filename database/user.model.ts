import { type Model, model, models, Schema } from "mongoose";

import type { SavedDoc } from "@/database/types";

export interface IUser {
  name: string;
  username: string;
  email: string;
  bio?: string;
  // Optional: email/password sign-ups have no avatar
  image?: string;
  location?: string;
  portfolio?: string;
  reputation?: number;
}

// What a saved document looks like (see types.ts)
export interface IUserDoc extends IUser, SavedDoc {}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    // Unique because profile URLs are built from it
    username: { type: String, required: true, unique: true, trim: true },
    // Stored lowercase so "John@Mail.com" and "john@mail.com" are one account
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    bio: { type: String },
    image: { type: String },
    location: { type: String },
    portfolio: { type: String },
    reputation: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// In dev, Next re-runs this file on every save. Registering "User" twice
// throws OverwriteModelError, so reuse the model if it already exists.
const User =
  (models.User as Model<IUser> | undefined) ?? model<IUser>("User", UserSchema);

export default User;
