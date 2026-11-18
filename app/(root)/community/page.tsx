import { Suspense } from "react";

import UserCard from "@/components/cards/UserCard";
import DataRenderer from "@/components/DataRenderer";
import CommonFilter from "@/components/filters/CommonFilter";
import LocalSearch from "@/components/search/LocalSearch";
import { USER_FILTERS, isUserFilter } from "@/constants/filters";
import { EMPTY_USERS, EMPTY_USERS_SEARCH } from "@/constants/states";
import { getUsers } from "@/lib/actions/user.action";
import { getFirstParam, toPositiveInt } from "@/lib/url";
import { MAX_PAGE_SIZE } from "@/lib/validations";

const Community = async ({ searchParams }: PageProps<"/community">) => {
  const { page, pageSize, query, filter } = await searchParams;
  const pageNumber = toPositiveInt(getFirstParam(page));
  const pageSizeNumber = toPositiveInt(getFirstParam(pageSize));
  // Over-long searches are cut, not rejected (the schema allows 100)
  const searchText = getFirstParam(query).trim().slice(0, 100);
  const filterValue = getFirstParam(filter);

  const result = await getUsers({
    page: pageNumber,
    pageSize: pageSizeNumber && Math.min(pageSizeNumber, MAX_PAGE_SIZE),
    query: searchText,
    // An unknown ?filter= falls back to newest
    filter: isUserFilter(filterValue) ? filterValue : undefined,
  });

  // A sort alone doesn't hide users, so only a search or a later page
  // means "none match" rather than "there are no users"
  const isNarrowed = Boolean(searchText || (pageNumber ?? 1) > 1);

  return (
    <>
      <h1 className="h1-bold text-dark100_light900">All Users</h1>

      <section className="mt-11 flex gap-5 max-sm:flex-col sm:items-center">
        <Suspense
          fallback={
            <div className="background-light800_darkgradient min-h-14 grow rounded-[10px]" />
          }
        >
          <LocalSearch
            placeholder="There are some great devs here!"
            label="Search users"
          />
        </Suspense>

        <Suspense fallback={<div className="min-h-14 sm:min-w-44" />}>
          <CommonFilter
            filters={USER_FILTERS}
            label="Sort users"
            triggerClassName="min-h-14 sm:min-w-44"
          />
        </Suspense>
      </section>

      <DataRenderer
        success={result.success}
        error={result.success ? undefined : result.error}
        data={result.success ? result.data.users : undefined}
        empty={isNarrowed ? EMPTY_USERS_SEARCH : EMPTY_USERS}
        render={(users) => (
          <ul className="mt-12 flex flex-wrap gap-5">
            {users.map((user) => (
              <li key={user._id} className="w-full xs:w-auto">
                <UserCard {...user} />
              </li>
            ))}
          </ul>
        )}
      />
    </>
  );
};

export default Community;
