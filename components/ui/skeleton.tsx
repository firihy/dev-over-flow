import { cn } from "cn";

// A pulsing grey block that holds the place of content that is loading.
// Hidden from screen readers: the page announces loading through its own
// status text, and these blocks carry no content.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      data-slot="skeleton"
      className={cn(
        "background-light800_dark400 animate-pulse rounded-md",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
