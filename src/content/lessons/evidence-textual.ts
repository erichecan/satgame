import type { Lesson } from "@/lib/lesson-types";

export const evidenceTextual: Lesson = {
  slug: "evidence-textual",
  unit: 2,
  order: 1,
  title: "Command of Evidence — Textual",
  blurb: "The claim is the whole game. True is not the same as supporting.",
  domain: "info_ideas",
  stems: [
    "Which quotation from “Ghosts of the Old Year” most effectively illustrates the claim?",
    "Which finding from the model tests, if true, would most strongly support the hypothesis?",
  ],
  steps: [
    {
      title: "Underline the claim word for word",
      detail:
        "You are not being asked what the passage says — you are being asked what supports this specific sentence. Every limiting word in it counts.",
    },
    {
      title: "Decide the job: support, challenge, or illustrate",
      detail:
        "These point in different directions. An option that would be perfect for 'challenge' is a wrong answer when the question says 'support'.",
    },
    {
      title: "Restate the claim as something testable",
      detail:
        "Turn it into a sentence that could be true or false, then ask of each option: does this make that sentence more believable — directly?",
    },
    {
      title: "Reject options that are merely true",
      detail:
        "The classic wrong answer is a real fact from the passage that has nothing to do with the claim. True is cheap; relevant is what scores.",
    },
    {
      title: "On 'if true' questions, accept every option as fact",
      detail:
        "Don't argue with whether an option is plausible. Assume all four happened, then compare only how strongly each bears on the claim.",
    },
  ],
  signals: [
    { label: "Limiting words in the claim — they decide the answer", items: ["only", "primarily", "because", "more than", "before", "unlike"] },
    { label: "The job the question is asking for", items: ["support", "undermine", "illustrate", "challenge", "call into question"] },
  ],
  traps: ["out-of-scope", "opposite", "too-narrow", "same-word"],
  workedExample: {
    passage:
      "Paleontologists have proposed that the tall bony sail on the back of Spinosaurus served mainly to help the animal swim, acting as a paddle-like surface for propulsion through water. A team built two scale models, one with a sail and one without, and ran identical tests in a water tank.",
    question: "Which finding from the model tests, if true, would most strongly support the researchers' hypothesis?",
    options: [
      {
        t: "The model with a sail generated significantly more forward thrust per stroke while submerged than the model without a sail did.",
        correct: true,
      },
      {
        t: "The model with a sail was significantly more visible from a distance than the model without a sail was.",
        trap: "Visibility would support a display or signaling function — a different hypothesis. It says nothing about swimming.",
        trapType: "out-of-scope",
      },
      {
        t: "The model with a sail took significantly longer to travel a set distance underwater than the model without a sail did.",
        trap: "Slower underwater is evidence against a propulsion role. This finding would undermine the hypothesis, not support it.",
        trapType: "opposite",
      },
      {
        t: "The two models weighed nearly the same amount when fully assembled.",
        trap: "True and even useful for experimental design, but it bears on nothing in the claim about propulsion.",
        trapType: "out-of-scope",
      },
    ],
    walkthrough: [
      {
        label: "Underline the claim",
        text: "The claim: the sail served MAINLY to help the animal SWIM, acting as a surface for PROPULSION. Three words to hold onto — swim, propulsion, mainly.",
      },
      {
        label: "Name the job",
        text: "The question says 'most strongly support'. So you want the finding that makes propulsion more believable — not the one that's most interesting.",
      },
      {
        label: "Make it testable",
        text: "Testable version: 'the sail makes the animal move through water better.' Now each option can be checked against one yardstick.",
      },
      {
        label: "Cut the merely-true",
        text: "Visibility and equal weight are both fine facts that don't touch propulsion. That is the single most common wrong answer on this question type.",
      },
      {
        label: "Assume each is true, compare direction",
        text: "'Took longer to travel underwater' is real evidence — pointing the wrong way. Only 'more forward thrust per stroke while submerged' makes propulsion more believable.",
      },
    ],
  },
  practice: { gameTypes: ["paraphrase", "read_the_green"] },
  trainWith: [
    { href: "/rw/read-the-green", label: "Read the Green" },
    { href: "/rw/paraphrase", label: "Paraphrase Match" },
  ],
};
