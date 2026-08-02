import type { Lesson } from "@/lib/lesson-types";

export const literaturePoetry: Lesson = {
  slug: "literature-poetry",
  unit: 5,
  order: 3,
  title: "Literature & Poetry",
  blurb: "Get the literal story straight first. Symbolism still has to be proved by the text.",
  domain: "literature",
  stems: [
    "Which quotation from the poem most effectively illustrates the claim?",
    "Which choice best states the main idea of the text?",
    "As used in the text, what does the word … most nearly mean?",
  ],
  steps: [
    {
      title: "Answer the plot question before anything else",
      detail:
        "Who is here, where are they, what just happened? Interpretation built on a misread scene collapses. Literal first, always.",
    },
    {
      title: "For poetry, read by sentence, not by line",
      detail:
        "Line breaks are not punctuation. Reassemble the sentences by following the periods and semicolons, then read it as prose.",
    },
    {
      title: "Track the speaker's feeling and whether it shifts",
      detail:
        "The turn — where the mood changes — is almost always where the question is aimed. Mark it as you read.",
    },
    {
      title: "Figurative language still needs textual proof",
      detail:
        "A symbol only means what the passage supports. If the reading requires knowledge or association from outside the text, it is out of scope, however sophisticated it sounds.",
    },
    {
      title: "For 'which quotation illustrates the claim', match the emotion, not the topic",
      detail:
        "Several quotations will mention the same subject. The keyed one carries the specific feeling the claim names.",
    },
  ],
  signals: [
    { label: "The turn is happening here", items: ["but", "yet", "until", "no longer", "once", "now"] },
    { label: "Words that name the speaker's state", items: ["ached", "hesitated", "steadied", "hollow", "relieved"] },
    { label: "Claim language you must match", items: ["anticipation", "regret", "resignation", "defiance", "longing"] },
  ],
  traps: ["out-of-scope", "opposite", "too-narrow", "tone-mismatch"],
  workedExample: {
    passage:
      "In the poem, the speaker describes a cycle of eager expectation followed by rueful looking-back.",
    question: "Which quotation from the poem most effectively illustrates the claim?",
    options: [
      {
        t: "“Each new year comes with arms flung wide, / And each departs with head bowed low, / And still I meet the next one's stride / As though I did not know.”",
        correct: true,
      },
      {
        t: "“The snow has ceased its fluttering flight, / The wind sunk to a whisper light, / An ominous stillness fills the night.”",
        trap: "Atmospheric scene-setting. It establishes mood but shows neither expectation nor looking back.",
        trapType: "out-of-scope",
      },
      {
        t: "“I count my harvest, sheaf by sheaf, / And find the measure good and whole.”",
        trap: "This is satisfied stock-taking — the opposite of the rueful reflection the claim describes.",
        trapType: "opposite",
      },
      {
        t: "“The old year dies upon the hill.”",
        trap: "It gives the ending half of the cycle only, with no expectation to complete it. The claim needs both halves.",
        trapType: "too-narrow",
      },
    ],
    walkthrough: [
      {
        label: "Literal first",
        text: "The claim describes a repeating pattern: hope at the start of something, regret at the end, then hope again. Two halves plus repetition.",
      },
      {
        label: "Read by sentence",
        text: "In the keyed quotation the lines run on: 'Each new year comes with arms flung wide, and each departs with head bowed low, and still I meet the next one's stride as though I did not know.' One sentence, not four fragments.",
      },
      {
        label: "Track the feeling and the turn",
        text: "'Arms flung wide' = eager expectation. 'Head bowed low' = rueful. 'Still I meet the next one's stride' = the cycle repeating. All three beats of the claim.",
      },
      {
        label: "Proof, not association",
        text: "The snow-and-stillness quotation feels wistful, and wistfulness is adjacent to regret — but nothing in it points to expectation or hindsight. Mood is not evidence.",
      },
      {
        label: "Match the emotion",
        text: "The harvest quotation is about looking back, so it matches the topic — but the feeling is contentment, not regret. Topic match is the near-miss this type is built on.",
      },
    ],
  },
  practice: { gameTypes: ["read_the_green"], rtgDomains: ["literature"] },
  trainWith: [
    { href: "/rw/read-the-green", label: "Read the Green" },
    { href: "/rw/closer", label: "Closer" },
  ],
};
