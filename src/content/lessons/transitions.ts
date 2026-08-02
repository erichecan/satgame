import type { Lesson } from "@/lib/lesson-types";

export const transitions: Lesson = {
  slug: "transitions",
  unit: 3,
  order: 0,
  title: "Transitions",
  blurb: "Name the relationship between the two sentences, then pick the word. Never the other way round.",
  domain: "expression_conventions",
  stems: ["Which choice completes the text with the most logical transition?"],
  steps: [
    {
      title: "Cover the options",
      detail:
        "Transition options all read smoothly — that's their job. If you choose by ear you are choosing at random.",
    },
    {
      title: "Compress the sentence before and the sentence after",
      detail:
        "Reduce each to a short clause. You only need the two ideas the transition has to connect, not the decoration around them.",
    },
    {
      title: "Name the relationship in plain words",
      detail:
        "Same direction? Opposite direction? Cause and effect? An example of what came before? A step in time? Say it before you look at a single option.",
    },
    {
      title: "Pick from the matching family",
      detail:
        "Within a family the words are near-interchangeable, so once you have the category the answer is usually forced. Options usually come from different families, so naming the category first tends to force the answer.",
    },
    {
      title: "Resist the 'however' reflex",
      detail:
        "'However' feels sophisticated, so it gets picked when there is no contrast at all. If the two sentences agree, however is simply wrong.",
    },
  ],
  signals: [
    { label: "Same direction — adding", items: ["moreover", "furthermore", "in addition", "similarly", "likewise", "also"] },
    { label: "Opposite direction — contrast", items: ["however", "nevertheless", "in contrast", "on the other hand", "still", "conversely"] },
    { label: "Cause and effect", items: ["therefore", "thus", "consequently", "as a result", "hence"] },
    { label: "Example / specifying", items: ["for example", "for instance", "specifically", "in particular"] },
    { label: "Time and sequence", items: ["meanwhile", "subsequently", "ultimately", "then", "eventually"] },
  ],
  traps: ["opposite", "non-sequitur"],
  workedExample: {
    passage:
      "Sea otters eat enormous quantities of sea urchins, and urchins graze kelp down to bare rock. Where otter populations have recovered, kelp forests have returned with them. ______ protecting a single predator can restore an entire underwater habitat.",
    question: "Which choice completes the text with the most logical transition?",
    options: [
      { t: "Thus,", correct: true },
      {
        t: "However,",
        trap: "There is no contrast here — the last sentence agrees with and follows from the ones before it.",
        trapType: "opposite",
      },
      {
        t: "For example,",
        trap: "The final sentence is a general conclusion drawn from the case, not a further instance of it.",
        trapType: "non-sequitur",
      },
      {
        t: "Meanwhile,",
        trap: "'Meanwhile' marks two things happening at the same time. The final sentence is a takeaway, not a simultaneous event.",
        trapType: "non-sequitur",
      },
    ],
    walkthrough: [
      {
        label: "Cover the options",
        text: "Read the passage with a blank. All four transitions would sound fine there, which is exactly why the ear is useless.",
      },
      {
        label: "Compress both sides",
        text: "Before: otters eat urchins, urchins destroy kelp, otters back → kelp back. After: protecting one predator can restore a habitat.",
      },
      {
        label: "Name the relationship",
        text: "The second is the lesson drawn from the first. That is cause-and-effect, or more precisely a conclusion.",
      },
      {
        label: "Pick from the family",
        text: "The cause-effect family is therefore / thus / consequently / as a result. 'Thus' is the only option from that family — done.",
      },
      {
        label: "Check the reflex",
        text: "'However' was the tempting one, and it is the exact error this lesson exists to stop: the sentences agree, so contrast is impossible.",
      },
    ],
  },
  practice: { gameTypes: ["gate_run"], gateKinds: ["transition"] },
  trainWith: [{ href: "/rw/gate-run", label: "Gate Run" }],
};
