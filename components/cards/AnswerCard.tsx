import Link from "next/link";

import Preview from "@/components/editor/Preview";
import UserAvatar from "@/components/UserAvatar";
import Votes from "@/components/votes/Votes";
import ROUTES from "@/constants/routes";
import type { VoteType } from "@/constants/votes";
import { getTimeStamp } from "@/lib/utils";
import type { Answer } from "@/types";

interface AnswerCardProps extends Answer {
  // The signed-in user's vote on this answer (null: none)
  userVote: VoteType | null;
  isSignedIn: boolean;
  isAuthor: boolean;
}

const AnswerCard = ({
  _id,
  author,
  content,
  createdAt,
  upvotes,
  downvotes,
  userVote,
  isSignedIn,
  isAuthor,
}: AnswerCardProps) => {
  const answeredAt = (
    <time dateTime={createdAt}>
      <span className="max-sm:hidden"> • </span>
      answered {getTimeStamp(new Date(createdAt))}
    </time>
  );

  return (
    // The id lets a link jump to this answer (/questions/<id>#<answerId>).
    // scroll-mt keeps it from hiding under the fixed navbar.
    <article id={_id} className="light-border scroll-mt-36 border-b py-10">
      <div className="mb-5 flex flex-col-reverse justify-between gap-5 sm:flex-row sm:items-center sm:gap-2">
        {author ? (
          <div className="flex flex-1 items-start gap-1.5 sm:items-center">
            <UserAvatar
              id={author._id}
              name={author.name}
              imageUrl={author.image}
              className="size-5 max-sm:mt-0.5"
              fallbackClassName="text-[9px]"
            />
            <div className="flex flex-col sm:flex-row sm:items-center">
              <Link
                href={ROUTES.PROFILE_DETAILS(author._id)}
                className="body-semibold text-dark300_light700"
              >
                {author.name}
              </Link>
              <p className="small-regular text-light400_light500 mt-0.5 line-clamp-1 sm:ml-1">
                {answeredAt}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col sm:flex-row sm:items-center">
            <p className="body-semibold text-dark300_light700">Deleted user</p>
            <p className="small-regular text-light400_light500 mt-0.5 line-clamp-1 sm:ml-1">
              {answeredAt}
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Votes
            targetId={_id}
            targetType="answer"
            upvotes={upvotes}
            downvotes={downvotes}
            userVote={userVote}
            isSignedIn={isSignedIn}
            isAuthor={isAuthor}
          />
        </div>
      </div>

      <Preview content={content} />
    </article>
  );
};

export default AnswerCard;
