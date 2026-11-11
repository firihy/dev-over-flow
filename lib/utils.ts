import { techDescriptions } from "@/constants/techDescriptions";
import { techMap } from "@/constants/techMap";

export { cn } from "cn";

// "Next.js" -> "nextjs", the form techMap's keys use
const findTech = (techName: string) =>
  techMap[techName.replace(/[ .]/g, "").toLowerCase()];

export const getDeviconClassName = (techName: string) => {
  const iconClass = findTech(techName);

  return iconClass ? `${iconClass} colored` : "devicon-devicon-plain";
};

// A line about the tag for its card. Unknown tags get a neutral line
// rather than a claim that may be wrong ("cooking is a web technology").
export const getTechDescription = (techName: string) => {
  const iconClass = findTech(techName);

  return (
    (iconClass && techDescriptions[iconClass]) ?? `Questions about ${techName}.`
  );
};

const TIME_UNITS: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { unit: "year", seconds: 60 * 60 * 24 * 365 },
  { unit: "month", seconds: 60 * 60 * 24 * 30 },
  { unit: "week", seconds: 60 * 60 * 24 * 7 },
  { unit: "day", seconds: 60 * 60 * 24 },
  { unit: "hour", seconds: 60 * 60 },
  { unit: "minute", seconds: 60 },
];

const relativeTimeFormat = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

// "3 weeks ago", "yesterday", "in 2 days", "now"
export const getTimeStamp = (date: Date, now = new Date()) => {
  const secondsDiff = Math.round((date.getTime() - now.getTime()) / 1000);
  const { unit, seconds } = TIME_UNITS.find(
    ({ seconds }) => Math.abs(secondsDiff) >= seconds,
  ) ?? { unit: "second", seconds: 1 };

  return relativeTimeFormat.format(Math.trunc(secondsDiff / seconds), unit);
};
