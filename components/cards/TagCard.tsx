import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import ROUTES from "@/constants/routes";
import { getDeviconClassName } from "@/lib/utils";

interface TagCardProps {
  _id: string;
  name: string;
  questions: number;
  showCount?: boolean;
}

const TagCard = ({ _id, name, questions, showCount }: TagCardProps) => {
  const iconClass = getDeviconClassName(name);

  return (
    <Link
      href={ROUTES.TAG(_id)}
      className="flex items-center justify-between gap-2"
    >
      <Badge className="subtle-medium background-light800_dark300 text-light400_light500 h-auto gap-2 rounded-md border-none px-4 py-2 uppercase">
        <i className={`${iconClass} text-sm`} aria-hidden />
        <span>{name}</span>
      </Badge>

      {showCount && (
        <p className="small-medium text-dark500_light700">{questions}</p>
      )}
    </Link>
  );
};

export default TagCard;
