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
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    image: { type: String },
    password: { type: String },
    provider: { type: String, required: true },
    providerAccountId: { type: String, required: true },
  },
  { timestamps: true },
);

// Reuse the model on dev reloads (see user.model.ts)
const Account =
  (models.Account as Model<IAccount> | undefined) ??
  model<IAccount>("Account", AccountSchema);

export default Account;
