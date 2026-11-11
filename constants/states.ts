import ROUTES from "@/constants/routes";

// Text for DataRenderer's empty and error states. Add one EMPTY_* per list
// (collections...) when its page is built.

// Shared by the empty state link and the Retry button
export const STATE_BUTTON_CLASS =
  "paragraph-medium bg-primary-500 text-light-900 hover:bg-primary-500 mt-5 min-h-11.5 rounded-lg px-4 py-3";

export interface StateButton {
  text: string;
  href: string;
}

export interface EmptyState {
  title: string;
  message: string;
  button?: StateButton;
}

export const DEFAULT_EMPTY: EmptyState = {
  title: "No Data Found",
  message: "There's nothing here yet.",
};

export const DEFAULT_ERROR = {
  title: "Something Went Wrong",
  message: "Even our code can have a bad day. Give it another shot.",
};

export const EMPTY_QUESTION: EmptyState = {
  title: "Ahh, No Questions Yet!",
  message:
    "The question board is empty. Maybe it’s waiting for your brilliant question to get things rolling.",
  button: { text: "Ask a Question", href: ROUTES.ASK_QUESTION },
};

// When a search or filter is on: there are questions, just none that match
export const EMPTY_QUESTION_SEARCH: EmptyState = {
  title: "No Matching Questions",
  message: "Try other words, or clear the search and filters.",
  button: { text: "Show All Questions", href: ROUTES.HOME },
};

export const EMPTY_TAGS: EmptyState = {
  title: "No Tags Found",
  message: "The tag cloud is empty. Add some keywords to make it rain.",
  button: { text: "Ask a Question", href: ROUTES.ASK_QUESTION },
};

// When a search is on, or past the last page: tags exist, none match
export const EMPTY_TAGS_SEARCH: EmptyState = {
  title: "No Matching Tags",
  message: "Try another name, or clear the search.",
  button: { text: "Show All Tags", href: ROUTES.TAGS },
};

// A tag that no question uses (any more)
export const EMPTY_TAG_QUESTIONS: EmptyState = {
  title: "No Questions With This Tag",
  message: "Be the first to ask one with this tag.",
  button: { text: "Ask a Question", href: ROUTES.ASK_QUESTION },
};

// A search or a later page on a tag: it has questions, none match
export const EMPTY_TAG_QUESTIONS_SEARCH: EmptyState = {
  title: "No Matching Questions",
  message: "Try other words, or clear the search.",
};
