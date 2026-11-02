import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import ROUTES from "@/constants/routes";
import { cn, getDeviconClassName } from "@/lib/utils";

interface TagCardProps {
  _id: string;
  name: string;
  questions?: number;
  showCount?: boolean;
  // Just the badge, for inline tag lists (e.g. on a question card)
  compact?: boolean;
  // Turns the tag into a removable chip (e.g. while typing tags in a form)
  onRemove?: () => void;
}

const BADGE_CLASSES =
  "subtle-medium background-light800_dark300 text-light400_light500 h-auto gap-2 rounded-md border-none px-4 py-2 uppercase";

const TagCard = ({
  _id,
  name,
  questions,
  showCount,
  compact,
  onRemove,
}: TagCardProps) => {
  const iconClass = getDeviconClassName(name);

  const label = (
    <>
      <i className={`${iconClass} text-sm`} aria-hidden />
      <span>{name}</span>
    </>
  );

  // Not a link: a button inside a link would be invalid and confusing to click
  if (onRemove) {
    return (
      <Badge className={BADGE_CLASSES}>
        {label}
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          className="flex-center cursor-pointer rounded-sm"
        >
          {/* The icon is black, so flip it to white in dark mode */}
          <Image
            src="/icons/close.svg"
            width={12}
            height={12}
            alt=""
            className="size-3 object-contain dark:invert"
          />
        </button>
      </Badge>
    );
  }

  return (
    <Link
      href={ROUTES.TAG(_id)}
      className={cn("flex items-center gap-2", !compact && "justify-between")}
    >
      <Badge className={BADGE_CLASSES}>{label}</Badge>

      {showCount && !compact && (
        <p className="small-medium text-dark500_light700">{questions}</p>
      )}
    </Link>
  );
};

export default TagCard;
