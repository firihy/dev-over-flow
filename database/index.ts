// Importing this file registers every model with Mongoose. populate()
// looks models up by name ("User", "Tag"), so a model must be registered
// even in files that never import it directly. lib/mongoose.ts imports
// this, so every database call has all models available.
import Account from "@/database/account.model";
import Answer from "@/database/answer.model";
import Collection from "@/database/collection.model";
import Interaction from "@/database/interaction.model";
import Question from "@/database/question.model";
import TagQuestion from "@/database/tag-question.model";
import Tag from "@/database/tag.model";
import User from "@/database/user.model";
import Vote from "@/database/vote.model";

export {
  Account,
  Answer,
  Collection,
  Interaction,
  Question,
  Tag,
  TagQuestion,
  User,
  Vote,
};
