import Link from "next/link";

import UserAvatar from "@/components/UserAvatar";
import ROUTES from "@/constants/routes";
import type { UserListItem } from "@/types";

// A user as a card on /community: picture, name and @username. The whole
// card is one link to the profile, so keyboard users tab once per user.
const UserCard = ({ _id, name, image, username }: UserListItem) => (
  <Link
    href={ROUTES.PROFILE_DETAILS(_id)}
    className="shadow-light100_darknone focus-visible:ring-primary-500 block h-full rounded-2xl outline-none focus-visible:ring-2"
  >
    <article className="background-light900_dark200 light-border flex h-full w-full flex-col items-center justify-center rounded-2xl border p-8 xs:w-57.5">
      <UserAvatar
        id={_id}
        name={name}
        imageUrl={image}
        linkToProfile={false}
        className="size-25"
        fallbackClassName="text-3xl tracking-widest"
      />

      <div className="mt-4 w-full text-center">
        <h2 className="h3-bold text-dark200_light900 line-clamp-1">{name}</h2>
        <p className="body-regular text-dark500_light500 mt-2 truncate">
          @{username}
        </p>
      </div>
    </article>
  </Link>
);

export default UserCard;
