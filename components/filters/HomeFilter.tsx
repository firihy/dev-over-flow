"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { HOME_FILTERS } from "@/constants/filters";
import { formUrlQuery, removeKeysFromUrlQuery } from "@/lib/url";
import { cn } from "@/lib/utils";

const HomeFilter = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Read from the URL on every render so Back/Forward and links stay in sync
  const activeFilter = searchParams.get("filter") ?? "";

  const handleFilterClick = (value: string) => {
    const params = searchParams.toString();
    const newUrl =
      value === activeFilter
        ? removeKeysFromUrlQuery({ pathname, params, keysToRemove: ["filter"] })
        : formUrlQuery({ pathname, params, key: "filter", value });

    router.push(newUrl, { scroll: false });
  };

  return (
    // TODO: Add a dropdown filter for mobile
    <div className="mt-10 hidden flex-wrap gap-3 sm:flex">
      {HOME_FILTERS.map(({ name, value }) => {
        const isActive = activeFilter === value;

        return (
          <Button
            key={value}
            type="button"
            aria-pressed={isActive}
            onClick={() => handleFilterClick(value)}
            className={cn(
              "body-medium h-auto rounded-lg px-6 py-3 capitalize shadow-none",
              isActive
                ? "bg-primary-100 text-primary-500 hover:bg-primary-100 dark:bg-dark-400 dark:text-primary-500 dark:hover:bg-dark-400"
                : "bg-light-800 text-light-500 hover:bg-light-800 dark:bg-dark-300 dark:text-light-500 dark:hover:bg-dark-300",
            )}
          >
            {name}
          </Button>
        );
      })}
    </div>
  );
};

export default HomeFilter;
