import Link from "next/link";

import ROUTES from "@/constants/routes";
import { cn } from "@/lib/utils";

export const PROFILE_TABS = [
  { value: "top-posts", label: "Top Posts" },
  { value: "answers", label: "Answers" },
] as const;

export type ProfileTab = (typeof PROFILE_TABS)[number]["value"];

export const isProfileTab = (value: string): value is ProfileTab =>
  PROFILE_TABS.some((tab) => tab.value === value);

interface ProfileTabsProps {
  userId: string;
  active: ProfileTab;
}

// The tab is in the URL (?tab=answers), not in client state: a reload or
// shared link keeps it, and each tab has its own ?page. Switching tabs
// starts at page 1. The first tab has no ?tab=, so it has a single URL.
const ProfileTabs = ({ userId, active }: ProfileTabsProps) => (
  <nav
    aria-label="Profile sections"
    className="background-light800_dark400 flex min-h-10.5 w-fit gap-1 rounded-lg p-1"
  >
    {PROFILE_TABS.map(({ value, label }) => {
      const isActive = value === active;
      const href =
        value === "top-posts"
          ? ROUTES.PROFILE_DETAILS(userId)
          : `${ROUTES.PROFILE_DETAILS(userId)}?tab=${value}`;

      return (
        <Link
          key={value}
          href={href}
          // Keep the page where it is: only the list below changes
          scroll={false}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "body-medium flex items-center rounded-md px-4 py-2",
            isActive
              ? "bg-primary-100 text-primary-500 dark:bg-dark-300"
              : "text-light-500 hover:text-dark300_light700",
          )}
        >
          {label}
        </Link>
      );
    })}
  </nav>
);

export default ProfileTabs;
