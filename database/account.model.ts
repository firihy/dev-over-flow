import { type Model, model, models, Schema, Types } from "mongoose";

export interface IAccount {
  userId: Types.ObjectId;
  name: string;
  image?: string;
  password?: string;
  provider: string;
  providerAccountId: string;
}

// What a saved account looks like: `timestamps` adds these two fields
export interface IAccountDoc extends IAccount {
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // Speeds up "find all accounts of this user"
      index: true,
    },
    name: { type: String, required: true },
    image: { type: String },
    // Hidden from queries by default so the hash never leaks by accident.
    // Read it with `.select("+password")` when checking a login.
    password: { type: String, select: false },
    provider: { type: String, required: true },
    providerAccountId: { type: String, required: true },
  },
  { timestamps: true },
);

// One login identity = one account. Stops a double-click or two tabs from
// creating the same GitHub/Google account twice.
AccountSchema.index({ provider: 1, providerAccountId: 1 }, { unique: true });

// Reuse the model on dev reloads (see user.model.ts)
const Account =
  (models.Account as Model<IAccount> | undefined) ??
  model<IAccount>("Account", AccountSchema);

export default Account;
