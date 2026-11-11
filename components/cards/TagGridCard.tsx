import Link from "next/link";

import ROUTES from "@/constants/routes";
import { cn, getDeviconClassName, getTechDescription } from "@/lib/utils";
import type { TagListItem } from "@/types";

// A tag as a card on /tags: name, icon, a line about it and how many
// questions use it. For a tag as a small badge, use TagCard.
const TagGridCard = ({ _id, name, questions }: TagListItem) => (
  <Link
    href={ROUTES.TAG(_id)}
    className="shadow-light100_darknone block h-full rounded-2xl"
  >
    <article className="background-light900_dark200 light-border flex h-full w-full flex-col rounded-2xl border px-8 py-10 sm:w-65">
      <div className="flex items-center justify-between gap-3">
        <h2 className="paragraph-semibold text-dark300_light900 background-light800_dark400 w-fit truncate rounded-sm px-5 py-1.5">
          {name}
        </h2>
        <i className={cn(getDeviconClassName(name), "text-2xl")} aria-hidden />
      </div>

      <p className="small-regular text-dark500_light700 mt-5 line-clamp-3 w-full">
        {getTechDescription(name)}
      </p>

      <p className="small-medium text-dark400_light500 mt-3.5">
        <span className="body-semibold primary-text-gradient mr-2.5">
          {questions}
        </span>
        {questions === 1 ? "Question" : "Questions"}
      </p>
    </article>
  </Link>
);

export default TagGridCard;
