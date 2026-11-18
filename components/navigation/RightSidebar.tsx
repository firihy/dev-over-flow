import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import TagCard from "@/components/cards/TagCard";
import ROUTES from "@/constants/routes";
import { getHotQuestions } from "@/lib/actions/question.action";
import { getTopTags } from "@/lib/actions/tag.action";

// One muted line for an empty list or a failed load. DataRenderer's states
// are sized for a whole page, too big for this narrow column.
const SidebarNote = ({ children }: { children: ReactNode }) => (
  <p className="body-regular text-dark500_light700 mt-7">{children}</p>
);

const RightSidebar = async () => {
  // Neither depends on the other, so load both at once
  const [hotQuestions, topTags] = await Promise.all([
    getHotQuestions(),
    getTopTags(),
  ]);

  return (
    <section className="custom-scrollbar background-light900_dark200 light-border shadow-light-300 sticky top-0 right-0 flex h-screen w-87.5 shrink-0 flex-col gap-16 overflow-y-auto border-l p-6 pt-36 max-xl:hidden dark:shadow-none">
      <div>
        <h3 className="h3-bold text-dark200_light900">Top Questions</h3>

        {!hotQuestions.success ? (
          <SidebarNote>Couldn&apos;t load the top questions.</SidebarNote>
        ) : hotQuestions.data.length === 0 ? (
          <SidebarNote>No questions have been asked yet.</SidebarNote>
        ) : (
          <div className="mt-7 flex w-full flex-col gap-7.5">
            {hotQuestions.data.map(({ _id, title }) => (
              <Link
                key={_id}
                href={ROUTES.QUESTION(_id)}
                className="flex items-center justify-between gap-7"
              >
                <p className="body-medium text-dark500_light700 line-clamp-2">
                  {title}
                </p>

                <Image
                  src="/icons/chevron-right.svg"
                  alt=""
                  width={20}
                  height={20}
                  className="invert-colors shrink-0"
                />
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="h3-bold text-dark200_light900">Popular Tags</h3>

        {!topTags.success ? (
          <SidebarNote>Couldn&apos;t load the popular tags.</SidebarNote>
        ) : topTags.data.length === 0 ? (
          <SidebarNote>No tags have been used yet.</SidebarNote>
        ) : (
          <div className="mt-7 flex flex-col gap-4">
            {topTags.data.map(({ _id, name, questions }) => (
              <TagCard
                key={_id}
                _id={_id}
                name={name}
                questions={questions}
                showCount
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default RightSidebar;
