import { notFound } from "next/navigation";

import ProfileLink from "@/components/user/ProfileLink";
import UserAvatar from "@/components/UserAvatar";
import { getUser } from "@/lib/actions/user.action";

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

const Profile = async ({ params }: PageProps<"/profile/[id]">) => {
  const { id } = await params;

  const result = await getUser({ userId: id });
  if (!result.success) {
    // A bad id (400) or an unknown user (404) is "not found"; anything
    // else (e.g. the database is down) goes to the error page
    if (result.status === 400 || result.status === 404) notFound();
    throw new Error(result.error.message);
  }

  const { user } = result.data;
  const { name, username, image, bio, location, portfolio, createdAt } = user;
  const portfolioLink = portfolio ? toPortfolioLink(portfolio) : null;

  return (
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
          <p className="paragraph-regular text-dark400_light800 mt-8">{bio}</p>
        )}
      </div>
    </section>
  );
};

export default Profile;
