"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { formUrlQuery, removeKeysFromUrlQuery, withoutPage } from "@/lib/url";
import { cn } from "@/lib/utils";

interface LocalSearchProps {
  placeholder: string;
  label?: string;
  imgSrc?: string;
  className?: string;
}

const DEBOUNCE_MS = 300;

const LocalSearch = ({
  placeholder,
  label = "Search",
  imgSrc = "/icons/search.svg",
  className,
}: LocalSearchProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("query") ?? "";

  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [pushedQuery, setPushedQuery] = useState(urlQuery);
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);

  // Sync the input when the URL changes from outside (back/forward, links),
  // but ignore the URL catching up with a query we pushed ourselves.
  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery);
    if (urlQuery !== pushedQuery) {
      setSearchQuery(urlQuery);
      setPushedQuery(urlQuery);
    }
  }

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery === urlQuery) return;

    const timeoutId = setTimeout(() => {
      // New search, new results: start again from page 1
      const params = withoutPage(searchParams);
      const newUrl = trimmedQuery
        ? formUrlQuery({
            pathname,
            params,
            key: "query",
            value: trimmedQuery,
          })
        : removeKeysFromUrlQuery({ pathname, params, keysToRemove: ["query"] });

      setPushedQuery(trimmedQuery);
      router.replace(newUrl, { scroll: false });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, urlQuery, pathname, router, searchParams]);

  return (
    <div
      className={cn(
        "background-light800_darkgradient focus-within:ring-primary-500/50 flex min-h-14 grow items-center gap-4 rounded-[10px] px-4 focus-within:ring-2",
        className,
      )}
    >
      <Image src={imgSrc} width={24} height={24} alt="" />

      <Input
        type="search"
        name="query"
        aria-label={label}
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="paragraph-regular no-focus placeholder text-dark400_light700 border-none bg-transparent shadow-none outline-none dark:bg-transparent"
      />
    </div>
  );
};

export default LocalSearch;
