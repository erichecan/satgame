import type { Lesson } from "@/lib/lesson-types";

export const rhetoricalSynthesis: Lesson = {
  slug: "rhetorical-synthesis",
  unit: 3,
  order: 1,
  title: "Rhetorical Synthesis",
  blurb: "Bullet notes plus a stated goal. All four options are true — only one does the job.",
  domain: "expression_conventions",
  stems: [
    "The student wants to emphasize a similarity between the two works. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
    "The student wants to introduce the study to an audience unfamiliar with it. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
  ],
  steps: [
    {
      title: "Read the goal sentence first and underline the goal verb",
      detail:
        "Emphasize a similarity? A difference? Introduce? Explain? The goal verb is the entire grading rubric for this question.",
    },
    {
      title: "Ignore the notes until the goal is fixed in your head",
      detail:
        "The bullets are a supply cupboard, not a summary. Reading them first makes every option look usable.",
    },
    {
      title: "Judge each option against the goal only",
      detail:
        "All four options are normally accurate statements drawn from the notes. Accuracy is not the test — task completion is.",
    },
    {
      title: "Check that the sentence structurally performs the goal",
      detail:
        "A 'similarity' goal needs the two items joined by a similarity marker — both, like, share. A 'contrast' goal needs however or whereas. Fluent grammar alone does not complete the task.",
    },
    {
      title: "Reject anything that adds information not in the notes",
      detail:
        "The sentence has to be built from the supplied bullets. Invented detail fails even when it reads beautifully.",
    },
  ],
  signals: [
    { label: "Goal verbs to underline", items: ["emphasize", "introduce", "explain", "compare", "contrast", "describe", "specify"] },
    { label: "Markers that perform 'similarity'", items: ["both", "like", "similarly", "share", "as with"] },
    { label: "Markers that perform 'contrast'", items: ["however", "whereas", "unlike", "by contrast"] },
  ],
  traps: ["too-narrow", "opposite", "out-of-scope"],
  workedExample: {
    passage:
      "While researching two sculptures, a student took these notes:\n• Erasure (2008) is built from discarded audiocassette tapes and magnets.\n• Home Grown (2009) is built from pushpins, plastic plates and forks, and wood.\n• Both sculptures were assembled entirely from objects the artist collected secondhand.\n• Erasure hangs from the ceiling; Home Grown rests on the floor.\n\nThe student wants to emphasize a similarity between the two works.",
    question: "Which choice most effectively uses relevant information from the notes to accomplish this goal?",
    options: [
      {
        t: "Like Erasure (2008), Home Grown (2009) was assembled entirely from secondhand objects the artist collected.",
        correct: true,
      },
      {
        t: "Erasure (2008) uses audiocassette tapes and magnets; Home Grown (2009), however, uses pushpins, plastic plates and forks, and wood.",
        trap: "Accurate, and drawn from the notes — but 'however' performs a contrast. It does the opposite of the stated goal.",
        trapType: "opposite",
      },
      {
        t: "Erasure (2008) is built from discarded audiocassette tapes and magnets.",
        trap: "It describes one sculpture only. A similarity needs both works in the sentence.",
        trapType: "too-narrow",
      },
      {
        t: "Both sculptures reflect the artist's lifelong concern with environmental waste.",
        trap: "It does emphasize a similarity, but the notes never mention environmental concern — the idea is imported from outside.",
        trapType: "out-of-scope",
      },
    ],
    walkthrough: [
      {
        label: "Underline the goal verb",
        text: "'Emphasize a SIMILARITY between the two works.' Write that down. Every option now gets judged against those four words.",
      },
      {
        label: "Hold off on the notes",
        text: "Only now read the bullets. Notice that one of them — 'both assembled entirely from secondhand objects' — is itself a similarity. That is the material you want.",
      },
      {
        label: "All four are true",
        text: "Every option restates something from the notes accurately. So accuracy cannot separate them; only the goal can.",
      },
      {
        label: "Does the structure perform the goal?",
        text: "'Like Erasure…, Home Grown…' joins the two works with a similarity marker. The 'however' option joins them with a contrast marker, which fails the task no matter how true it is.",
      },
      {
        label: "Nothing invented",
        text: "'Environmental waste' sounds like a sophisticated similarity, but no bullet says it. Built from the notes is a hard requirement.",
      },
    ],
  },
  practice: {},
  trainWith: [{ href: "/rw/trim", label: "Trim the Sentence" }],
};
