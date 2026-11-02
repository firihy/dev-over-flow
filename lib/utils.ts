import { techMap } from "@/constants/techMap";

export { cn } from "cn";

export const getDeviconClassName = (techName: string) => {
  const normalizedTechName = techName.replace(/[ .]/g, "").toLowerCase();
  const iconClass = techMap[normalizedTechName];

  return iconClass ? `${iconClass} colored` : "devicon-devicon-plain";
};
