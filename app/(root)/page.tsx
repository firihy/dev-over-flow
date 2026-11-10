import Link from "next/link";
import { Suspense } from "react";

import QuestionCard from "@/components/cards/QuestionCard";
import HomeFilter from "@/components/filters/HomeFilter";
import LocalSearch from "@/components/search/LocalSearch";
import { Button } from "@/components/ui/button";
import ROUTES from "@/constants/routes";
import { getFirstParam } from "@/lib/url";
import type { Question } from "@/types";

// TODO: Replace with real questions once they are stored
const questions: Question[] = [
  {
    _id: "1",
    title: "How to learn React?",
    tags: [
      { _id: "1", name: "React" },
      { _id: "2", name: "JavaScript" },
    ],
    author: {
      _id: "1",
      name: "John Doe",
      image:
        "https://static.vecteezy.com/system/resources/previews/002/002/403/non_2x/man-with-beard-avatar-character-isolated-icon-free-vector.jpg",
    },
    upvotes: 10,
    answers: 5,
    views: 100,
    createdAt: "2026-10-01T00:00:00.000Z",
  },
  {
    _id: "2",
    title: "How to learn JavaScript?",
    tags: [
      { _id: "2", name: "JavaScript" },
      { _id: "3", name: "Node.js" },
    ],
    author: { _id: "2", name: "Jane Smith" },
    upvotes: 10,
    answers: 5,
    views: 100,
    createdAt: "2026-10-15T00:00:00.000Z",
  },
];

const SEARCH_PLACEHOLDER = "Search questions...";

const Home = async ({ searchParams }: PageProps<"/">) => {
  const { query, filter } = await searchParams;
  const normalizedQuery = getFirstParam(query).trim().toLowerCase();
  const normalizedFilter = getFirstParam(filter).toLowerCase();

  const filteredQuestions = questions.filter((question) => {
    const matchesQuery = question.title.toLowerCase().includes(normalizedQuery);
    const matchesFilter =
      !normalizedFilter ||
      question.tags.some((tag) => tag.name.toLowerCase() === normalizedFilter);

    return matchesQuery && matchesFilter;
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
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((question) => (
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
