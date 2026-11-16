import AnswerCard from "@/components/cards/AnswerCard";
import DataRenderer from "@/components/DataRenderer";
import { EMPTY_ANSWERS } from "@/constants/states";
import type { ActionResponse, Answer } from "@/types";

interface AllAnswersProps {
  // getAnswers' response, as it came back
  result: ActionResponse<{ answers: Answer[]; isNext: boolean }>;
  // The question's stored answer count, so no extra count query is needed
  totalAnswers: number;
}

const AllAnswers = ({ result, totalAnswers }: AllAnswersProps) => (
  <section aria-labelledby="answers-heading" className="mt-11">
    <div className="flex items-center justify-between">
      <h2 id="answers-heading" className="primary-text-gradient h3-semibold">
        {totalAnswers} {totalAnswers === 1 ? "Answer" : "Answers"}
      </h2>
      {/* TODO: Add the sort filter (ANSWER_FILTERS) once it's built */}
    </div>

    <DataRenderer
      success={result.success}
      error={result.success ? undefined : result.error}
      data={result.success ? result.data.answers : null}
      empty={EMPTY_ANSWERS}
      render={(answers) =>
        answers.map((answer) => <AnswerCard key={answer._id} {...answer} />)
      }
    />
    {/* TODO: Add pagination (result.data.isNext) once it's built */}
  </section>
);

export default AllAnswers;
