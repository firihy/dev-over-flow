// The sort buttons above the home page questions. The value goes in the
// URL (?filter=newest) and is checked by QuestionsSearchParamsSchema.
// TODO: Add Recommended once recommendations are built
export const HOME_FILTERS = [
  { name: "Newest", value: "newest" },
  { name: "Popular", value: "popular" },
  { name: "Unanswered", value: "unanswered" },
] as const;

export type HomeFilterValue = (typeof HOME_FILTERS)[number]["value"];

export const isHomeFilter = (value: string): value is HomeFilterValue =>
  HOME_FILTERS.some((filter) => filter.value === value);
