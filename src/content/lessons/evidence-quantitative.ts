import type { Lesson } from "@/lib/lesson-types";

export const evidenceQuantitative: Lesson = {
  slug: "evidence-quantitative",
  unit: 2,
  order: 2,
  title: "Command of Evidence — Quantitative",
  blurb: "Charts with words attached. No arithmetic required — but the claim's strength word decides everything.",
  domain: "info_ideas",
  stems: [
    "Which choice most effectively uses data from the table to complete the example?",
    "Which choice most effectively uses data from the graph to complete the text?",
  ],
  steps: [
    {
      title: "Read the question and the sentence with the blank first — before the chart",
      detail:
        "You need to know what is being claimed before data can mean anything. Reading the chart cold wastes the seconds this question type gives you.",
    },
    {
      title: "Read the chart's furniture: title, axis labels, units, legend",
      detail:
        "Misreading the unit is the most expensive mistake here. Note whether you're looking at percentages, counts, or a rate before you read a single bar.",
    },
    {
      title: "Say the pattern in your own words",
      detail:
        "'Falls every year.' 'Teens far higher than everyone else.' 'Two groups nearly identical.' One plain sentence, before options.",
    },
    {
      title: "Match the strength of the claim to the strength of the data",
      detail:
        "If the sentence says 'varied widely', the answer needs a big gap — not merely two different numbers. This is the difference between a right and a nearly-right option.",
    },
    {
      title: "Check every number in the option against the chart",
      detail:
        "Wrong answers often quote real numbers attached to the wrong category. Verify the value AND the label it belongs to. No calculation is ever needed.",
    },
  ],
  signals: [
    { label: "Claim strength words — they set the bar", items: ["varied widely", "nearly identical", "the most", "the least", "more than double", "steadily"] },
    { label: "Graphics the SAT uses", items: ["tables", "bar graphs", "line graphs"] },
    { label: "What is never required", items: ["calculations", "outside knowledge", "a calculator"] },
  ],
  traps: ["opposite", "fictitious-comparison", "out-of-scope", "too-narrow"],
  workedExample: {
    chart: {
      title: "Participants who said a robot could do the job well",
      unit: "percent",
      bars: [
        { label: "Tour guide", value: 82 },
        { label: "Truck driver", value: 61 },
        { label: "Nurse", value: 28 },
        { label: "Surgeon", value: 16 },
      ],
    },
    passage:
      "Researchers asked participants to judge whether a robot could perform various jobs well. Confidence varied widely depending on which occupation was being considered; for example, ______",
    question: "Which choice most effectively uses data from the graph to complete the example?",
    options: [
      {
        t: "82% of participants said a robot could work well as a tour guide, but only 16% said the same of a surgeon.",
        correct: true,
      },
      {
        t: "28% of participants said a robot could work well as a nurse, while 16% said the same of a surgeon.",
        trap: "Both numbers are correct, but 28% and 16% are close together — that illustrates similarity, not the 'varied widely' the sentence claims.",
        trapType: "too-narrow",
      },
      {
        t: "Participants were more confident about surgeons than about tour guides.",
        trap: "The graph shows the reverse: tour guide 82%, surgeon 16%.",
        trapType: "opposite",
      },
      {
        t: "Participants were more confident about robot truck drivers than about human truck drivers.",
        trap: "The graph never compares robots with humans. That comparison is invented.",
        trapType: "fictitious-comparison",
      },
    ],
    walkthrough: [
      {
        label: "Question and sentence first",
        text: "The blank has to finish 'Confidence varied widely… for example, ___'. So you are hunting for an example of a WIDE gap.",
      },
      {
        label: "Read the furniture",
        text: "Title: participants who said a robot could do the job well. Unit: percent. Four occupations, ranging from 82 down to 16.",
      },
      {
        label: "Name the pattern",
        text: "Plain words: 'People trust robots with tour-guiding, not with surgery.' That's an 82-to-16 spread — a wide one.",
      },
      {
        label: "Match the strength word",
        text: "'Varied widely' is the whole test. The nurse-vs-surgeon option is factually accurate but a 12-point gap doesn't illustrate 'widely' — that's why it fails even though nothing in it is false.",
      },
      {
        label: "Verify numbers and labels",
        text: "Check 82 belongs to tour guide and 16 to surgeon — they do. The 'more confident about surgeons' option flips the direction, and the truck-driver option compares against humans, who never appear in the graph.",
      },
    ],
  },
  practice: { gameTypes: ["graphic"] },
  trainWith: [{ href: "/rw/graphic", label: "Graphic" }],
};
