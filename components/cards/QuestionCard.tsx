import Link from "next/link";

import TagCard from "@/components/cards/TagCard";
import Metric from "@/components/Metric";
import ROUTES from "@/constants/routes";
import { getTimeStamp } from "@/lib/utils";
import type { Question } from "@/types";

interface QuestionCardProps {
  question: Question;
}

const DEFAULT_AVATAR = "/icons/avatar.svg";

const QuestionCard = ({
  question: { _id, title, tags, author, createdAt, upvotes, answers, views },
}: QuestionCardProps) => {
  const timeStamp = (
    <time dateTime={createdAt.toISOString()}>{getTimeStamp(createdAt)}</time>
  );

  return (
    <article className="card-wrapper rounded-[10px] p-9 sm:px-11">
      <div className="flex flex-col-reverse items-start justify-between gap-5 sm:flex-row">
        <div>
          {/* On desktop the time sits on the author line instead */}
          <span className="subtle-regular text-dark400_light700 line-clamp-1 flex sm:hidden">
            {timeStamp}
          </span>

          <Link href={ROUTES.QUESTION(_id)}>
            <h2 className="sm:h3-semibold base-semibold text-dark200_light900 line-clamp-1 flex-1">
              {title}
            </h2>
          </Link>
        </div>
      </div>

      <div className="mt-3.5 flex w-full flex-wrap gap-2">
        {tags.map((tag) => (
          <TagCard key={tag._id} _id={tag._id} name={tag.name} compact />
        ))}
      </div>

      <div className="flex-between mt-6 w-full flex-wrap gap-3">
        <Metric
          imgUrl={author.image ?? DEFAULT_AVATAR}
          // The default avatar is white, so invert it in light mode
          imgStyles={author.image ? "object-cover" : "invert-colors"}
          value={author.name}
          title={<>• asked {timeStamp}</>}
          href={ROUTES.PROFILE_DETAILS(author._id)}
          textStyles="body-medium text-dark400_light700"
          isAuthor
        />

        <div className="flex items-center gap-3 max-sm:flex-wrap max-sm:justify-start">
          <Metric
            imgUrl="/icons/like.svg"
            value={upvotes}
            title="Votes"
            textStyles="small-medium text-dark400_light800"
          />
          <Metric
            imgUrl="/icons/message.svg"
            value={answers}
            title="Answers"
            textStyles="small-medium text-dark400_light800"
          />
          <Metric
            imgUrl="/icons/eye.svg"
            value={views}
            title="Views"
            textStyles="small-medium text-dark400_light800"
          />
        </div>
      </div>
    </article>
  );
};

export default QuestionCard;
