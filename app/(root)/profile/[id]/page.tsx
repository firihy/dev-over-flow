import { notFound } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";
import AnswerCard from "@/components/cards/AnswerCard";
import QuestionCard from "@/components/cards/QuestionCard";
import TagCard from "@/components/cards/TagCard";
import DataRenderer from "@/components/DataRenderer";
import Pagination from "@/components/Pagination";
import ProfileLink from "@/components/user/ProfileLink";
import ProfileTabs, { isProfileTab } from "@/components/user/ProfileTabs";
import Stats from "@/components/user/Stats";
import UserAvatar from "@/components/UserAvatar";
import ROUTES from "@/constants/routes";
import {
  EMPTY_USER_ANSWERS,
  EMPTY_USER_POSTS_PAGE,
  EMPTY_USER_QUESTIONS,
} from "@/constants/states";
import {
  getUser,
  getUserAnswers,
  getUserQuestions,
  getUserTopTags,
} from "@/lib/actions/user.action";
import { getUserVotes } from "@/lib/actions/vote.action";
import { getFirstParam, toPositiveInt } from "@/lib/url";
import { MAX_PAGE_SIZE } from "@/lib/validations";

const joinedFormat = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  // The same month on the server and in every visitor's timezone
  timeZone: "UTC",
});

// The portfolio as a link, if it's a real web address. Users can't save
// anything else (the API checks it), but a javascript: link would run
// code on click, so check again here. Shown as its host: "example.com".
const toPortfolioLink = (portfolio: string) => {
  try {
    const url = new URL(portfolio);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return { href: url.href, title: url.host.replace(/^www\./, "") };
  } catch {
    return null;
  }
};

const Profile = async ({
  params,
  searchParams,
}: PageProps<"/profile/[id]">) => {
  const { id } = await params;
  const { tab, page, pageSize } = await searchParams;
  // ?page= and ?pageSize= are for the open tab's list
  const tabValue = getFirstParam(tab);
  // An unknown ?tab= falls back to the first tab
  const activeTab = isProfileTab(tabValue) ? tabValue : "top-posts";
  const pageNumber = toPositiveInt(getFirstParam(page));
  const pageSizeNumber = toPositiveInt(getFirstParam(pageSize));
  const listParams = {
    userId: id,
    page: pageNumber,
    pageSize: pageSizeNumber && Math.min(pageSizeNumber, MAX_PAGE_SIZE),
  };

  // All at once, and only the open tab's list. None of them needs the
  // user: an unknown or malformed id gets notFound() below before their
  // results are used.
  const [result, questionsResult, answersResult, tagsResult, session] =
    await Promise.all([
      getUser({ userId: id }),
      activeTab === "top-posts" ? getUserQuestions(listParams) : null,
      activeTab === "answers" ? getUserAnswers(listParams) : null,
      getUserTopTags({ userId: id }),
      auth(),
    ]);
  if (!result.success) {
    // A bad id (400) or an unknown user (404) is "not found"; anything
    // else (e.g. the database is down) goes to the error page
    if (result.status === 400 || result.status === 404) notFound();
    throw new Error(result.error.message);
  }

  // The signed-in user's votes on the answers shown (one query). If it
  // fails, the arrows show no vote.
  const viewerId = session?.user?.id;
  const shownAnswers = answersResult?.success ? answersResult.data.answers : [];
  const votesResult =
    viewerId && shownAnswers.length > 0
      ? await getUserVotes({ targetIds: shownAnswers.map((a) => a._id) })
      : null;
  const userVotes = votesResult?.success ? votesResult.data : {};

  const { user, totalQuestions, totalAnswers, badges } = result.data;
  // Every post here is this user's, so on your own profile you can edit
  // and delete them (the actions check the author again)
  const isOwnProfile = viewerId === user._id;
  const { name, username, image, bio, location, portfolio, createdAt } = user;
  const portfolioLink = portfolio ? toPortfolioLink(portfolio) : null;
  const isLaterPage = (pageNumber ?? 1) > 1;

  return (
    <>
      <section className="flex flex-col items-start gap-4 lg:flex-row">
        <UserAvatar
          id={user._id}
          name={name}
          imageUrl={image}
          className="size-35"
          fallbackClassName="text-6xl font-bold"
          linkToProfile={false}
        />

        <div className="mt-3">
          <h1 className="h2-bold text-dark100_light900">{name}</h1>
          <p className="paragraph-regular text-dark200_light800">@{username}</p>

          <div className="mt-5 flex flex-wrap items-center justify-start gap-5">
            {portfolioLink && (
              <ProfileLink
                imgUrl="/icons/link.svg"
                href={portfolioLink.href}
                title={portfolioLink.title}
              />
            )}
            {location && (
              <ProfileLink imgUrl="/icons/location.svg" title={location} />
            )}
            <ProfileLink
              imgUrl="/icons/calendar.svg"
              title={`Joined ${joinedFormat.format(new Date(createdAt))}`}
            />
          </div>

          {bio && (
            <p className="paragraph-regular text-dark400_light800 mt-8">
              {bio}
            </p>
          )}
        </div>
      </section>

      <Stats
        totalQuestions={totalQuestions}
        totalAnswers={totalAnswers}
        reputation={user.reputation}
        badges={badges}
      />

      <div className="mt-10 flex gap-10">
        <section className="min-w-0 flex-2">
          <ProfileTabs userId={user._id} active={activeTab} />

          {questionsResult && (
            <>
              <DataRenderer
                success={questionsResult.success}
                error={
                  questionsResult.success ? undefined : questionsResult.error
                }
                data={
                  questionsResult.success
                    ? questionsResult.data.questions
                    : undefined
                }
                empty={
                  isLaterPage ? EMPTY_USER_POSTS_PAGE : EMPTY_USER_QUESTIONS
                }
                render={(questions) => (
                  <div className="mt-5 flex w-full flex-col gap-6">
                    {questions.map((question) => (
                      <QuestionCard
                        key={question._id}
                        question={question}
                        showActions={isOwnProfile}
                      />
                    ))}
                  </div>
                )}
              />
              {questionsResult.success && (
                <Suspense>
                  <Pagination
                    page={pageNumber ?? 1}
                    isNext={questionsResult.data.isNext}
                  />
                </Suspense>
              )}
            </>
          )}

          {answersResult && (
            <>
              <DataRenderer
                success={answersResult.success}
                error={answersResult.success ? undefined : answersResult.error}
                data={
                  answersResult.success ? answersResult.data.answers : undefined
                }
                empty={isLaterPage ? EMPTY_USER_POSTS_PAGE : EMPTY_USER_ANSWERS}
                render={(answers) => (
                  <div className="mt-5 flex w-full flex-col gap-6">
                    {answers.map((answer) => (
                      <AnswerCard
                        key={answer._id}
                        {...answer}
                        userVote={userVotes[answer._id] ?? null}
                        isSignedIn={!!viewerId}
                        isAuthor={isOwnProfile}
                        showActions={isOwnProfile}
                        // Lands on the answer if it's on the question's
                        // first page of answers, else at the question's top
                        readMoreHref={`${ROUTES.QUESTION(answer.question)}#${answer._id}`}
                        className="card-wrapper rounded-[10px] border-none px-7 py-9 sm:px-11"
                      />
                    ))}
                  </div>
                )}
              />
              {answersResult.success && (
                <Suspense>
                  <Pagination
                    page={pageNumber ?? 1}
                    isNext={answersResult.data.isNext}
                  />
                </Suspense>
              )}
            </>
          )}
        </section>

        <section className="flex w-full min-w-62.5 flex-1 flex-col max-xl:hidden">
          <h2 className="h3-bold text-dark200_light900">Top Tech</h2>
          {/* Small text instead of DataRenderer's big pictures, which
              don't fit this narrow column */}
          {!tagsResult.success ? (
            <p className="body-regular text-dark500_light700 mt-7">
              Couldn&apos;t load tags.
            </p>
          ) : tagsResult.data.length === 0 ? (
            <p className="body-regular text-dark500_light700 mt-7">
              No tags yet.
            </p>
          ) : (
            <ul className="mt-7 flex flex-col gap-4">
              {tagsResult.data.map((tag) => (
                <li key={tag._id}>
                  <TagCard
                    _id={tag._id}
                    name={tag.name}
                    questions={tag.questions}
                    showCount
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
};

export default Profile;
