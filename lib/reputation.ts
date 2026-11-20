// How many reputation points each action is worth. Plain numbers and
// functions only (no database), so they're easy to read and to test.
import type { VoteTarget, VoteType } from "@/constants/votes";

// What posting earns the poster. Deleting takes the same amount back.
const POST_POINTS: Record<VoteTarget, number> = {
  question: 5,
  answer: 10,
};

// What a vote is worth to the person who votes and to the author of the
// voted item. Voting on your own post isn't allowed (see createVote), so
// there is no case where both are the same person.
const VOTE_POINTS: Record<VoteType, { voter: number; author: number }> = {
  upvote: { voter: 2, author: 10 },
  downvote: { voter: -1, author: -2 },
};

export interface ReputationChange {
  userId: string;
  points: number;
}

// Posting a question or answer. Deleting uses the opposite sign.
export const postPoints = (target: VoteTarget, sign: 1 | -1 = 1): number =>
  sign * POST_POINTS[target];

// The two changes a vote causes. sign -1 undoes it (removing a vote, or the
// old half of switching one), so a vote can't be repeated to farm points.
export const voteChanges = (
  voteType: VoteType,
  sign: 1 | -1,
  voterId: string,
  authorId: string,
): ReputationChange[] => [
  { userId: voterId, points: sign * VOTE_POINTS[voteType].voter },
  { userId: authorId, points: sign * VOTE_POINTS[voteType].author },
];
