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

// The sort options for the tags list (?filter=name on /tags), checked by
// TagsSearchParamsSchema
export const TAG_FILTERS = [
  { name: "Popular", value: "popular" },
  { name: "Recent", value: "recent" },
  { name: "Oldest", value: "oldest" },
  { name: "Name", value: "name" },
] as const;

export type TagFilterValue = (typeof TAG_FILTERS)[number]["value"];

export const isTagFilter = (value: string): value is TagFilterValue =>
  TAG_FILTERS.some((filter) => filter.value === value);

// The sort options for a question's answers, checked by GetAnswersSchema
export const ANSWER_FILTERS = [
  { name: "Newest", value: "latest" },
  { name: "Oldest", value: "oldest" },
  { name: "Popular", value: "popular" },
] as const;

export type AnswerFilterValue = (typeof ANSWER_FILTERS)[number]["value"];

// The sort options for the users list (?filter=popular on /community),
// checked by UsersSearchParamsSchema. Popular means highest reputation.
export const USER_FILTERS = [
  { name: "Newest", value: "newest" },
  { name: "Oldest", value: "oldest" },
  { name: "Popular", value: "popular" },
] as const;

export type UserFilterValue = (typeof USER_FILTERS)[number]["value"];

export const isUserFilter = (value: string): value is UserFilterValue =>
  USER_FILTERS.some((filter) => filter.value === value);
