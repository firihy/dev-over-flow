"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import LocalSearch from "@/components/search/LocalSearch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Country, DEFAULT_COUNTRY } from "@/constants/countries";
import { formUrlQuery, removeKeysFromUrlQuery, withoutPage } from "@/lib/url";

interface JobFilterProps {
  countries: Country[];
}

// The search box and country dropdown above the job list. Both keep their
// value in the URL (?query=react&country=EG); the server page reads it.
const JobFilter = ({ countries }: JobFilterProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read from the URL on every render so Back/Forward and links stay in sync
  const urlCountry = searchParams.get("country")?.toUpperCase() ?? "";
  const activeCountry = countries.some(({ code }) => code === urlCountry)
    ? urlCountry
    : DEFAULT_COUNTRY;

  const handleChange = (value: string) => {
    // Other jobs: the old cursor means nothing for them
    const params = withoutPage(searchParams);
    const newUrl =
      value === DEFAULT_COUNTRY
        ? removeKeysFromUrlQuery({
            pathname,
            params,
            keysToRemove: ["country"],
          })
        : formUrlQuery({ pathname, params, key: "country", value });

    router.push(newUrl, { scroll: false });
  };

  return (
    <>
      <LocalSearch
        imgSrc="/icons/job-search.svg"
        placeholder="Job title, company or keywords"
        label="Search jobs"
      />

      <Select value={activeCountry} onValueChange={handleChange}>
        <SelectTrigger
          aria-label="Country"
          className="body-regular light-border background-light800_dark300 text-dark500_light700 min-h-14 w-full gap-3 border p-4 sm:max-w-52.5"
        >
          <Image
            src="/icons/carbon-location.svg"
            alt=""
            width={18}
            height={18}
          />
          <div className="line-clamp-1 flex-1 text-left">
            <SelectValue />
          </div>
        </SelectTrigger>

        <SelectContent position="popper" className="max-h-87.5">
          <SelectGroup>
            {countries.map(({ code, name }) => (
              <SelectItem key={code} value={code}>
                {name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  );
};

export default JobFilter;
