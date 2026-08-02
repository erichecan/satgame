import type { Lesson } from "@/lib/lesson-types";

export const inferences: Lesson = {
  slug: "inferences",
  unit: 2,
  order: 3,
  title: "Inferences",
  blurb: "Finish the author's thought. If an option repeats the passage, it isn't an inference.",
  domain: "info_ideas",
  stems: [
    "Which choice most logically completes the text?",
  ],
  steps: [
    {
      title: "Read to the blank and stop",
      detail:
        "The blank sits at the end, and everything before it is a complete chain of reasoning. Your job is to finish it, not to summarize it.",
    },
    {
      title: "Ask what the author is building toward",
      detail:
        "Why was this written? Each sentence has been placed to set up one conclusion. Name that conclusion before options can bias you.",
    },
    {
      title: "Say your own ending out loud first",
      detail:
        "A one-sentence prediction is worth more here than on any other question type, because all four options are grammatical continuations.",
    },
    {
      title: "An inference is what the text does NOT say outright",
      detail:
        "If an option just restates a sentence you already read, it cannot be the inference — that's a summary wearing a costume.",
    },
    {
      title: "Kill the extremes",
      detail:
        "Correct inferences hedge: likely, may, suggests, tends to. Options with will, all, never, or prove are almost always overreaching.",
    },
  ],
  signals: [
    { label: "The blank's lead-in", items: ["This suggests that ___", "Therefore, ___", "so ___", "It follows that ___"] },
    { label: "Hedges — usually in the right answer", items: ["likely", "may", "suggests", "tends to", "in some cases"] },
    { label: "Absolutes — usually in a trap", items: ["will", "all", "never", "prove", "certainly", "none"] },
  ],
  traps: ["too-extreme", "non-sequitur", "same-word", "out-of-scope"],
  workedExample: {
    passage:
      "Snow leopards hunt at extreme altitudes, where oxygen is thin and prey is scarce. Surviving that cold carries a steep metabolic cost, and few large predators can manage it at all. At lower elevations, by contrast, the same slopes hold leopards, wolves, and dholes competing for the same prey. This suggests that snow leopards came to occupy the high country mainly because ______",
    question: "Which choice most logically completes the text?",
    options: [
      {
        t: "the scarcity of rivals at those heights outweighed the cost of living there.",
        correct: true,
      },
      {
        t: "they are physically stronger than any other predator in Asia.",
        trap: "Nothing in the passage ranks the snow leopard's strength, and 'any other predator in Asia' is a sweeping claim the text never approaches.",
        trapType: "too-extreme",
      },
      {
        t: "oxygen is thin and prey is scarce at extreme altitudes.",
        trap: "That is sentence one, repeated. It restates the cost of living high without explaining why they went there — a summary, not an inference.",
        trapType: "same-word",
      },
      {
        t: "wolves and dholes are unable to digest the prey available at high elevations.",
        trap: "Digestion is never mentioned. The passage attributes rivals' absence to the metabolic cost of the cold, not to what they can digest.",
        trapType: "out-of-scope",
      },
    ],
    walkthrough: [
      {
        label: "Read to the blank",
        text: "Everything before 'because ___' is the chain: high country is costly; few predators can handle it; low country is crowded with competitors.",
      },
      {
        label: "What is the author building toward?",
        text: "The passage keeps pairing a cost with a benefit. It is setting up a trade-off, so the ending should name that trade-off.",
      },
      {
        label: "Predict",
        text: "Your version: 'Up there it's hard, but nobody else is there — and that was worth it.' Now compare.",
      },
      {
        label: "Reject the restatements",
        text: "'Oxygen is thin and prey is scarce' is literally sentence one. It cannot be an inference because you didn't have to infer anything to get it.",
      },
      {
        label: "Kill the extremes and the inventions",
        text: "'Stronger than any other predator in Asia' overreaches; the digestion option adds a mechanism the passage never mentions. The trade-off option is the only one the chain actually produces.",
      },
    ],
  },
  practice: { gameTypes: ["inference"] },
  trainWith: [{ href: "/rw/inference", label: "Inference" }],
};
