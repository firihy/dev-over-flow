"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ROUTES from "@/constants/routes";
import { deleteAnswer } from "@/lib/actions/answer.action";
import { deleteQuestion } from "@/lib/actions/question.action";
import { cn } from "@/lib/utils";

interface EditDeleteActionProps {
  type: "question" | "answer";
  itemId: string;
  className?: string;
}

// Shown only to the author. Answers are edited on their question's page
// (not built yet), so they only get the delete button. The actions check
// the author again: hiding the buttons isn't the protection.
const EditDeleteAction = ({
  type,
  itemId,
  className,
}: EditDeleteActionProps) => {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (event: React.MouseEvent) => {
    // Keep the dialog open until the delete is done
    event.preventDefault();
    if (isPending) return;

    startTransition(async () => {
      try {
        const result =
          type === "question"
            ? await deleteQuestion({ questionId: itemId })
            : await deleteAnswer({ answerId: itemId });

        if (!result.success) {
          toast.error(`Couldn't delete your ${type}`, {
            description:
              result.status === 401
                ? "Your session has expired. Please sign in again."
                : result.error.message,
          });
          return;
        }
        // The action refreshed the page, so the card goes away
        setOpen(false);
        toast.success(
          type === "question" ? "Question deleted" : "Answer deleted",
        );
      } catch {
        // The action couldn't be reached (offline, server down...)
        toast.error(`Couldn't delete your ${type}`, {
          description: "Please check your connection and try again.",
        });
      }
    });
  };

  return (
    <div className={cn("flex shrink-0 items-center gap-3", className)}>
      {type === "question" && (
        <Link
          href={ROUTES.EDIT_QUESTION(itemId)}
          aria-label="Edit question"
          title="Edit"
          className="flex-center focus-visible:ring-primary-500 rounded-sm outline-none focus-visible:ring-2"
        >
          <Image src="/icons/edit.svg" alt="" width={14} height={14} />
        </Link>
      )}

      <AlertDialog
        open={open}
        // Can't be closed while the delete runs
        onOpenChange={(next) => !isPending && setOpen(next)}
      >
        <AlertDialogTrigger
          aria-label={`Delete ${type}`}
          title="Delete"
          className="flex-center focus-visible:ring-primary-500 cursor-pointer rounded-sm outline-none focus-visible:ring-2"
        >
          <Image src="/icons/trash.svg" alt="" width={14} height={14} />
        </AlertDialogTrigger>
        <AlertDialogContent className="background-light800_dark300 text-dark100_light900">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {type}?</AlertDialogTitle>
            <AlertDialogDescription className="text-dark400_light700">
              {type === "question"
                ? "Its answers, votes and saved copies are deleted too. This can't be undone."
                : "Its votes are deleted too. This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EditDeleteAction;
