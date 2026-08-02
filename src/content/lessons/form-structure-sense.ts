import type { Lesson } from "@/lib/lesson-types";

export const formStructureSense: Lesson = {
  slug: "form-structure-sense",
  unit: 4,
  order: 1,
  title: "Form, Structure, and Sense",
  blurb: "Same question stem as Boundaries — but here the options change the verb, the pronoun, or the word order.",
  domain: "expression_conventions",
  stems: ["Which choice completes the text so that it conforms to the conventions of Standard English?"],
  steps: [
    {
      title: "Look at what varies across the options",
      detail:
        "Verb forms changing? It's agreement or tense. Pronouns changing? It's reference. Word order changing? It's a modifier. The options tell you which rule is being tested.",
    },
    {
      title: "For agreement, strip the modifiers and find the real subject",
      detail:
        "Delete prepositional phrases and relative clauses. 'The box of rusted nails IS heavy' — the subject is box, not nails, and the phrase in between exists to hide that.",
    },
    {
      title: "For tense, find the time anchor in the sentence",
      detail:
        "'In 1892', 'currently', 'by the time she arrived' — the sentence always plants a marker. Match the verb to it instead of to what sounds normal.",
    },
    {
      title: "Every pronoun needs one clear antecedent, matched in number",
      detail:
        "If you cannot point at the exact noun a pronoun replaces, the option is wrong even if it reads smoothly.",
    },
    {
      title: "A modifier must sit next to what it modifies",
      detail:
        "When a sentence opens with a participial phrase, the noun right after the comma has to be the thing doing it. Otherwise the modifier dangles.",
    },
    {
      title: "If an option repeats information already given, cut it",
      detail:
        "Redundancy is tested here too. When several options say the same thing at different lengths, the shortest one that keeps the meaning wins.",
    },
  ],
  signals: [
    { label: "Words that force a singular verb", items: ["each", "every", "neither", "one of", "the number of"] },
    { label: "Time anchors that fix the tense", items: ["in 1892", "currently", "by the time", "since then", "next year"] },
    { label: "Openers that risk a dangling modifier", items: ["Having studied…", "Founded in…", "Walking home,…"] },
    { label: "Redundancy giveaways", items: ["annual… each year", "combined together", "returned back", "first began"] },
  ],
  traps: [],
  workedExample: {
    passage:
      "The collection of fossilized ferns that the museum acquired from three separate estates in 1974 ______ still the largest of its kind in the region.",
    question: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    options: [
      { t: "is", correct: true },
      {
        t: "are",
        trap: "'Are' agrees with ferns or estates — but those sit inside modifiers. The subject is 'collection', which is singular.",
      },
      {
        t: "were",
        trap: "Wrong number and wrong time: the sentence says 'still', anchoring it to the present.",
      },
      {
        t: "have been",
        trap: "'Have' doesn't agree with the singular subject 'collection'. The tense would be defensible — it is the number that fails.",
      },
    ],
    walkthrough: [
      {
        label: "What varies?",
        text: "is / are / were / have been — only the verb changes. So this is an agreement-and-tense question, not a punctuation one.",
      },
      {
        label: "Strip the modifiers",
        text: "Delete 'of fossilized ferns' and 'that the museum acquired from three separate estates in 1974'. What's left: 'The collection ______ still the largest of its kind.'",
      },
      {
        step: 1,
        label: "Find the subject",
        text: "'Collection' — singular. The plural nouns ferns and estates were placed between subject and verb precisely to pull you toward 'are'.",
      },
      {
        step: 2,
        label: "Find the time anchor",
        text: "'Still the largest' describes right now, so present tense. That eliminates 'were' even before number is considered.",
      },
      {
        step: 2,
        label: "Confirm",
        text: "Singular + present = 'is'. Note that 1974 is a decoy date: it belongs to the clause about acquiring, not to the main verb.",
      },
    ],
  },
  practice: { gameTypes: ["gate_run"], gateKinds: ["redundancy", "apostrophe"] },
  trainWith: [
    { href: "/rw/gate-run", label: "Gate Run" },
    { href: "/rw/trim", label: "Trim the Sentence" },
  ],
};
