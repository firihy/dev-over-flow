import { type Model, model, models, Schema, Types } from "mongoose";

// A log of what users do, used later for recommendations
export interface IInteraction {
  user: Types.ObjectId;
  action: string;
  actionId: Types.ObjectId;
  actionType: "question" | "answer";
}

// What a saved interaction looks like: `timestamps` adds these two fields
export interface IInteractionDoc extends IInteraction {
  createdAt: Date;
  updatedAt: Date;
}

const InteractionSchema = new Schema<IInteraction>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    actionId: { type: Schema.Types.ObjectId, required: true },
    actionType: { type: String, enum: ["question", "answer"], required: true },
  },
  { timestamps: true },
);

// Reuse the model on dev reloads (see user.model.ts)
const Interaction =
  (models.Interaction as Model<IInteraction> | undefined) ??
  model<IInteraction>("Interaction", InteractionSchema);

export default Interaction;
