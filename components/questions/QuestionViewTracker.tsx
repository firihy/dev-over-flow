"use client";

import { useEffect, useRef } from "react";

import { incrementViews } from "@/lib/actions/question.action";

// Counts one view for a question when its page opens. Renders nothing.
//
// It counts once per question per browser tab: refreshing doesn't add
// another view, and React's dev-only double effect doesn't count twice.
const QuestionViewTracker = ({ questionId }: { questionId: string }) => {
  // Backup guard for when sessionStorage is blocked (e.g. some private modes)
  const countedId = useRef<string | null>(null);

  useEffect(() => {
    if (countedId.current === questionId) return;
    countedId.current = questionId;

    const key = `viewed:${questionId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // No storage: the ref above still stops double counting
    }

    incrementViews({ questionId }).then((result) => {
      // A missed view isn't worth bothering the reader about
      if (!result.success) {
        console.error("Couldn't count the view:", result.error.message);
      }
    });
  }, [questionId]);

  return null;
};

export default QuestionViewTracker;
