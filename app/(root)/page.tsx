import Link from "next/link";

import { Button } from "@/components/ui/button";
import ROUTES from "@/constants/routes";

// TODO: Replace placeholders with LocalSearch, HomeFilter and QuestionCard
const questions = ["1", "2", "3", "4"];

const Home = () => {
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

      <section className="text-dark400_light700 mt-11">LocalSearch</section>

      <section className="text-dark400_light700 mt-6">HomeFilter</section>

      <section className="mt-11 flex w-full flex-col gap-6">
        {questions.map((id) => (
          <p key={id} className="text-dark400_light700">
            Question Card {id}
          </p>
        ))}
      </section>
    </>
  );
};

export default Home;
