import type { Lesson } from "@/lib/lesson-types";

export const centralIdeasDetails: Lesson = {
  slug: "central-ideas-details",
  unit: 2,
  order: 0,
  title: "Central Ideas and Details",
  blurb: "Decide first whether you're being asked for the whole arc or one sentence of it.",
  domain: "info_ideas",
  stems: [
    "Which choice best states the main idea of the text?",
    "According to the text, what is true about …?",
  ],
  steps: [
    {
      title: "Decide: main idea, or a detail?",
      detail:
        "A main-idea answer must cover the whole passage. A detail answer only has to match one located sentence. Getting this wrong is the most common way to lose an easy question.",
    },
    {
      title: "For main idea, cover the full arc",
      detail:
        "If the passage turns — old view, then 'however', then new finding — the answer has to contain the turn. An answer describing only the setup is incomplete by definition.",
    },
    {
      title: "For a detail, go back and locate before you choose",
      detail:
        "Use the question's keywords to find the exact sentence, then read that sentence and the one after it. Answer from the page, not from memory of the page.",
    },
    {
      title: "Expect a paraphrase, not an echo",
      detail:
        "The correct answer says the passage's idea in different words. The option that reuses the passage's exact vocabulary is usually the one built to catch you.",
    },
  ],
  signals: [
    { label: "Where the main idea hides", items: ["first sentence", "last sentence", "right after 'however'"] },
    { label: "Conclusion markers", items: ["therefore", "in short", "ultimately", "the result is"] },
    { label: "Detail-question keywords", items: ["according to the text", "the text states", "a specific name or date"] },
  ],
  traps: ["too-narrow", "same-word", "out-of-scope", "too-extreme"],
  workedExample: {
    passage:
      "Coral reefs are widely described as fragile, and heat waves do bleach them quickly. But marine biologist Tavita Halu has documented reefs in American Samoa that bleach during each hot season and recover within a year. The corals there, she argues, are not unusually tough; they simply live in water that already swings between temperature extremes, so the heat wave is nothing new to them.",
    question: "Which choice best states the main idea of the text?",
    options: [
      {
        t: "Some corals recover from bleaching not because they are hardier but because they are already accustomed to large temperature swings.",
        correct: true,
      },
      {
        t: "Corals in American Samoa are tougher than corals found elsewhere.",
        trap: "The passage explicitly denies this: Halu argues they are 'not unusually tough'.",
        trapType: "opposite",
      },
      {
        t: "Coral reefs are fragile, and heat waves bleach them quickly.",
        trap: "That is the opening setup, stated in the passage's own words — the sentence the 'But' is about to complicate.",
        trapType: "same-word",
      },
      {
        t: "Reefs worldwide will recover from bleaching as ocean temperatures continue to rise.",
        trap: "It leaps from reefs in one place to reefs worldwide, and 'will recover' asserts far more than the passage does.",
        trapType: "too-extreme",
      },
    ],
    walkthrough: [
      {
        label: "Which kind of question is it?",
        text: "'Main idea' — so the answer must cover the whole passage, not the first sentence and not the last one alone.",
      },
      {
        label: "Cover the arc",
        text: "The arc is: reefs are called fragile → BUT these reefs recover → and here's why (they're used to swings, not tougher). All three beats have to survive.",
      },
      {
        label: "Locate before choosing",
        text: "The explanatory sentence — 'not unusually tough; they simply live in water that already swings' — is where the passage lands. Check every option against it.",
      },
      {
        label: "Paraphrase, not echo",
        text: "The 'fragile… bleach quickly' option is lifted almost verbatim from sentence one, which is a signal, not a comfort. The keyed answer restates the explanation in fresh words.",
      },
    ],
  },
  practice: { gameTypes: ["read_the_green"], quizDomains: ["info_ideas"] },
  trainWith: [
    { href: "/rw/read-the-green", label: "Read the Green" },
    { href: "/rw/paraphrase", label: "Paraphrase Match" },
  ],
};
