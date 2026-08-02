import type { Lesson } from "@/lib/lesson-types";

export const boundaries: Lesson = {
  slug: "boundaries",
  unit: 4,
  order: 0,
  title: "Boundaries",
  blurb: "Punctuation questions are structure questions. Test both sides; meaning barely matters.",
  domain: "expression_conventions",
  stems: ["Which choice completes the text so that it conforms to the conventions of Standard English?"],
  steps: [
    {
      title: "Notice what changes across the options",
      detail:
        "If the four options differ only in punctuation — comma, semicolon, colon, dash, period — you are in a Boundaries question. Stop reading for meaning.",
    },
    {
      title: "Test each side: can it stand alone as a sentence?",
      detail:
        "Read the left side by itself, then the right side by itself. Everything else follows from those two yes/no answers.",
    },
    {
      title: "Apply the rule table",
      detail:
        "Complete + complete: period, semicolon, comma WITH a coordinating conjunction, an em dash, or a colon when the right side explains or amplifies the left. Complete + incomplete: comma, nothing, an em dash, or a colon when the right side is a list or an emphasized element — but never a semicolon.",
    },
    {
      title: "A comma alone can never join two complete sentences",
      detail:
        "That is a comma splice, and it is wrong every single time. This one rule decides a large share of these questions on its own.",
    },
    {
      title: "Check the colon's left side",
      detail:
        "A colon demands a complete sentence in front of it. What follows can be a list, an explanation, or a single emphasized word.",
    },
  ],
  signals: [
    { label: "You're in a Boundaries question when options differ only by", items: [",", ";", ":", "—", "."] },
    {
      label: "These create a splice when a comma joins them to a NEW complete sentence",
      items: ["however", "therefore", "moreover", "nevertheless", "consequently"],
    },
    { label: "Conjunctions that let a comma join two sentences", items: ["and", "but", "or", "so", "yet", "for", "nor"] },
  ],
  traps: [],
  workedExample: {
    passage:
      "The lighthouse keeper logged the weather every six hours for forty-one years ______ her successor abandoned the practice within a month of taking over.",
    question: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    options: [
      { t: "years;", correct: true },
      {
        t: "years,",
        trap: "Both sides are complete sentences, so a bare comma creates a comma splice — always wrong.",
      },
      {
        t: "years",
        trap: "With no punctuation at all the two complete sentences run together. That's a run-on.",
      },
      {
        t: "years:",
        trap: "A colon needs the right side to explain, amplify, or specify the left. Here the right side switches to a different person doing the opposite thing — a contrast, which a colon cannot carry.",
      },
    ],
    walkthrough: [
      {
        label: "What changes?",
        text: "The four options are 'years;' 'years,' 'years' and 'years:' — identical words, different punctuation. This is a structure question, not a meaning question.",
      },
      {
        label: "Test the left side",
        text: "'The lighthouse keeper logged the weather every six hours for forty-one years.' Subject, verb, complete thought. Yes, it stands alone.",
      },
      {
        label: "Test the right side",
        text: "'Her successor abandoned the practice within a month of taking over.' Also complete. So you have complete + complete.",
      },
      {
        label: "Apply the rule",
        text: "Complete + complete allows a period, a semicolon, a comma with a coordinating conjunction, an em dash, or a colon when the right side explains the left. No conjunction and no dash are offered here, so the semicolon is the only legal joint on the list.",
      },
      {
        label: "Rule out the near-miss",
        text: "The colon is the tempting wrong answer. Check what sits to its right: a new subject doing the opposite thing. That's a contrast, not an explanation of the keeper's logging — so the colon fails even though its left side is a complete sentence.",
      },
    ],
  },
  practice: { gameTypes: ["gate_run"], gateKinds: ["punctuation", "apostrophe"] },
  trainWith: [{ href: "/rw/gate-run", label: "Gate Run" }],
};
