import type { Lesson } from "@/lib/lesson-types";

export const wordsInContext: Lesson = {
  slug: "words-in-context",
  unit: 1,
  order: 0,
  title: "Words in Context",
  blurb: "How to get these right when you don't know the word — the context does the work, not your memory.",
  domain: "words_in_context",
  stems: [
    "As used in the text, what does the word “quality” most nearly mean?",
    "Which choice completes the text with the most logical and precise word or phrase?",
  ],
  steps: [
    {
      title: "Cover the options and read the whole sentence",
      detail:
        "The four options exist to pull you toward a word's most common meaning. Read the sentence with the word blanked out before you let them near you.",
    },
    {
      title: "Put your own plain word in the blank",
      detail:
        "Ordinary language is fine — 'made bigger', 'not sure', 'held back'. If you can say the idea in kid words, you already know the answer; you just have to recognize it.",
    },
    {
      title: "Fix the direction before the meaning",
      detail:
        "Is the blank positive, negative, or neutral? Strong or mild? Direction is cheap to get and usually kills two options on its own.",
    },
    {
      title: "Find which structural clue the sentence is using",
      detail:
        "There are only four: contrast, example, cause-and-effect, and restatement. Name the one in play and the direction is settled.",
    },
    {
      title: "Test each option back inside the sentence",
      detail:
        "The SAT loves the secondary meaning of a familiar word — quality, novel, sound, address, appreciate. 'I know this word' is the trap, not the shortcut.",
    },
  ],
  signals: [
    { label: "Contrast → flip the direction", items: ["but", "however", "yet", "although", "unlike", "whereas", "rather than", "in contrast"] },
    { label: "Example → the example defines it", items: ["for example", "for instance", "such as", "including", "a colon"] },
    { label: "Cause and effect", items: ["because", "since", "therefore", "thus", "as a result", "consequently"] },
    { label: "Restatement → same direction", items: ["and", "similarly", "likewise", "a semicolon", "an em dash"] },
  ],
  traps: ["same-word", "tone-mismatch", "too-extreme", "opposite"],
  workedExample: {
    passage:
      "Reviewers had expected the composer's new symphony to be as ornate as her earlier work. Instead, they found it remarkably ______: a single melodic line, one instrument at a time, with almost nothing layered on top.",
    question: "Which choice completes the text with the most logical and precise word or phrase?",
    options: [
      { t: "spare", correct: true },
      {
        t: "ornate",
        trap: "This is the word the sentence is contrasting against. 'Instead' tells you the new work is the opposite of ornate.",
        trapType: "opposite",
      },
      {
        t: "careless",
        trap: "Right direction (less is happening) but wrong tone — 'careless' is a criticism, and the passage is describing a deliberate style, not a failure.",
        trapType: "tone-mismatch",
      },
      {
        t: "worthless",
        trap: "Far too strong. Nothing in the passage says the reviewers judged the symphony to have no value.",
        trapType: "too-extreme",
      },
    ],
    walkthrough: [
      {
        label: "Cover the options",
        text: "Read it as: 'They had expected it to be ornate. Instead, they found it remarkably ______: one melodic line, one instrument, nothing layered on top.'",
      },
      {
        label: "Say it in your own words",
        text: "Your plain version: 'stripped down', 'bare', 'simple'. That is your yardstick before any option touches you.",
      },
      {
        label: "Fix the direction",
        text: "Direction is 'less, not more' — and it is neutral-to-approving, since the colon explains the style rather than complaining about it.",
      },
      {
        label: "Name the clue",
        text: "'Instead' plus the colon: this is contrast (reverse of ornate) followed by restatement (the colon spells out what the word means).",
      },
      {
        label: "Test the options",
        text: "'Spare' means stripped to essentials — it matches both the direction and the neutral tone. 'Ornate' is the reverse, 'careless' flips the tone into criticism, and 'worthless' overstates. Notice you never needed to already know 'spare' — the colon defined it for you.",
      },
    ],
  },
  practice: { quizDomains: ["words_in_context"] },
  trainWith: [
    { href: "/rw/closer", label: "Closer" },
    { href: "/vocab/morphology", label: "Morphology" },
    { href: "/vocab/connotation", label: "Connotation" },
  ],
};
