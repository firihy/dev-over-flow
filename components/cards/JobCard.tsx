import Image from "next/image";

import { Button } from "@/components/ui/button";
import { getCountries } from "@/constants/countries";
import { toPlainText } from "@/lib/utils";
import type { Job } from "@/types";

const countryNames = new Map(getCountries().map((c) => [c.code, c.name]));

// "EG" -> the flag emoji, built from two regional-indicator letters. No
// image to load.
const toFlag = (code: string) =>
  String.fromCodePoint(
    ...[...code.toUpperCase()].map((char) => 0x1f1a5 + char.charCodeAt(0)),
  );

const JobLocation = ({ job }: { job: Job }) => {
  const { city, state, country } = job;
  const place = [city, state, country && countryNames.get(country)]
    .filter(Boolean)
    .join(", ");
  if (!place) return null;

  return (
    <div className="background-light800_dark400 flex items-center gap-2 rounded-2xl px-3 py-1.5">
      {country && (
        <span aria-hidden="true" className="text-base leading-none">
          {toFlag(country)}
        </span>
      )}
      <p className="body-medium text-dark400_light700">{place}</p>
    </div>
  );
};

// One job in the list on /jobs. Everything but the title may be missing.
const JobCard = ({ job }: { job: Job }) => {
  const {
    title,
    employer,
    logo,
    applyLink,
    description,
    employmentType,
    salary,
  } = job;

  return (
    <article className="background-light900_dark200 light-border shadow-light100_darknone flex flex-col items-start gap-6 rounded-lg border p-6 sm:flex-row sm:p-8">
      {logo ? (
        // A plain <img>: logos come from any employer's host, and the image
        // optimizer only fetches hosts listed in next.config.ts
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt=""
          width={64}
          height={64}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="background-light800_dark400 size-16 shrink-0 rounded-xl object-contain p-2"
        />
      ) : (
        <Image
          src="/images/site-logo.svg"
          alt=""
          width={64}
          height={64}
          className="background-light800_dark400 shrink-0 rounded-xl p-3"
        />
      )}

      <div className="w-full min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="base-semibold text-dark200_light900">{title}</h2>
            {employer && (
              <p className="body-regular text-dark500_light700 mt-1">
                {employer}
              </p>
            )}
          </div>

          <JobLocation job={job} />
        </div>

        {description && (
          <p className="body-regular text-dark500_light700 mt-4 line-clamp-2">
            {toPlainText(description, 240)}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-6">
            {employmentType && (
              <div className="flex items-center gap-2">
                <Image src="/icons/clock-2.svg" alt="" width={20} height={20} />
                <p className="body-medium text-light-500">{employmentType}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Image
                src="/icons/currency-dollar-circle.svg"
                alt=""
                width={20}
                height={20}
              />
              <p className="body-medium text-light-500">
                {salary ?? "Not disclosed"}
              </p>
            </div>
          </div>

          {applyLink && (
            <Button asChild variant="link" className="h-auto gap-2 p-0">
              <a href={applyLink} target="_blank" rel="noopener noreferrer">
                <span className="body-semibold primary-text-gradient">
                  View job
                </span>
                <Image
                  src="/icons/arrow-up-right.svg"
                  alt=""
                  width={20}
                  height={20}
                />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
};

export default JobCard;
