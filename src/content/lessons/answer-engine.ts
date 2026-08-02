import type { Lesson } from "@/lib/lesson-types";

export const answerEngine: Lesson = {
  slug: "answer-engine",
  unit: 0,
  order: 0,
  title: "The 4-Step Answer Engine",
  blurb: "The routine every reading question runs on — and why guessing by feel fails.",
  domain: "info_ideas",
  stems: [
    "Which choice best states the main idea of the text?",
    "Which choice most logically completes the text?",
    "Which finding, if true, would most strongly support the hypothesis?",
  ],
  steps: [
    {
      title: "Read the question before the passage",
      detail:
        "On the digital SAT every passage is 25–150 words and carries exactly one question. Knowing what you are hunting for turns a full read into a targeted one.",
    },
    {
      title: "Pull the keywords out of the question",
      detail:
        "Names, dates, conditions, and limiting words are your coordinates. They tell you which sentence in the passage actually matters.",
    },
    {
      title: "Answer in your own words before you look at the options",
      detail:
        "Predict first. If you read four polished options with no prediction, all four start sounding reasonable — that is exactly what they were built to do.",
    },
    {
      title: "Eliminate by type, not by feel",
      detail:
        "College Board states that each of the three wrong answers represents a common error or misconception. So ask 'which kind of wrong is this?' instead of 'which one sounds best?'",
    },
  ],
  signals: [
    {
      label: "The passage is short on purpose",
      items: ["25–150 words", "one question per passage", "easiest → hardest within a module"],
    },
    {
      label: "Words that mark the turn",
      items: ["but", "however", "yet", "although", "in fact", "therefore"],
    },
  ],
  traps: [
    "same-word",
    "opposite",
    "out-of-scope",
    "too-narrow",
    "too-extreme",
    "fictitious-comparison",
    "non-sequitur",
    "tone-mismatch",
  ],
  workedExample: {
    passage:
      "For decades, biologists assumed the tiny hairs lining a gecko's toes worked like suction cups. However, when researchers tested gecko toes in a vacuum chamber — where suction is impossible — the toes gripped just as firmly. The adhesion, it turned out, comes from molecular attraction between the hairs and the surface.",
    question: "Which choice best states the main idea of the text?",
    options: [
      {
        t: "A long-held explanation for how geckos cling was overturned by an experiment pointing to a different mechanism.",
        correct: true,
      },
      {
        t: "The tiny hairs lining a gecko's toes work like suction cups.",
        trap: "It lifts sentence one almost word for word — and sentence one is the belief the passage goes on to overturn. Matching the passage's wording is not the same as being right.",
        trapType: "same-word",
      },
      {
        t: "Researchers tested gecko toes in a vacuum chamber.",
        trap: "True, but it is one step in the study, not the point of the passage. A detail posing as the main idea.",
        trapType: "too-narrow",
      },
      {
        t: "Molecular attraction is the strongest adhesive force found in nature.",
        trap: "The passage never ranks molecular attraction against anything else. Nothing in the text supports it.",
        trapType: "out-of-scope",
      },
    ],
    walkthrough: [
      {
        label: "Read the question first",
        text: "It asks for the main idea — so the answer has to cover the whole passage, not one sentence of it.",
      },
      {
        label: "Pull the keywords",
        text: "'Main idea' plus the passage's pivot word 'However' tell you the passage has two halves: the old assumption, and what replaced it.",
      },
      {
        label: "Predict before reading options",
        text: "Your own version: 'People thought it was suction; a test showed it isn't — it's molecular attraction.' Now you have a yardstick.",
      },
      {
        label: "Eliminate by type",
        text: "The suction option copies sentence one's wording — and that sentence is the belief being overturned. The vacuum-chamber option is too narrow: one detail. The 'strongest in nature' option is out of scope: the passage never compares forces. Only the first option covers both halves.",
      },
    ],
  },
  practice: { gameTypes: ["trap_spotter"] },
  trainWith: [
    { href: "/rw/trap-spotter", label: "Trap Spotter" },
    { href: "/rw/read-the-green", label: "Read the Green" },
  ],
};
