import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import JobCard from "@/components/cards/JobCard";
import DataRenderer from "@/components/DataRenderer";
import JobFilter from "@/components/filters/JobFilter";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_COUNTRY,
  getCountries,
  toCountryCode,
} from "@/constants/countries";
import ROUTES from "@/constants/routes";
import { EMPTY_JOBS } from "@/constants/states";
import { fetchJobs } from "@/lib/jobs";
import { getFirstParam } from "@/lib/url";

export const metadata: Metadata = {
  title: "Jobs",
  description: "Find developer jobs from companies around the world.",
};

const Jobs = async ({ searchParams }: PageProps<"/jobs">) => {
  const { query, country, cursor } = await searchParams;
  // Over-long searches are cut, not rejected
  const searchText = getFirstParam(query).trim().slice(0, 100);
  // An unknown ?country= falls back to the default country
  const countryCode = toCountryCode(getFirstParam(country));
  // JSearch pages with a cursor it gave us, not with page numbers
  const cursorText = getFirstParam(cursor);

  const result = await fetchJobs({
    query: searchText,
    country: countryCode,
    cursor: cursorText || undefined,
  });

  // A link to this same search, at the page the cursor points to (the
  // first page when there is none)
  const hrefFor = (pageCursor?: string) => {
    const params = new URLSearchParams();
    if (searchText) params.set("query", searchText);
    if (countryCode !== DEFAULT_COUNTRY) params.set("country", countryCode);
    if (pageCursor) params.set("cursor", pageCursor);
    const queryString = params.toString();
    return queryString ? `${ROUTES.JOBS}?${queryString}` : ROUTES.JOBS;
  };
  const nextCursor = result.success ? result.data.nextCursor : undefined;

  return (
    <>
      <h1 className="h1-bold text-dark100_light900">Jobs</h1>

      <section className="mt-11 flex gap-5 max-sm:flex-col sm:items-center">
        <Suspense
          fallback={
            <div className="background-light800_darkgradient min-h-14 grow rounded-[10px]" />
          }
        >
          <JobFilter countries={getCountries()} />
        </Suspense>
      </section>

      <DataRenderer
        success={result.success}
        error={result.success ? undefined : result.error}
        data={result.success ? result.data.jobs : undefined}
        empty={EMPTY_JOBS}
        render={(jobs) => (
          <ul className="mt-12 flex flex-col gap-6">
            {jobs.map((job) => (
              <li key={job.id}>
                <JobCard job={job} />
              </li>
            ))}
          </ul>
        )}
      />

      {(cursorText || nextCursor) && (
        <nav
          aria-label="Job pages"
          className="mt-10 flex items-center justify-center gap-3"
        >
          {cursorText && (
            <Button asChild variant="outline" className="light-border-2">
              <Link href={hrefFor()}>First page</Link>
            </Button>
          )}
          {nextCursor && (
            <Button asChild className="primary-gradient text-light-900">
              <Link href={hrefFor(nextCursor)}>Next page</Link>
            </Button>
          )}
        </nav>
      )}
    </>
  );
};

export default Jobs;
