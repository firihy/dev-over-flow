"use client";

import {
  CircleHelp,
  LoaderCircle,
  MessageSquareText,
  Search,
  Tag,
  User,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GLOBAL_SEARCH_TYPES,
  type GlobalSearchType,
} from "@/constants/filters";
import ROUTES from "@/constants/routes";
import { globalSearch } from "@/lib/actions/general.action";
import { cn } from "@/lib/utils";
import { MIN_GLOBAL_SEARCH_LENGTH } from "@/lib/validations";
import type { ActionResponse, GlobalSearchResult } from "@/types";

const DEBOUNCE_MS = 300;

const TYPE_ICONS = {
  question: CircleHelp,
  answer: MessageSquareText,
  user: User,
  tag: Tag,
} as const;

const getHref = ({ type, id }: GlobalSearchResult) => {
  switch (type) {
    case "user":
      return ROUTES.PROFILE_DETAILS(id);
    case "tag":
      return ROUTES.TAG(id);
    default:
      return ROUTES.QUESTION(id);
  }
};

// The search box in the navbar: finds questions, answers, users and tags
// as you type, in a panel under the box. Its state lives here, not in the
// URL, so searching never reloads the page you are on. On phones the box
// opens from a search button.
const GlobalSearch = () => {
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  // What the query was when typing paused: the search uses this
  const [pausedQuery, setPausedQuery] = useState("");
  const [type, setType] = useState<GlobalSearchType | "">("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // The answer and the search it belongs to. Comparing the key tells
  // whether it is the answer to the current search or an older one.
  const [response, setResponse] = useState<{
    key: string;
    result: ActionResponse<GlobalSearchResult[]>;
  } | null>(null);

  const trimmedQuery = query.trim();
  const canSearch = pausedQuery.length >= MIN_GLOBAL_SEARCH_LENGTH;
  const searchKey = `${type}|${pausedQuery}`;
  const current = response?.key === searchKey ? response.result : null;
  const isLoading =
    trimmedQuery.length >= MIN_GLOBAL_SEARCH_LENGTH &&
    (trimmedQuery !== pausedQuery || !current);

  useEffect(() => {
    const timeoutId = setTimeout(
      () => setPausedQuery(query.trim()),
      DEBOUNCE_MS,
    );
    return () => clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    if (!canSearch) return;

    // If the search changes before this one answers, its answer is dropped
    let ignore = false;
    globalSearch({ query: pausedQuery, type: type || undefined })
      .then((result) => {
        if (!ignore) setResponse({ key: searchKey, result });
      })
      .catch(() => {
        if (!ignore) {
          setResponse({
            key: searchKey,
            result: {
              success: false,
              status: 500,
              error: { message: "The search failed. Try again." },
            },
          });
        }
      });

    return () => {
      ignore = true;
    };
  }, [canSearch, pausedQuery, type, searchKey]);

  // A click outside the box, or Escape, closes the panel
  useEffect(() => {
    const close = () => {
      setIsOpen(false);
      setIsMobileOpen(false);
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) close();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const showPanel = isOpen && trimmedQuery.length > 0;

  const handleNavigate = () => {
    setIsOpen(false);
    setIsMobileOpen(false);
    setQuery("");
  };

  return (
    <div
      ref={containerRef}
      className="max-lg:ml-auto lg:relative lg:w-full lg:max-w-150"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        className="lg:hidden"
        aria-expanded={isMobileOpen}
        onClick={() => setIsMobileOpen((open) => !open)}
      >
        <Search className="text-dark400_light700 size-6" aria-hidden="true" />
        <span className="sr-only">Search</span>
      </Button>

      <div
        className={cn(
          "lg:relative lg:block",
          isMobileOpen
            ? "background-light900_dark200 fixed inset-x-0 top-full block px-6 pb-4 shadow-md dark:shadow-none"
            : "max-lg:hidden",
        )}
      >
        <div className="background-light800_darkgradient focus-within:ring-primary-500/50 relative flex min-h-14 grow items-center gap-1 rounded-xl px-4 focus-within:ring-2">
          <Search
            className="text-dark400_light700 size-6 shrink-0"
            aria-hidden="true"
          />

          <Input
            type="search"
            name="global-search"
            autoComplete="off"
            aria-label="Search questions, answers, users and tags"
            aria-expanded={showPanel}
            aria-controls={panelId}
            placeholder="Search anything globally..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="paragraph-regular no-focus placeholder text-dark400_light700 border-none bg-transparent shadow-none outline-none dark:bg-transparent"
          />
        </div>

        {showPanel && (
          <div
            id={panelId}
            className="bg-light-800 dark:bg-dark-400 z-10 mt-3 w-full rounded-xl py-5 shadow-sm max-lg:max-h-[70vh] max-lg:overflow-y-auto lg:absolute lg:top-full"
          >
            <div className="flex flex-wrap items-center gap-3 px-5">
              <p className="text-dark400_light900 body-medium">Type:</p>
              {GLOBAL_SEARCH_TYPES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={type === item.value}
                  onClick={() => setType(type === item.value ? "" : item.value)}
                  className={cn(
                    "light-border-2 small-medium rounded-2xl px-4 py-1.5 capitalize",
                    type === item.value
                      ? "bg-primary-500 text-light-900"
                      : "bg-light-700 text-dark-400 hover:text-primary-500 dark:bg-dark-500 dark:text-light-800 dark:hover:text-primary-500",
                  )}
                >
                  {item.name}
                </button>
              ))}
            </div>

            <div className="bg-light-700/50 dark:bg-dark-500/50 my-5 h-px" />

            <div aria-live="polite" className="space-y-5">
              <p className="text-dark400_light900 paragraph-semibold px-5">
                Top Match
              </p>

              <SearchResults
                tooShort={trimmedQuery.length < MIN_GLOBAL_SEARCH_LENGTH}
                isLoading={isLoading}
                result={current}
                onNavigate={handleNavigate}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface SearchResultsProps {
  tooShort: boolean;
  isLoading: boolean;
  result: ActionResponse<GlobalSearchResult[]> | null;
  onNavigate: () => void;
}

const SearchResults = ({
  tooShort,
  isLoading,
  result,
  onNavigate,
}: SearchResultsProps) => {
  if (tooShort) {
    return (
      <p className="text-dark200_light800 body-regular px-5">
        Type at least {MIN_GLOBAL_SEARCH_LENGTH} characters.
      </p>
    );
  }

  if (isLoading || !result) {
    return (
      <div className="flex-center flex-col px-5">
        <LoaderCircle
          className="text-primary-500 my-2 size-10 animate-spin"
          aria-hidden="true"
        />
        <p className="text-dark200_light800 body-regular">
          Browsing the whole database...
        </p>
      </div>
    );
  }

  if (!result.success) {
    return (
      <p className="text-dark200_light800 body-regular px-5">
        {result.error.message}
      </p>
    );
  }

  if (result.data.length === 0) {
    return (
      <div className="flex-center flex-col px-5">
        <p className="text-5xl" aria-hidden="true">
          🫣
        </p>
        <p className="text-dark200_light800 body-regular px-5 py-2.5">
          Oops, no results found
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {result.data.map((item) => {
        const Icon = TYPE_ICONS[item.type];
        return (
          <li key={`${item.type}-${item.id}`}>
            <Link
              href={getHref(item)}
              onClick={onNavigate}
              className="hover:bg-light-700/50 dark:hover:bg-dark-500/50 flex w-full items-start gap-3 px-5 py-2.5"
            >
              <Icon
                className="text-primary-500 mt-1 size-4.5 shrink-0"
                aria-hidden="true"
              />
              <div className="flex min-w-0 flex-col">
                <p className="body-medium text-dark200_light800 line-clamp-1">
                  {item.title}
                </p>
                <p className="text-light400_light500 small-medium mt-1 font-bold capitalize">
                  {item.type}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default GlobalSearch;
