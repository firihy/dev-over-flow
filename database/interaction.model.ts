import { type Model, model, models, Schema, Types } from "mongoose";

export const INTERACTION_ACTIONS = [
  "view",
  "upvote",
  "downvote",
  "bookmark",
  "post",
  "edit",
  "delete",
  "search",
] as const;
export type InteractionAction = (typeof INTERACTION_ACTIONS)[number];

export const INTERACTION_TARGETS = ["question", "answer"] as const;
export type InteractionTarget = (typeof INTERACTION_TARGETS)[number];

// A log of what users do, used later for recommendations
export interface IInteraction {
  user: Types.ObjectId;
  action: InteractionAction;
  actionId: Types.ObjectId;
  actionTarget: InteractionTarget;
}

// What a saved interaction looks like: `timestamps` adds these two fields
export interface IInteractionDoc extends IInteraction {
  createdAt: Date;
  updatedAt: Date;
}

const InteractionSchema = new Schema<IInteraction>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // Speeds up "this user's activity" when building recommendations
      index: true,
    },
    // Only known actions, so a typo like "veiw" is rejected, not stored
    action: { type: String, enum: INTERACTION_ACTIONS, required: true },
    actionId: { type: Schema.Types.ObjectId, required: true },
    actionTarget: { type: String, enum: INTERACTION_TARGETS, required: true },
  },
  { timestamps: true },
);

// Reuse the model on dev reloads (see user.model.ts)
const Interaction =
  (models.Interaction as Model<IInteraction> | undefined) ??
  model<IInteraction>("Interaction", InteractionSchema);

export default Interaction;
