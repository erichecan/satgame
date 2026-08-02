import type { Lesson } from "@/lib/lesson-types";

export const humanitiesPassages: Lesson = {
  slug: "humanities-passages",
  unit: 5,
  order: 2,
  title: "Humanities Passages",
  blurb: "Art, music, film, philosophy. Find the one sentence that judges rather than describes.",
  domain: "humanities",
  stems: [
    "Which choice best states the main purpose of the text?",
    "As used in the text, what does the word … most nearly mean?",
    "Which choice best states the function of the underlined sentence in the text as a whole?",
  ],
  steps: [
    {
      title: "Locate the evaluative sentence",
      detail:
        "Humanities passages usually describe a work or a creator, and somewhere among the description sits one sentence that judges it. That sentence is almost always what the question is about.",
    },
    {
      title: "Separate description from judgment",
      detail:
        "'She recorded the album in a single take' is description. 'The result is unnervingly intimate' is judgment. Main-idea and purpose answers attach to the judgment.",
    },
    {
      title: "Read the adjectives as evidence, not decoration",
      detail:
        "In this subject area the writer's stance is carried almost entirely by word choice. Innovative, derivative, understated, labored — each one tells you where the author stands.",
    },
    {
      title: "Ignore who the artist is",
      detail:
        "You are not expected to know the work. Replace the name with 'this artist' and keep the relationships — who influenced whom, who broke from what.",
    },
    {
      title: "Watch for praise that comes with a reservation",
      detail:
        "Humanities writing loves the qualified compliment: admiring overall, with one hesitation. Answers that make the author purely enthusiastic or purely dismissive are usually overstatements.",
    },
  ],
  signals: [
    { label: "Approving evaluation", items: ["innovative", "assured", "deceptively simple", "understated", "revelatory"] },
    { label: "Disapproving evaluation", items: ["derivative", "labored", "overwrought", "thin", "mannered"] },
    { label: "The reservation is coming", items: ["yet", "still", "even so", "if at times", "for all its"] },
  ],
  traps: ["tone-mismatch", "too-extreme", "too-narrow"],
  workedExample: {
    passage:
      "Choreographer Rui Sasaki builds dances from ordinary gestures — reaching for a cup, checking a pocket — repeated until they lose their everyday meaning. Critics initially found the work monotonous. Yet audiences returning a second time report seeing structure everywhere: the repetition, for all its severity, is what makes the small variations legible at all.",
    question: "Which choice best states the main purpose of the text?",
    options: [
      {
        t: "To defend a choreographer's use of repetition by explaining what it makes possible",
        correct: true,
      },
      {
        t: "To catalog the ordinary gestures that appear in Sasaki's choreography",
        trap: "That is the opening description only, and the passage's weight falls after 'Yet'.",
        trapType: "too-narrow",
      },
      {
        t: "To argue that critics were correct to find Sasaki's work monotonous",
        trap: "'Yet' reverses that view — the passage introduces the criticism in order to answer it.",
        trapType: "tone-mismatch",
      },
      {
        t: "To establish Sasaki as the most inventive choreographer working today",
        trap: "The passage is appreciative but measured; it never ranks Sasaki against anyone, let alone everyone.",
        trapType: "too-extreme",
      },
    ],
    walkthrough: [
      {
        label: "Find the evaluative sentence",
        text: "'The repetition, for all its severity, is what makes the small variations legible at all.' Everything before it is setup for that judgment.",
      },
      {
        label: "Description vs judgment",
        text: "Reaching for a cup, checking a pocket — description. 'Monotonous' and 'legible at all' — judgments. The purpose attaches to the judgments.",
      },
      {
        label: "Read the adjectives",
        text: "'For all its severity' concedes the criticism while overruling it. That is a defense, not a neutral report and not a rave.",
      },
      {
        label: "Drop the name",
        text: "You've never seen this choreography, and you didn't need to. The relationship — critics said X, the passage answers with Y — is fully on the page.",
      },
      {
        label: "Mind the reservation",
        text: "'For all its severity' is the hesitation inside the praise. It's exactly why 'the most inventive choreographer working today' overshoots.",
      },
    ],
  },
  practice: { gameTypes: ["read_the_green"], rtgDomains: ["humanities"] },
  trainWith: [
    { href: "/rw/read-the-green", label: "Read the Green" },
    { href: "/vocab/connotation", label: "Connotation" },
  ],
};
