import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ROUTES from "@/constants/routes";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  id: string;
  // Optional: the session doesn't always have a name
  name?: string | null;
  imageUrl?: string | null;
  className?: string;
  // e.g. smaller initials in a small avatar
  fallbackClassName?: string;
  // false when the avatar sits inside a link already (e.g. a whole card
  // that links to the profile): links can't be nested
  linkToProfile?: boolean;
}

// "John  Doe" -> "JD". Array.from splits by character, so an emoji or
// accented letter isn't cut in half.
const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => Array.from(word)[0])
    .join("")
    .toUpperCase();

// The user's picture, linking to their profile (unless linkToProfile is
// false). Shows their initials when there's no picture or it fails to load.
const UserAvatar = ({
  id,
  name,
  imageUrl,
  className,
  fallbackClassName,
  linkToProfile = true,
}: UserAvatarProps) => {
  const displayName = name?.trim() || "User";

  const avatar = (
    <Avatar className={cn("size-9", className)}>
      {/* A plain <img> (not next/image) so Radix can detect a broken
          URL and switch to the fallback. no-referrer: Google avatar
          URLs can refuse requests that send a Referer. */}
      {imageUrl && (
        <AvatarImage src={imageUrl} alt="" referrerPolicy="no-referrer" />
      )}
      <AvatarFallback
        className={cn(
          "primary-gradient font-space-grotesk font-bold tracking-wider text-white",
          fallbackClassName,
        )}
      >
        {getInitials(displayName)}
      </AvatarFallback>
    </Avatar>
  );

  if (!linkToProfile) return avatar;

  return (
    <Link
      href={ROUTES.PROFILE_DETAILS(id)}
      aria-label={`${displayName}'s profile`}
      className="rounded-full"
    >
      {avatar}
    </Link>
  );
};

export default UserAvatar;
