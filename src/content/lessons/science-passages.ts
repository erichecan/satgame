import type { Lesson } from "@/lib/lesson-types";

export const sciencePassages: Lesson = {
  slug: "science-passages",
  unit: 5,
  order: 0,
  title: "Science Passages",
  blurb: "You are never being tested on science. Read the research skeleton and the technical words stop mattering.",
  domain: "science",
  stems: [
    "Which finding, if true, would most strongly support the researchers' hypothesis?",
    "Which choice best states the function of the underlined sentence in the text as a whole?",
    "Which choice most logically completes the text?",
  ],
  steps: [
    {
      title: "Map the passage onto the research skeleton",
      detail:
        "Background → hypothesis → method → result → limitation. A 25–150 word passage will show only two or three of those. Identify which ones are present and you have the structure.",
    },
    {
      title: "Find the hypothesis sentence and mark it",
      detail:
        "Most science questions turn on whether that one claim holds up. Everything else in the passage is either setup for it or a test of it.",
    },
    {
      title: "Keep 'what was measured' separate from 'what was concluded'",
      detail:
        "The most common wrong answer states a conclusion as though it were an observation. Observations are what the instruments recorded; conclusions are what the researchers decided it meant.",
    },
    {
      title: "Never supply outside science knowledge",
      detail:
        "College Board states that topic-specific prior knowledge is not assessed. If it isn't in those 150 words, it isn't available to you — even if you know it's true.",
    },
    {
      title: "Treat unfamiliar technical nouns as placeholders",
      detail:
        "Call it X. You need the relationships — X causes Y, X was higher than Y — not the definition. This is why a hard vocabulary load doesn't have to sink you here.",
    },
  ],
  signals: [
    { label: "Hypothesis markers", items: ["hypothesized", "proposed", "predicted", "the team suspected", "if … then"] },
    { label: "Observation markers", items: ["measured", "recorded", "observed", "the data show"] },
    { label: "Conclusion markers — hedged on purpose", items: ["suggests", "may indicate", "consistent with", "the team argues"] },
    { label: "Limitation markers", items: ["however", "small sample", "only in", "further research", "did not account for"] },
  ],
  traps: ["out-of-scope", "too-extreme", "opposite"],
  workedExample: {
    passage:
      "Mycorrhizal fungi trade soil nutrients to trees in exchange for sugars. Ecologist Ines Barbeau proposed that seedlings connected to a fungal network outgrow unconnected ones because the network subsidizes them. She raised 200 seedlings, severing the fungal connections of half. After two seasons, connected seedlings averaged 34% more height growth, though soil in the connected plots also held measurably more nitrogen.",
    question: "Which choice best states the function of the final clause (\"though soil in the connected plots also held measurably more nitrogen\") in the text as a whole?",
    options: [
      {
        t: "It notes a factor that could explain the growth difference other than the one Barbeau proposed.",
        correct: true,
      },
      {
        t: "It provides the measurement that confirms Barbeau's proposal.",
        trap: "The nitrogen finding weakens rather than confirms the interpretation — it offers a rival explanation for the same result.",
        trapType: "opposite",
      },
      {
        t: "It shows that nitrogen is the nutrient most essential to seedling growth.",
        trap: "Nothing in the passage ranks nutrients. That's outside knowledge about plant biology being imported into the text.",
        trapType: "out-of-scope",
      },
      {
        t: "It proves that the fungal network had no effect on the seedlings' growth.",
        trap: "'Proves … no effect' is far stronger than a noted complication. The passage raises a doubt, it does not settle one.",
        trapType: "too-extreme",
      },
    ],
    walkthrough: [
      {
        label: "Map the skeleton",
        text: "Background (fungi trade nutrients) → hypothesis (network subsidizes seedlings) → method (200 seedlings, half severed) → result (34% more growth) → limitation (but nitrogen also differed).",
      },
      {
        label: "Mark the hypothesis",
        text: "'Seedlings connected to a fungal network outgrow unconnected ones BECAUSE the network subsidizes them.' The word doing the work is 'because' — this is a causal claim.",
      },
      {
        label: "Measured vs concluded",
        text: "Measured: 34% more height, more nitrogen in connected plots. Concluded: nothing yet. The final clause is about the measurement raising a doubt over the causal story.",
      },
      {
        label: "No outside knowledge",
        text: "You may well know nitrogen matters for growth. Irrelevant — the passage doesn't rank nutrients, so the option that does is out of scope.",
      },
      {
        label: "Technical nouns as placeholders",
        text: "'Mycorrhizal' never needed defining. Connected group grew more, but their soil was also richer — that structure is all the question asked you to see.",
      },
    ],
  },
  practice: { gameTypes: ["read_the_green"], rtgDomains: ["science"] },
  trainWith: [
    { href: "/rw/read-the-green", label: "Read the Green" },
    { href: "/rw/graphic", label: "Graphic" },
  ],
};
