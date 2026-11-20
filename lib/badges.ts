// Which badges a user has earned. Plain numbers and functions only (no
// database), so the rules are easy to read and to test.

export const BADGE_LEVELS = ["BRONZE", "SILVER", "GOLD"] as const;
export type BadgeLevel = (typeof BADGE_LEVELS)[number];

export type BadgeCounts = Record<BadgeLevel, number>;

// How much of each thing it takes to earn each level. Every row can earn
// up to one badge of each level, so a user with 100 questions gets bronze,
// silver and gold for that row.
export const BADGE_CRITERIA = {
  QUESTION_COUNT: { BRONZE: 10, SILVER: 50, GOLD: 100 },
  ANSWER_COUNT: { BRONZE: 10, SILVER: 50, GOLD: 100 },
  QUESTION_UPVOTES: { BRONZE: 10, SILVER: 50, GOLD: 100 },
  ANSWER_UPVOTES: { BRONZE: 10, SILVER: 50, GOLD: 100 },
  TOTAL_VIEWS: { BRONZE: 1000, SILVER: 10000, GOLD: 100000 },
} as const satisfies Record<string, BadgeCounts>;

export type BadgeCriterion = keyof typeof BADGE_CRITERIA;

// How many badges of each level the numbers earn. Pass every criterion;
// one that is left out earns nothing.
export const assignBadges = (
  totals: Partial<Record<BadgeCriterion, number>>,
): BadgeCounts => {
  const badges: BadgeCounts = { GOLD: 0, SILVER: 0, BRONZE: 0 };

  for (const criterion of Object.keys(BADGE_CRITERIA) as BadgeCriterion[]) {
    const total = totals[criterion] ?? 0;
    for (const level of BADGE_LEVELS) {
      if (total >= BADGE_CRITERIA[criterion][level]) badges[level] += 1;
    }
  }

  return badges;
};
