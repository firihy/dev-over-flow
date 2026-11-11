import { Suspense } from "react";

import TagGridCard from "@/components/cards/TagGridCard";
import DataRenderer from "@/components/DataRenderer";
import LocalSearch from "@/components/search/LocalSearch";
import { isTagFilter } from "@/constants/filters";
import { EMPTY_TAGS, EMPTY_TAGS_SEARCH } from "@/constants/states";
import { getTags } from "@/lib/actions/tag.action";
import { getFirstParam, toPositiveInt } from "@/lib/url";
import { MAX_PAGE_SIZE } from "@/lib/validations";

// TODO: Add the sort buttons (?filter= already works)
const Tags = async ({ searchParams }: PageProps<"/tags">) => {
  const { page, pageSize, query, filter } = await searchParams;
  const pageNumber = toPositiveInt(getFirstParam(page));
  const pageSizeNumber = toPositiveInt(getFirstParam(pageSize));
  // Over-long searches are cut, not rejected (the schema allows 100)
  const searchText = getFirstParam(query).trim().slice(0, 100);
  const filterValue = getFirstParam(filter);

  const result = await getTags({
    page: pageNumber,
    pageSize: pageSizeNumber && Math.min(pageSizeNumber, MAX_PAGE_SIZE),
    query: searchText,
    // An unknown ?filter= falls back to popular
    filter: isTagFilter(filterValue) ? filterValue : undefined,
  });

  // A sort alone doesn't hide tags, so only a search or a later page means
  // "none match" rather than "there are no tags"
  const isNarrowed = Boolean(searchText || (pageNumber ?? 1) > 1);

  return (
    <>
      <h1 className="h1-bold text-dark100_light900">Tags</h1>

      <section className="mt-11">
        <Suspense
          fallback={
            <div className="background-light800_darkgradient min-h-14 rounded-[10px]" />
          }
        >
          <LocalSearch placeholder="Search tags..." label="Search tags" />
        </Suspense>
      </section>

      <DataRenderer
        success={result.success}
        error={result.success ? undefined : result.error}
        data={result.success ? result.data.tags : undefined}
        empty={isNarrowed ? EMPTY_TAGS_SEARCH : EMPTY_TAGS}
        render={(tags) => (
          <ul className="mt-10 flex w-full flex-wrap gap-4">
            {tags.map((tag) => (
              <li key={tag._id} className="w-full sm:w-auto">
                <TagGridCard {...tag} />
              </li>
            ))}
          </ul>
        )}
      />
    </>
  );
};

export default Tags;
