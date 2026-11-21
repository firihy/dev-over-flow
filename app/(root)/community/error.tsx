"use client";

import { useEffect } from "react";

import StateSkeleton from "@/components/states/StateSkeleton";
import { Button } from "@/components/ui/button";
import { DEFAULT_ERROR, STATE_BUTTON_CLASS } from "@/constants/states";

// Catches anything that throws while /community renders. getUsers reports
// its own failures as a response, so this is the net for the unexpected.
const CommunityError = ({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StateSkeleton
      image={{
        light: "/images/light-error.png",
        dark: "/images/dark-error.png",
        width: 270,
        height: 184,
      }}
      title={DEFAULT_ERROR.title}
      message={<p>{DEFAULT_ERROR.message}</p>}
      action={
        // retry() fetches the page again; reset() would only redraw the
        // same failed result
        <Button
          type="button"
          onClick={() => retry()}
          className={STATE_BUTTON_CLASS}
        >
          Try again
        </Button>
      }
    />
  );
};

export default CommunityError;
