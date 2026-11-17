// What can be voted on, and how. Lives here (not in the model) so client
// code, like the Zod schemas and the vote buttons, can import it without
// bundling Mongoose.
export const VOTE_TARGETS = ["question", "answer"] as const;
export type VoteTarget = (typeof VOTE_TARGETS)[number];

export const VOTE_TYPES = ["upvote", "downvote"] as const;
export type VoteType = (typeof VOTE_TYPES)[number];
