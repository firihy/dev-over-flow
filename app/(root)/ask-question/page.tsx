import { redirect } from "next/navigation";

import { auth } from "@/auth";
import QuestionForm from "@/components/forms/QuestionForm";
import ROUTES from "@/constants/routes";

const AskQuestion = async () => {
  // Only signed-in users can post. redirect() stops rendering here.
  // createQuestion checks the session again: a page check alone doesn't
  // protect the action.
  const session = await auth();
  if (!session) redirect(ROUTES.SIGN_IN);

  return (
    <>
      <h1 className="h1-bold text-dark100_light900">Ask a Question</h1>

      <div className="mt-9">
        <QuestionForm />
      </div>
    </>
  );
};

export default AskQuestion;
