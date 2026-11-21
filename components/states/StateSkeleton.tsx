import Image from "next/image";
import type { ReactNode } from "react";

interface StateSkeletonProps {
  image: { light: string; dark: string; width: number; height: number };
  title: string;
  message: ReactNode;
  action?: ReactNode;
}

// The picture, heading, message and button shared by both states
const StateSkeleton = ({
  image,
  title,
  message,
  action,
}: StateSkeletonProps) => (
  <div className="mt-16 flex w-full flex-col items-center justify-center sm:mt-36">
    {/* Decorative (alt=""): the heading below says what it shows. One
        image per theme; the other is hidden with CSS. */}
    <Image
      src={image.dark}
      alt=""
      width={image.width}
      height={image.height}
      className="hidden object-contain dark:block"
    />
    <Image
      src={image.light}
      alt=""
      width={image.width}
      height={image.height}
      className="block object-contain dark:hidden"
    />

    <h2 className="h2-bold text-dark200_light900 mt-8">{title}</h2>
    <div className="body-regular text-dark500_light700 my-3.5 max-w-md text-center">
      {message}
    </div>
    {action}
  </div>
);

export default StateSkeleton;
