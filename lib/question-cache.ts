import "server-only";

import { cache } from "react";

import { getQuestion } from "@/lib/actions/question.action";

// The question page needs the question twice in one request: once for
// <title> and the description, once for the page. cache() makes the
// second call reuse the first. It is keyed on its arguments, so it takes
// the id (a string); getQuestion takes an object, which is a new object
// on every call and would never match. It lives for one request only.
export const loadQuestion = cache((questionId: string) =>
  getQuestion({ questionId }),
);
