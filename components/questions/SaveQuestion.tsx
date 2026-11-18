"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import ROUTES from "@/constants/routes";
import { toggleSaveQuestion } from "@/lib/actions/collection.action";
import { cn } from "@/lib/utils";

interface SaveQuestionProps {
  questionId: string;
  // Read on the server, so the star is right from the first render
  hasSaved: boolean;
  // Signed-out users see the star; a click asks them to sign in
  isSignedIn: boolean;
}

const SaveQuestion = ({
  questionId,
  hasSaved,
  isSignedIn,
}: SaveQuestionProps) => {
  const router = useRouter();
  // Shows the click right away. When the action ends, the page re-renders
  // with the saved state; if it failed, this goes back to the prop.
  const [saved, setOptimisticSaved] = useOptimistic(hasSaved);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    if (!isSignedIn) {
      toast.info("Sign in to save questions", {
        description: "Saved questions go to your collection.",
        action: {
          label: "Sign in",
          onClick: () => router.push(ROUTES.SIGN_IN),
        },
      });
      return;
    }
    // One click at a time, so each one starts from what was saved
    if (isPending) return;

    startTransition(async () => {
      setOptimisticSaved((current) => !current);

      try {
        const result = await toggleSaveQuestion({ questionId });
        if (!result.success) {
          toast.error("Couldn't update your collection", {
            description:
              result.status === 401
                ? "Your session has expired. Please sign in again."
                : result.error.message,
          });
          return;
        }
        toast.success(
          result.data.saved
            ? "Question saved to your collection"
            : "Question removed from your collection",
        );
      } catch {
        // The action couldn't be reached (offline, server down...)
        toast.error("Couldn't update your collection", {
          description: "Please check your connection and try again.",
        });
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleSave}
      aria-pressed={saved}
      aria-label={saved ? "Unsave question" : "Save question"}
      title={saved ? "Remove from collection" : "Save to collection"}
      className={cn(
        "flex-center focus-visible:ring-primary-500 cursor-pointer rounded-sm outline-none focus-visible:ring-2",
        isPending && "opacity-70",
      )}
    >
      <Image
        src={saved ? "/icons/star-filled.svg" : "/icons/star-red.svg"}
        width={18}
        height={18}
        alt=""
      />
    </button>
  );
};

export default SaveQuestion;
