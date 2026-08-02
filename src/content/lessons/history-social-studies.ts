import type { Lesson } from "@/lib/lesson-types";

export const historySocialStudies: Lesson = {
  slug: "history-social-studies",
  unit: 5,
  order: 1,
  title: "History & Social Studies Passages",
  blurb: "Older language, long sentences, founding documents. Translate to plain English before you answer anything.",
  domain: "history_social_science",
  stems: [
    "Which choice best states the main purpose of the text?",
    "Based on the text, how would the author most likely characterize …?",
    "Which quotation most effectively illustrates the claim?",
  ],
  steps: [
    {
      title: "Identify whose voice you are reading",
      detail:
        "A participant writing at the time, or a historian analyzing it afterwards? The first argues a position; the second evaluates one. Questions about attitude depend on which you have.",
    },
    {
      title: "Translate archaic wording into plain modern English, one sentence at a time",
      detail:
        "This is the real work. 'It is not to be doubted that…' simply means 'certainly'. Do the translation first — then answer the question against your translation, not the original.",
    },
    {
      title: "Find the subject and the main verb in long, inverted sentences",
      detail:
        "Nineteenth-century sentences bury the core under clauses. Strip the modifiers and the sentence usually turns out to be short and simple.",
    },
    {
      title: "Track the argument's three positions: claim, concession, rebuttal",
      detail:
        "Most historical arguments run: here is my position, here is what my opponents say, here is why they're wrong. Knowing which sentence is the concession stops you attributing it to the author.",
    },
    {
      title: "Attitude questions ask about the author, not the people quoted",
      detail:
        "A writer can quote a view at length in order to reject it. The stance you are graded on belongs to whoever is holding the pen.",
    },
  ],
  signals: [
    { label: "Concession — this is NOT the author's position", items: ["admittedly", "to be sure", "it is often said", "granted", "some maintain"] },
    { label: "Archaic hedges and intensifiers", items: ["notwithstanding", "albeit", "hitherto", "insofar as", "it is not to be doubted"] },
    { label: "Advocacy — the author's own stance", items: ["ought", "must", "it is the duty of", "I contend", "let it be remembered"] },
    { label: "Later analysis, not testimony", items: ["historians argue", "recent scholarship", "in retrospect"] },
  ],
  traps: ["tone-mismatch", "same-word", "out-of-scope"],
  workedExample: {
    passage:
      "From an 1854 address: “It is urged, and with no small show of reason, that the labourer who cannot read is yet able to labour, and that the expense of schooling him is therefore an expense ill bestowed. Notwithstanding, I hold that a people kept from letters are kept also from the means of judging those who govern them; and a republic so constituted is a republic in name only.”",
    question: "Which choice best states the main purpose of the text?",
    options: [
      {
        t: "To answer an objection to public schooling by tying literacy to a citizen's ability to judge those in power",
        correct: true,
      },
      {
        t: "To argue that the expense of schooling labourers is money poorly spent",
        trap: "That is the objection the speaker introduces in order to reject it — 'It is urged…' marks a concession, not the author's view.",
        trapType: "tone-mismatch",
      },
      {
        t: "To describe how labourers who cannot read are still able to labour",
        trap: "It repeats a clause from the passage without capturing what the speaker is doing with it.",
        trapType: "same-word",
      },
      {
        t: "To propose a specific tax for funding schools in rural districts",
        trap: "No funding mechanism appears anywhere in the passage. Imported from general knowledge about 19th-century school debates.",
        trapType: "out-of-scope",
      },
    ],
    walkthrough: [
      {
        label: "Whose voice?",
        text: "An 1854 address — a participant arguing a position, not a historian describing one. So the passage has a side.",
      },
      {
        label: "Translate it",
        text: "Plain English: 'People say, fairly enough, that an illiterate worker can still work, so schooling him wastes money. Even so, I say a people kept from reading can't judge their rulers — and then a republic is a republic in name only.'",
      },
      {
        label: "Find the core of the long sentence",
        text: "Strip the second sentence down: 'I hold that a people kept from letters are kept from the means of judging those who govern them.' Subject, verb, claim.",
      },
      {
        label: "Locate claim, concession, rebuttal",
        text: "'It is urged…' = the objection (concession). 'Notwithstanding, I hold…' = the rebuttal, which is the author's own position. The purpose lives in the rebuttal.",
      },
      {
        label: "Attitude belongs to the writer",
        text: "The 'schooling is money poorly spent' option is a genuine view in the passage — just not the speaker's. That is precisely the trap this passage type sets.",
      },
    ],
  },
  practice: { gameTypes: ["read_the_green"], rtgDomains: ["history_social_science"] },
  trainWith: [
    { href: "/rw/trim", label: "Trim the Sentence" },
    { href: "/rw/read-the-green", label: "Read the Green" },
  ],
};
