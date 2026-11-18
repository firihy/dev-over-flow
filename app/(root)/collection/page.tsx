import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";
import QuestionCard from "@/components/cards/QuestionCard";
import DataRenderer from "@/components/DataRenderer";
import CommonFilter from "@/components/filters/CommonFilter";
import LocalSearch from "@/components/search/LocalSearch";
import { COLLECTION_FILTERS, isCollectionFilter } from "@/constants/filters";
import ROUTES from "@/constants/routes";
import { EMPTY_COLLECTION, EMPTY_COLLECTION_SEARCH } from "@/constants/states";
import { getSavedQuestions } from "@/lib/actions/collection.action";
import { getFirstParam, toPositiveInt } from "@/lib/url";
import { MAX_PAGE_SIZE } from "@/lib/validations";

// The signed-in user's saved questions
const Collection = async ({ searchParams }: PageProps<"/collection">) => {
  // Signed-out users have no collection: check before loading anything
  const session = await auth();
  if (!session?.user) redirect(ROUTES.SIGN_IN);

  const { page, pageSize, query, filter } = await searchParams;
  const pageNumber = toPositiveInt(getFirstParam(page));
  const pageSizeNumber = toPositiveInt(getFirstParam(pageSize));
  // Over-long searches are cut, not rejected (the schema allows 100)
  const searchText = getFirstParam(query).trim().slice(0, 100);
  const filterValue = getFirstParam(filter);

  const result = await getSavedQuestions({
    page: pageNumber,
    pageSize: pageSizeNumber && Math.min(pageSizeNumber, MAX_PAGE_SIZE),
    query: searchText,
    // An unknown ?filter= falls back to most recent
    filter: isCollectionFilter(filterValue) ? filterValue : undefined,
  });

  // A sort alone doesn't hide questions, so only a search or a later page
  // means "none match" rather than "nothing saved yet"
  const isNarrowed = Boolean(searchText || (pageNumber ?? 1) > 1);

  return (
    <>
      <h1 className="h1-bold text-dark100_light900">Saved Questions</h1>

      <section className="mt-11 flex gap-5 max-sm:flex-col sm:items-center">
        <Suspense
          fallback={
            <div className="background-light800_darkgradient min-h-14 grow rounded-[10px]" />
          }
        >
          <LocalSearch
            placeholder="Search your saved questions..."
            label="Search saved questions"
          />
        </Suspense>

        <Suspense fallback={<div className="min-h-14 sm:min-w-44" />}>
          <CommonFilter
            filters={COLLECTION_FILTERS}
            label="Sort saved questions"
            triggerClassName="min-h-14 sm:min-w-44"
          />
        </Suspense>
      </section>

      <DataRenderer
        success={result.success}
        error={result.success ? undefined : result.error}
        data={result.success ? result.data.questions : undefined}
        empty={isNarrowed ? EMPTY_COLLECTION_SEARCH : EMPTY_COLLECTION}
        render={(questions) => (
          <section className="mt-10 flex w-full flex-col gap-6">
            {questions.map((question) => (
              <QuestionCard key={question._id} question={question} />
            ))}
          </section>
        )}
      />
    </>
  );
};

export default Collection;
