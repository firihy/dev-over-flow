import Link from "next/link";
import { Suspense } from "react";

import QuestionCard from "@/components/cards/QuestionCard";
import HomeFilter from "@/components/filters/HomeFilter";
import LocalSearch from "@/components/search/LocalSearch";
import { Button } from "@/components/ui/button";
import { isHomeFilter } from "@/constants/filters";
import ROUTES from "@/constants/routes";
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

  const result = await getQuestions({
    page: toPositiveInt(getFirstParam(page)),
    pageSize: pageSizeNumber && Math.min(pageSizeNumber, MAX_PAGE_SIZE),
    // Over-long searches are cut, not rejected (the schema allows 100)
    query: getFirstParam(query).trim().slice(0, 100),
    // An unknown ?filter= falls back to newest
    filter: isHomeFilter(filterValue) ? filterValue : undefined,
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

      <section className="mt-10 flex w-full flex-col gap-6">
        {!result.success ? (
          <p className="paragraph-regular text-dark400_light700">
            {result.error.message || "Couldn't load the questions."}
          </p>
        ) : result.data.questions.length > 0 ? (
          result.data.questions.map((question) => (
            <QuestionCard key={question._id} question={question} />
          ))
        ) : (
          <p className="paragraph-regular text-dark400_light700">
            No questions found.
          </p>
        )}
      </section>
    </>
  );
};

export default Home;
