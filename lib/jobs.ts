import "server-only";

import { z } from "zod";

import logger from "@/lib/logger";
import { toHttpUrl } from "@/lib/url";
import type { ActionResponse, Job } from "@/types";

// JSearch (RapidAPI) returns this many jobs per page
export const JOBS_PER_PAGE = 10;
const MAX_CURSOR_LENGTH = 2000;
const MAX_QUERY_LENGTH = 100;
const DEFAULT_QUERY = "Software Engineer";
// Listings change slowly and the free plan allows 200 calls a month, so an
// identical search is answered from the cache for an hour.
const CACHE_SECONDS = 60 * 60;
const TIMEOUT_MS = 10_000;

// One job as JSearch sends it. Every field except the id and title may be
// missing or null.
const text = z.string().nullish();
const RawJobSchema = z.object({
  job_id: z.string(),
  job_title: z.string().trim().min(1),
  employer_name: text,
  employer_logo: text,
  employer_website: text,
  job_apply_link: text,
  job_employment_type: text,
  job_description: text,
  job_city: text,
  job_state: text,
  job_country: text,
  job_salary_string: text,
});

const toJob = (raw: z.infer<typeof RawJobSchema>): Job => ({
  id: raw.job_id,
  title: raw.job_title,
  employer: raw.employer_name || undefined,
  logo: toHttpUrl(raw.employer_logo),
  applyLink: toHttpUrl(raw.job_apply_link),
  employerWebsite: toHttpUrl(raw.employer_website),
  employmentType: raw.job_employment_type || undefined,
  description: raw.job_description || undefined,
  city: raw.job_city || undefined,
  state: raw.job_state || undefined,
  country: raw.job_country || undefined,
  salary: raw.job_salary_string || undefined,
});

const fail = (status: number, message: string): ActionResponse<never> => ({
  success: false,
  status,
  error: { message },
});

interface FetchJobsParams {
  query?: string;
  // ISO alpha-2, already checked by the caller
  country?: string;
  // From the previous page's response (nextCursor); none for the first page
  cursor?: string;
}

// One page of job listings. JSearch pages with an opaque cursor: each
// response carries the cursor for the page after it. Not a server action: a "use server" export can
// be called from any browser, which would let anyone spend the API quota.
export async function fetchJobs({
  query,
  country,
  cursor,
}: FetchJobsParams): Promise<
  ActionResponse<{ jobs: Job[]; nextCursor?: string }>
> {
  const apiKey = process.env.RAPID_API_KEY;
  if (!apiKey) {
    logger.warn("RAPID_API_KEY is not set: the jobs page has no listings");
    return fail(503, "Job listings aren't set up on this server yet.");
  }

  const params = new URLSearchParams({
    query: query?.trim().slice(0, MAX_QUERY_LENGTH) || DEFAULT_QUERY,
    num_pages: "1",
  });
  if (country) params.set("country", country.toLowerCase());
  if (cursor && cursor.length <= MAX_CURSOR_LENGTH) {
    params.set("cursor", cursor);
  }

  try {
    const response = await fetch(
      `https://jsearch.p.rapidapi.com/search-v2?${params}`,
      {
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        next: { revalidate: CACHE_SECONDS },
      },
    );

    if (response.status === 429) {
      logger.warn("JSearch quota or rate limit reached");
      return fail(
        429,
        "The job search has reached its limit for now. Please try again later.",
      );
    }
    if (response.status === 401 || response.status === 403) {
      logger.error({ status: response.status }, "JSearch rejected the API key");
      return fail(503, "Job listings aren't set up correctly on this server.");
    }
    if (response.status >= 400 && response.status < 500) {
      // e.g. an old or made-up ?cursor=
      logger.warn({ status: response.status }, "JSearch refused the request");
      return fail(
        400,
        "That page of results isn't available. Start again from the first page.",
      );
    }
    if (!response.ok) {
      logger.error({ status: response.status }, "JSearch request failed");
      return fail(502, "The job listings service isn't answering right now.");
    }

    const body: unknown = await response.json();
    const parsedBody = z
      .object({
        data: z.object({
          jobs: z.array(z.unknown()),
          cursor: z.string().nullish(),
        }),
      })
      .safeParse(body);
    if (!parsedBody.success) {
      logger.error("JSearch sent an unexpected response");
      return fail(502, "The job listings service sent something unexpected.");
    }

    // One badly shaped job is skipped, not a reason to lose the page
    const { jobs: rawJobs, cursor: nextCursor } = parsedBody.data.data;
    const jobs = rawJobs.flatMap((item) => {
      const parsed = RawJobSchema.safeParse(item);
      return parsed.success ? [toJob(parsed.data)] : [];
    });

    return {
      success: true,
      status: 200,
      data: {
        jobs,
        // A short page is the last one, whatever cursor comes with it
        nextCursor:
          rawJobs.length >= JOBS_PER_PAGE ? nextCursor || undefined : undefined,
      },
    };
  } catch (error) {
    logger.error({ err: error }, "JSearch request threw");
    return fail(502, "The job listings service isn't answering right now.");
  }
}
