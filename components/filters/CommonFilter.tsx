"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formUrlQuery, removeKeysFromUrlQuery, withoutPage } from "@/lib/url";
import { cn } from "@/lib/utils";

interface CommonFilterProps {
  // A list's sort options from constants/filters.ts. The first one is the
  // list's default sort.
  filters: readonly { name: string; value: string }[];
  // Read by screen readers, e.g. "Sort tags"
  label: string;
  className?: string;
  triggerClassName?: string;
}

// A sort dropdown that keeps the choice in the URL (?filter=popular). The
// server page reads it and sorts the list.
const CommonFilter = ({
  filters,
  label,
  className,
  triggerClassName,
}: CommonFilterProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read from the URL on every render so Back/Forward and links stay in
  // sync. No filter, or one this list doesn't know, means the server uses
  // the default sort, so show that.
  const defaultValue = filters[0]?.value ?? "";
  const urlFilter = searchParams.get("filter") ?? "";
  const activeFilter = filters.some(({ value }) => value === urlFilter)
    ? urlFilter
    : defaultValue;

  const handleChange = (value: string) => {
    // A new sort shows a different first page: start again from page 1
    const params = withoutPage(searchParams);
    // The default sort needs no ?filter= in the URL
    const newUrl =
      value === defaultValue
        ? removeKeysFromUrlQuery({ pathname, params, keysToRemove: ["filter"] })
        : formUrlQuery({ pathname, params, key: "filter", value });

    router.push(newUrl, { scroll: false });
  };

  return (
    <div className={cn("relative", className)}>
      <Select value={activeFilter} onValueChange={handleChange}>
        <SelectTrigger
          aria-label={label}
          className={cn(
            "body-regular light-border background-light800_dark300 text-dark500_light700 w-full border px-5 py-2.5",
            triggerClassName,
          )}
        >
          <SelectValue />
        </SelectTrigger>

        <SelectContent position="popper">
          <SelectGroup>
            {filters.map(({ name, value }) => (
              <SelectItem key={value} value={value}>
                {name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default CommonFilter;
