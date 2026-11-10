import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import RetryButton from "@/components/states/RetryButton";
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

interface StateSkeletonProps {
  image: { light: string; dark: string; width: number; height: number };
  title: string;
  message: ReactNode;
  action?: ReactNode;
}

// The picture, heading, message and button shared by both states
const StateSkeleton = ({
  image,
  title,
  message,
  action,
}: StateSkeletonProps) => (
  <div className="mt-16 flex w-full flex-col items-center justify-center sm:mt-36">
    {/* Decorative (alt=""): the heading below says what it shows. One
        image per theme; the other is hidden with CSS. */}
    <Image
      src={image.dark}
      alt=""
      width={image.width}
      height={image.height}
      className="hidden object-contain dark:block"
    />
    <Image
      src={image.light}
      alt=""
      width={image.width}
      height={image.height}
      className="block object-contain dark:hidden"
    />

    <h2 className="h2-bold text-dark200_light900 mt-8">{title}</h2>
    <div className="body-regular text-dark500_light700 my-3.5 max-w-md text-center">
      {message}
    </div>
    {action}
  </div>
);

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
