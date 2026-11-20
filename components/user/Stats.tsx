import Image from "next/image";

import type { BadgeCounts } from "@/lib/badges";
import { formatNumber } from "@/lib/utils";

interface StatsProps {
  totalQuestions: number;
  totalAnswers: number;
  badges: BadgeCounts;
  reputation: number;
}

const CARD_CLASSES =
  "light-border background-light900_dark300 shadow-light-300 dark:shadow-dark-200 flex flex-wrap items-center gap-4 rounded-md border p-6";

const BADGES = [
  { key: "GOLD", imgUrl: "/icons/gold-medal.svg", title: "Gold Badges" },
  { key: "SILVER", imgUrl: "/icons/silver-medal.svg", title: "Silver Badges" },
  { key: "BRONZE", imgUrl: "/icons/bronze-medal.svg", title: "Bronze Badges" },
] as const;

// A profile's numbers: posts, then badges
const Stats = ({
  totalQuestions,
  totalAnswers,
  badges,
  reputation,
}: StatsProps) => (
  <section className="mt-10">
    <h2 className="h3-semibold text-dark200_light900">
      Stats{" "}
      <span className="small-semibold primary-text-gradient">
        {formatNumber(reputation)} reputation
      </span>
    </h2>

    <div className="mt-5 grid grid-cols-1 gap-5 xs:grid-cols-2 md:grid-cols-4">
      <div className={`${CARD_CLASSES} justify-evenly`}>
        <div>
          <p className="paragraph-semibold text-dark200_light900">
            {formatNumber(totalQuestions)}
          </p>
          <p className="body-medium text-dark400_light700">
            {totalQuestions === 1 ? "Question" : "Questions"}
          </p>
        </div>
        <div>
          <p className="paragraph-semibold text-dark200_light900">
            {formatNumber(totalAnswers)}
          </p>
          <p className="body-medium text-dark400_light700">
            {totalAnswers === 1 ? "Answer" : "Answers"}
          </p>
        </div>
      </div>

      {BADGES.map(({ key, imgUrl, title }) => (
        <div key={key} className={CARD_CLASSES}>
          {/* Decorative: the title says which medal it is */}
          <Image src={imgUrl} alt="" width={40} height={50} />
          <div>
            <p className="paragraph-semibold text-dark200_light900">
              {formatNumber(badges[key])}
            </p>
            <p className="body-medium text-dark400_light700">{title}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default Stats;
