import { notFound } from "next/navigation";

import QuestionCard from "@/components/cards/QuestionCard";
import DataRenderer from "@/components/DataRenderer";
import {
  EMPTY_TAG_QUESTIONS,
  EMPTY_TAG_QUESTIONS_SEARCH,
} from "@/constants/states";
import { getTagQuestions } from "@/lib/actions/tag.action";
import { getFirstParam, toPositiveInt } from "@/lib/url";
import { MAX_PAGE_SIZE } from "@/lib/validations";

// TODO: Add the search box from the design
const TagDetails = async ({
  params,
  searchParams,
}: PageProps<"/tags/[id]">) => {
  const { id } = await params;
  const { page, pageSize, query } = await searchParams;
  const pageNumber = toPositiveInt(getFirstParam(page));
  const pageSizeNumber = toPositiveInt(getFirstParam(pageSize));
  // Over-long searches are cut, not rejected (the schema allows 100)
  const searchText = getFirstParam(query).trim().slice(0, 100);

  const result = await getTagQuestions({
    tagId: id,
    page: pageNumber,
    pageSize: pageSizeNumber && Math.min(pageSizeNumber, MAX_PAGE_SIZE),
    query: searchText,
  });

  // A malformed ID (400) or a deleted tag (404): there's no such page.
  // Other failures (the database is down) show the error state with Retry.
  if (!result.success && [400, 404].includes(result.status)) notFound();

  const isNarrowed = Boolean(searchText || (pageNumber ?? 1) > 1);

  return (
    <>
      <h1 className="h1-bold text-dark100_light900">
        {result.success ? result.data.tag.name : "Tag"}
      </h1>

      <DataRenderer
        success={result.success}
        error={result.success ? undefined : result.error}
        data={result.success ? result.data.questions : undefined}
        empty={isNarrowed ? EMPTY_TAG_QUESTIONS_SEARCH : EMPTY_TAG_QUESTIONS}
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

export default TagDetails;
