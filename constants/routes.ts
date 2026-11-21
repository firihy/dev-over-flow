const ROUTES = {
  HOME: "/",
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  COMMUNITY: "/community",
  COLLECTION: "/collection",
  JOBS: "/jobs",
  TAGS: "/tags",
  PROFILE: "/profile",
  EDIT_PROFILE: "/profile/edit",
  PROFILE_DETAILS: (id: string) => `/profile/${id}`,
  ASK_QUESTION: "/ask-question",
  QUESTION: (id: string) => `/questions/${id}`,
  EDIT_QUESTION: (id: string) => `/questions/${id}/edit`,
  TAG: (id: string) => `/tags/${id}`,
};

export default ROUTES;
