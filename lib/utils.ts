import { techMap } from "@/constants/techMap";

export { cn } from "cn";

export const getDeviconClassName = (techName: string) => {
  const normalizedTechName = techName.replace(/[ .]/g, "").toLowerCase();
  const iconClass = techMap[normalizedTechName];

  return iconClass ? `${iconClass} colored` : "devicon-devicon-plain";
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
