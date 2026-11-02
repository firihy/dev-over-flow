import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface MetricProps {
  imgUrl: string;
  value: string | number;
  title: ReactNode;
  textStyles: string;
  href?: string;
  imgStyles?: string;
  // Hides the title on small screens to keep the author line short
  isAuthor?: boolean;
}

const Metric = ({
  imgUrl,
  value,
  title,
  textStyles,
  href,
  imgStyles,
  isAuthor,
}: MetricProps) => {
  const content = (
    <>
      {/* Decorative: the text next to it already says what it is */}
      <Image
        src={imgUrl}
        width={16}
        height={16}
        alt=""
        className={cn("rounded-full object-contain", imgStyles)}
      />

      <p className={cn("flex items-center gap-1", textStyles)}>
        {value}
        <span
          className={cn(
            "small-regular line-clamp-1",
            isAuthor && "max-sm:hidden",
          )}
        >
          {title}
        </span>
      </p>
    </>
  );

  return href ? (
    <Link href={href} className="flex-center gap-1">
      {content}
    </Link>
  ) : (
    <div className="flex-center gap-1">{content}</div>
  );
};

export default Metric;
