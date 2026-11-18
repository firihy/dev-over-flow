import { Suspense } from "react";

import AnswerCard from "@/components/cards/AnswerCard";
import DataRenderer from "@/components/DataRenderer";
import CommonFilter from "@/components/filters/CommonFilter";
import Pagination from "@/components/Pagination";
import { ANSWER_FILTERS } from "@/constants/filters";
import { EMPTY_ANSWERS, EMPTY_ANSWERS_PAGE } from "@/constants/states";
import type { VoteType } from "@/constants/votes";
import type { ActionResponse, Answer } from "@/types";

interface AllAnswersProps {
  // getAnswers' response, as it came back
  result: ActionResponse<{ answers: Answer[]; isNext: boolean }>;
  // The page of answers shown (1 when ?page= is missing or invalid)
  page: number;
  // The question's stored answer count, so no extra count query is needed
  totalAnswers: number;
  // The signed-in user (undefined when signed out) and their votes on
  // these answers, by answer id
  userId?: string;
  userVotes: Record<string, VoteType>;
}

const AllAnswers = ({
  result,
  page,
  totalAnswers,
  userId,
  userVotes,
}: AllAnswersProps) => (
  <section aria-labelledby="answers-heading" className="mt-11">
    <div className="flex flex-wrap items-center justify-between gap-4">
      {/* Pagination links land here (#answers-heading); scroll-mt keeps it
          from hiding under the fixed navbar, as AnswerCard does */}
      <h2
        id="answers-heading"
        className="primary-text-gradient h3-semibold scroll-mt-36"
      >
        {totalAnswers} {totalAnswers === 1 ? "Answer" : "Answers"}
      </h2>
      {/* Sorting needs at least two answers */}
      {totalAnswers > 1 && (
        <Suspense fallback={<div className="min-h-10 min-w-36" />}>
          <CommonFilter
            filters={ANSWER_FILTERS}
            label="Sort answers"
            triggerClassName="min-h-10 min-w-36"
          />
        </Suspense>
      )}
    </div>

    <DataRenderer
      success={result.success}
      error={result.success ? undefined : result.error}
      data={result.success ? result.data.answers : null}
      empty={page > 1 ? EMPTY_ANSWERS_PAGE : EMPTY_ANSWERS}
      render={(answers) =>
        answers.map((answer) => (
          <AnswerCard
            key={answer._id}
            {...answer}
            userVote={userVotes[answer._id] ?? null}
            isSignedIn={!!userId}
            isAuthor={!!userId && answer.author?._id === userId}
          />
        ))
      }
    />

    {result.success && (
      <Suspense>
        <Pagination
          page={page}
          isNext={result.data.isNext}
          hash="answers-heading"
        />
      </Suspense>
    )}
  </section>
);

export default AllAnswers;
