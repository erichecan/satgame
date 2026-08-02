import type { Lesson } from "@/lib/lesson-types";

export const textStructurePurpose: Lesson = {
  slug: "text-structure-purpose",
  unit: 1,
  order: 1,
  title: "Text Structure and Purpose",
  blurb: "Purpose is not main idea. Ask what the author is DOING, not what the text is about.",
  domain: "craft_structure",
  stems: [
    "Which choice best states the main purpose of the text?",
    "Which choice best states the function of the underlined sentence in the text as a whole?",
  ],
  steps: [
    {
      title: "Ask what the author is doing, not what the text is about",
      detail:
        "Main idea = the content. Purpose = the job the writing performs. Two questions about the same passage can have very different answers.",
    },
    {
      title: "Read every option as verb + object",
      detail:
        "Purpose options are action phrases: to argue that…, to illustrate…, to trace…, to question…. Check the verb first; if the verb is wrong the rest doesn't matter.",
    },
    {
      title: "Weight the first sentence, the last sentence, and whatever follows the turn",
      detail:
        "The opening sets the topic and the ending usually lands the point. When 'however' or 'but' appears, the author's real position lives after it.",
    },
    {
      title: "For a function question, ask what the sentence does for its neighbors",
      detail:
        "Does it give an example of the claim before it? Concede a point? Set up the objection that follows? Its job is defined by the sentences around it, not by its own content.",
    },
    {
      title: "Match the strength of the verb to the tone",
      detail:
        "A neutral description is not an argument, and noting a problem is not proving one. Overstated verbs are the classic wrong answer here.",
    },
  ],
  signals: [
    { label: "Purpose verbs worth telling apart", items: ["describe", "argue", "illustrate", "trace", "compare", "critique", "propose", "question"] },
    { label: "The turn — the author's stance follows it", items: ["however", "but", "yet", "in fact", "still"] },
    { label: "Concession — this part is not the point", items: ["admittedly", "to be sure", "granted", "although"] },
  ],
  traps: ["too-narrow", "same-word", "too-extreme"],
  workedExample: {
    passage:
      "Museum labels have long been written for specialists, dense with terms most visitors never encounter elsewhere. Curator Adaeze Okoro has begun rewriting her gallery's labels in plain language. Attendance has not changed, but visitors now linger at individual works nearly twice as long — a shift Okoro attributes to labels that finally answer the questions people actually have.",
    question: "Which choice best states the main purpose of the text?",
    options: [
      {
        t: "To present a change one curator made and the effect it appears to have had",
        correct: true,
      },
      {
        t: "To explain why museum labels have traditionally been written for specialists",
        trap: "The passage states that labels were written for specialists but never explains why. It asks you to credit the text with something it never does.",
        trapType: "out-of-scope",
      },
      {
        t: "To prove that plain-language labels increase museum attendance",
        trap: "The passage says outright that attendance has not changed, so this reverses the text — and 'prove' is far stronger than 'attributes to' as well.",
        trapType: "opposite",
      },
      {
        t: "To describe how visitors linger at individual works in a gallery",
        trap: "It repeats a phrase from the passage without naming what the passage is doing with it.",
        trapType: "same-word",
      },
    ],
    walkthrough: [
      {
        label: "Doing, not about",
        text: "The passage is about museum labels. But what is it doing? It reports a change and what followed. Hold that before you read options.",
      },
      {
        label: "Read the options as verb + object",
        text: "Your candidate verbs are present, explain, prove, describe. Purpose here is reporting a change and its effect — 'present' fits; 'prove' claims far more than the passage does.",
      },
      {
        label: "Weight the ends and the turn",
        text: "The opening gives background; 'but visitors now linger…' is the turn, and the closing attributes the change to the new labels. The passage's weight sits after the turn.",
      },
      {
        label: "Check what the parts do",
        text: "Watch the verb closely. The passage states that labels were written for specialists; it never explains why they were. An option can name a real topic from the text and still describe something the text never does.",
      },
      {
        label: "Match the tone",
        text: "'Attributes to' is cautious. An option built on 'prove' overstates it, and it also contradicts the sentence saying attendance did not change.",
      },
    ],
  },
  practice: { quizDomains: ["craft_structure"] },
  trainWith: [
    { href: "/rw/trim", label: "Trim the Sentence" },
    { href: "/rw/read-the-green", label: "Read the Green" },
  ],
};
