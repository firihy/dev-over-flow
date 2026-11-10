"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { STATE_BUTTON_CLASS } from "@/constants/states";

// Runs the page's server code again for the same URL, so the search and
// filters are kept (a link to "/" would drop them)
const RetryButton = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => router.refresh())}
      className={STATE_BUTTON_CLASS}
    >
      {isPending ? "Retrying..." : "Retry"}
    </Button>
  );
};

export default RetryButton;
