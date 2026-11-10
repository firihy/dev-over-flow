import Link from "next/link";
import { Suspense } from "react";

import QuestionCard from "@/components/cards/QuestionCard";
import DataRenderer from "@/components/DataRenderer";
import HomeFilter from "@/components/filters/HomeFilter";
import LocalSearch from "@/components/search/LocalSearch";
import { Button } from "@/components/ui/button";
import { isHomeFilter } from "@/constants/filters";
import ROUTES from "@/constants/routes";
import { EMPTY_QUESTION, EMPTY_QUESTION_SEARCH } from "@/constants/states";
import { getQuestions } from "@/lib/actions/question.action";
import { getFirstParam } from "@/lib/url";
import { MAX_PAGE_SIZE } from "@/lib/validations";

// "3" -> 3. Anything else ("abc", "-1", "2.5") -> undefined, so the
// default is used instead of the page failing validation.
const toPositiveInt = (value: string) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : undefined;
};

const SEARCH_PLACEHOLDER = "Search questions...";

const Home = async ({ searchParams }: PageProps<"/">) => {
  const { page, pageSize, query, filter } = await searchParams;
  const pageSizeNumber = toPositiveInt(getFirstParam(pageSize));
  const filterValue = getFirstParam(filter);
  // Over-long searches are cut, not rejected (the schema allows 100)
  const searchText = getFirstParam(query).trim().slice(0, 100);
  // An unknown ?filter= falls back to newest
  const filterOption = isHomeFilter(filterValue) ? filterValue : undefined;

  const pageNumber = toPositiveInt(getFirstParam(page));
  // A search, a filter or a later page: other questions may exist, so
  // "the board is empty" wouldn't be true
  const isNarrowed = Boolean(
    searchText || filterOption || (pageNumber ?? 1) > 1,
  );

  const result = await getQuestions({
    page: pageNumber,
    pageSize: pageSizeNumber && Math.min(pageSizeNumber, MAX_PAGE_SIZE),
    query: searchText,
    filter: filterOption,
  });

  return (
    <>
      <section className="flex w-full flex-col-reverse justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="h1-bold text-dark100_light900">All Questions</h1>

        <Button
          asChild
          className="primary-gradient text-light-900 min-h-11.5 px-4 py-3"
        >
          <Link href={ROUTES.ASK_QUESTION}>Ask a Question</Link>
        </Button>
      </section>

      <section className="mt-11">
        <Suspense
          fallback={
            <div className="background-light800_darkgradient min-h-14 rounded-[10px]" />
          }
        >
          <LocalSearch
            placeholder={SEARCH_PLACEHOLDER}
            label="Search questions"
          />
        </Suspense>
      </section>

      <Suspense>
        <HomeFilter />
      </Suspense>

      <DataRenderer
        success={result.success}
        error={result.success ? undefined : result.error}
        data={result.success ? result.data.questions : undefined}
        empty={isNarrowed ? EMPTY_QUESTION_SEARCH : EMPTY_QUESTION}
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

export default Home;
