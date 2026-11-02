import Link from "next/link";
import { Suspense } from "react";

import LocalSearch from "@/components/search/LocalSearch";
import { Button } from "@/components/ui/button";
import ROUTES from "@/constants/routes";
import { getFirstParam } from "@/lib/url";

// TODO: Replace with real questions once they are stored
const questions = [
  {
    _id: "1",
    title: "How to learn React?",
    description: "I want to learn React, can anyone help me?",
    tags: [
      { _id: "1", name: "React" },
      { _id: "2", name: "JavaScript" },
    ],
    author: { _id: "1", name: "John Doe" },
    upvotes: 10,
    answers: 5,
    views: 100,
    createdAt: new Date("2026-10-01"),
  },
  {
    _id: "2",
    title: "How to learn JavaScript?",
    description: "I want to learn JavaScript, can anyone help me?",
    tags: [
      { _id: "1", name: "React" },
      { _id: "2", name: "JavaScript" },
    ],
    author: { _id: "1", name: "John Doe" },
    upvotes: 10,
    answers: 5,
    views: 100,
    createdAt: new Date("2026-10-15"),
  },
];

const SEARCH_PLACEHOLDER = "Search questions...";

const Home = async ({ searchParams }: PageProps<"/">) => {
  const { query } = await searchParams;
  const normalizedQuery = getFirstParam(query).trim().toLowerCase();

  const filteredQuestions = questions.filter((question) =>
    question.title.toLowerCase().includes(normalizedQuery),
  );

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

      {/* TODO: Replace with HomeFilter */}
      <section className="text-dark400_light700 mt-6">HomeFilter</section>

      <section className="mt-10 flex w-full flex-col gap-6">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((question) => (
            // TODO: Replace with QuestionCard
            <h2
              key={question._id}
              className="h3-semibold text-dark200_light900"
            >
              {question.title}
            </h2>
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
