"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { formUrlQuery, removeKeysFromUrlQuery } from "@/lib/url";
import { cn } from "@/lib/utils";

interface PaginationProps {
  // The page shown, as the server page parsed it (1 when ?page= is
  // missing or invalid)
  page: number;
  // From the action: whether there's at least one more result after
  // this page
  isNext: boolean;
  // Added to every link, e.g. "answers-heading" so moving through a
  // question's answers doesn't jump back to the top of the question
  hash?: string;
  className?: string;
}

const linkClasses =
  "light-border-2 btn text-dark200_light800 body-medium min-h-9 border px-4 shadow-none";

// Prev / current page / Next under a list. Each one is a real link, so it
// prefetches and can be opened in a new tab. The other params (query,
// filter, pageSize) are kept.
const Pagination = ({ page, isNext, hash, className }: PaginationProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Everything fits on one page: nothing to move between
  if (page <= 1 && !isNext) return null;

  const hrefFor = (target: number) => {
    const params = searchParams.toString();
    // Page 1 has no ?page=, so it has a single URL
    const url =
      target <= 1
        ? removeKeysFromUrlQuery({ pathname, params, keysToRemove: ["page"] })
        : formUrlQuery({
            pathname,
            params,
            key: "page",
            value: String(target),
          });

    return hash ? `${url}#${hash}` : url;
  };

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "mt-10 flex w-full items-center justify-center gap-2",
        className,
      )}
    >
      {page > 1 && (
        <Button asChild variant="outline" className={linkClasses}>
          <Link href={hrefFor(page - 1)} rel="prev">
            Prev
          </Link>
        </Button>
      )}

      <p
        aria-current="page"
        className="bg-primary-500 body-semibold text-light-900 flex min-h-9 items-center rounded-md px-3.5"
      >
        <span className="sr-only">Page </span>
        {page}
      </p>

      {isNext && (
        <Button asChild variant="outline" className={linkClasses}>
          <Link href={hrefFor(page + 1)} rel="next">
            Next
          </Link>
        </Button>
      )}
    </nav>
  );
};

export default Pagination;
