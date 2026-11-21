import Link from "next/link";
import type { ReactNode } from "react";

import RetryButton from "@/components/states/RetryButton";
import StateSkeleton from "@/components/states/StateSkeleton";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_EMPTY,
  DEFAULT_ERROR,
  type EmptyState,
  STATE_BUTTON_CLASS,
} from "@/constants/states";
import type { ErrorResponse } from "@/types";

interface DataRendererProps<T> {
  success: boolean;
  error?: ErrorResponse["error"];
  data: T[] | null | undefined;
  empty?: EmptyState;
  render: (data: T[]) => ReactNode;
}

// Shows the error state, the empty state, or render(data), in that order.
// Pass it the fields of an action's response.
const DataRenderer = <T,>({
  success,
  error,
  data,
  empty = DEFAULT_EMPTY,
  render,
}: DataRendererProps<T>) => {
  if (!success) {
    const fieldMessages = Object.values(error?.details ?? {}).flat();

    return (
      <StateSkeleton
        // Same 295 x 201 shape as the files
        image={{
          light: "/images/light-error.png",
          dark: "/images/dark-error.png",
          width: 270,
          height: 184,
        }}
        title={DEFAULT_ERROR.title}
        message={
          <>
            <p>{error?.message || DEFAULT_ERROR.message}</p>
            {fieldMessages.length > 0 && (
              <ul className="mt-2 list-inside list-disc">
                {fieldMessages.map((message, index) => (
                  // Two fields can share a message, so the index keeps keys unique
                  <li key={index}>{message}</li>
                ))}
              </ul>
            )}
          </>
        }
        action={<RetryButton />}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <StateSkeleton
        // Same 859 x 600 shape as the files
        image={{
          light: "/images/light-illustration.png",
          dark: "/images/dark-illustration.png",
          width: 270,
          height: 189,
        }}
        title={empty.title}
        message={<p>{empty.message}</p>}
        action={
          empty.button && (
            // asChild: one link styled as a button, not a button in a link
            <Button asChild className={STATE_BUTTON_CLASS}>
              <Link href={empty.button.href}>{empty.button.text}</Link>
            </Button>
          )
        }
      />
    );
  }

  return render(data);
};

export default DataRenderer;
