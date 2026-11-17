"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import ROUTES from "@/constants/routes";
import type { VoteTarget, VoteType } from "@/constants/votes";
import { createVote } from "@/lib/actions/vote.action";
import { cn, formatNumber } from "@/lib/utils";
import type { VoteResult } from "@/types";

interface VotesProps extends VoteResult {
  targetId: string;
  targetType: VoteTarget;
  // Signed-out users see the counts; a click asks them to sign in
  isSignedIn: boolean;
  // Nobody can vote on their own question or answer
  isAuthor: boolean;
}

// What a click changes, the same way createVote does: the same vote again
// removes it, the other one switches it
const applyVote = (state: VoteResult, voteType: VoteType): VoteResult => {
  const next = { ...state };
  if (state.userVote === "upvote") next.upvotes -= 1;
  if (state.userVote === "downvote") next.downvotes -= 1;

  if (state.userVote === voteType) {
    next.userVote = null;
  } else {
    next.userVote = voteType;
    if (voteType === "upvote") next.upvotes += 1;
    else next.downvotes += 1;
  }
  return next;
};

const Votes = ({
  targetId,
  targetType,
  upvotes,
  downvotes,
  userVote,
  isSignedIn,
  isAuthor,
}: VotesProps) => {
  const router = useRouter();
  // Shows the click right away. When the action ends, the page re-renders
  // with the saved counts; if it failed, this goes back to the props.
  const [votes, setOptimisticVotes] = useOptimistic<VoteResult>({
    upvotes,
    downvotes,
    userVote,
  });
  const [isPending, startTransition] = useTransition();

  const handleVote = (voteType: VoteType) => {
    if (!isSignedIn) {
      toast.info("Sign in to vote", {
        description: "Only signed-in users can vote.",
        action: {
          label: "Sign in",
          onClick: () => router.push(ROUTES.SIGN_IN),
        },
      });
      return;
    }
    // One vote at a time, so each click starts from what was saved
    if (isPending) return;

    startTransition(async () => {
      setOptimisticVotes((current) => applyVote(current, voteType));

      try {
        const result = await createVote({ targetId, targetType, voteType });
        if (!result.success) {
          toast.error("Couldn't save your vote", {
            description:
              result.status === 401
                ? "Your session has expired. Please sign in again."
                : result.error.message,
          });
        }
      } catch {
        // The action couldn't be reached (offline, server down...)
        toast.error("Couldn't save your vote", {
          description: "Please check your connection and try again.",
        });
      }
    });
  };

  const buttons = [
    { type: "upvote", label: "Upvote", count: votes.upvotes },
    { type: "downvote", label: "Downvote", count: votes.downvotes },
  ] as const;

  return (
    <div
      role="group"
      aria-label={`Votes on this ${targetType}`}
      className="flex-center gap-2.5"
    >
      {buttons.map(({ type, label, count }) => {
        const isActive = votes.userVote === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => handleVote(type)}
            disabled={isAuthor}
            aria-pressed={isActive}
            title={
              isAuthor ? `You can't vote on your own ${targetType}` : label
            }
            className={cn(
              "flex-center focus-visible:ring-primary-500 gap-1.5 rounded-sm outline-none focus-visible:ring-2",
              isAuthor ? "cursor-not-allowed opacity-60" : "cursor-pointer",
              isPending && "opacity-70",
            )}
          >
            <Image
              src={`/icons/${type}${isActive ? "d" : ""}.svg`}
              width={18}
              height={18}
              alt=""
            />
            <span className="sr-only">{label}</span>
            <span className="flex-center background-light700_dark400 subtle-medium text-dark400_light900 min-w-5 rounded-sm p-1">
              {formatNumber(count)}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default Votes;
