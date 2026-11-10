import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import QuestionForm from "@/components/forms/QuestionForm";
import ROUTES from "@/constants/routes";
import { getQuestion } from "@/lib/actions/question.action";

const EditQuestion = async ({ params }: PageProps<"/questions/[id]/edit">) => {
  const { id } = await params;

  // Same as /ask-question: the page check is for the user, editQuestion
  // checks the session and the author again
  const session = await auth();
  if (!session) redirect(ROUTES.SIGN_IN);

  const result = await getQuestion({ questionId: id });
  if (!result.success) {
    // A bad id (400) or a deleted question (404) is "not found"; anything
    // else (e.g. the database is down) goes to the error page
    if (result.status === 400 || result.status === 404) notFound();
    throw new Error(result.error.message);
  }
  const question = result.data;

  // Only the author may edit; everyone else just sees the question
  if (question.author !== session.user?.id) {
    redirect(ROUTES.QUESTION(id));
  }

  return (
    <>
      <h1 className="h1-bold text-dark100_light900">Edit Question</h1>
      <div className="mt-9">
        <QuestionForm question={question} />
      </div>
    </>
  );
};

export default EditQuestion;
