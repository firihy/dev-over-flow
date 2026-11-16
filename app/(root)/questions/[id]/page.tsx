import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import TagCard from "@/components/cards/TagCard";
import Preview from "@/components/editor/Preview";
import AnswerForm from "@/components/forms/AnswerForm";
import Metric from "@/components/Metric";
import QuestionViewTracker from "@/components/questions/QuestionViewTracker";
import UserAvatar from "@/components/UserAvatar";
import ROUTES from "@/constants/routes";
import { getQuestion } from "@/lib/actions/question.action";
import { formatNumber, getTimeStamp } from "@/lib/utils";

const QuestionDetails = async ({ params }: PageProps<"/questions/[id]">) => {
  const { id } = await params;

  const [result, session] = await Promise.all([
    getQuestion({ questionId: id }),
    auth(),
  ]);
  if (!result.success) {
    // A bad id (400) or a deleted question (404) is "not found"; anything
    // else (e.g. the database is down) goes to the error page
    if (result.status === 400 || result.status === 404) notFound();
    throw new Error(result.error.message);
  }
  const { title, content, tags, author, createdAt, answers, views } =
    result.data;

  return (
    <>
      <QuestionViewTracker questionId={id} />

      <div className="flex w-full items-center justify-between gap-4">
        {author ? (
          <div className="flex items-center gap-1.5">
            <UserAvatar
              id={author._id}
              name={author.name}
              imageUrl={author.image}
              className="size-5.5"
              fallbackClassName="text-[10px]"
            />
            <Link
              href={ROUTES.PROFILE_DETAILS(author._id)}
              className="paragraph-semibold text-dark300_light700"
            >
              {author.name}
            </Link>
          </div>
        ) : (
          <p className="paragraph-semibold text-dark300_light700">
            Deleted user
          </p>
        )}

        {/* TODO: Add voting once votes are built */}
      </div>

      <h1 className="h2-semibold text-dark200_light900 mt-3.5 w-full">
        {title}
      </h1>

      <div className="mt-5 mb-8 flex flex-wrap gap-4">
        <Metric
          imgUrl="/icons/clock.svg"
          value={
            <time dateTime={createdAt}>
              asked {getTimeStamp(new Date(createdAt))}
            </time>
          }
          textStyles="small-regular text-dark400_light700"
        />
        <Metric
          imgUrl="/icons/message.svg"
          value={formatNumber(answers)}
          title={answers === 1 ? "Answer" : "Answers"}
          textStyles="small-regular text-dark400_light700"
        />
        <Metric
          imgUrl="/icons/eye.svg"
          value={formatNumber(views)}
          title={views === 1 ? "View" : "Views"}
          textStyles="small-regular text-dark400_light700"
        />
      </div>

      <Preview content={content} />

      <div className="mt-8 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <TagCard key={tag._id} _id={tag._id} name={tag.name} compact />
        ))}
      </div>

      <div className="my-5">
        {/* Only signed-in users can answer, so don't let anyone else type a
            long answer they can't post */}
        {session ? (
          <AnswerForm />
        ) : (
          <p className="paragraph-regular text-dark400_light800">
            <Link
              href={ROUTES.SIGN_IN}
              className="text-primary-500 font-semibold"
            >
              Sign in
            </Link>{" "}
            to answer this question.
          </p>
        )}
      </div>
    </>
  );
};

export default QuestionDetails;
