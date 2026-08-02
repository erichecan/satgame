import type { Lesson } from "@/lib/lesson-types";

export const crossTextConnections: Lesson = {
  slug: "cross-text-connections",
  unit: 1,
  order: 2,
  title: "Cross-Text Connections",
  blurb: "Two short texts, one relationship. Name the relationship before you read the options.",
  domain: "craft_structure",
  stems: [
    "Based on the texts, how would the author of Text 2 most likely respond to the claim in Text 1?",
    "Based on the texts, how would Cáceres and colleagues (Text 2) most likely describe the view presented in Text 1?",
  ],
  steps: [
    {
      title: "Reduce each text to one sentence: who claims what",
      detail:
        "Write Text 1 as 'X holds that…' and Text 2 as 'Y found/holds that…'. If you can't say both in one line each, you are not ready for the options.",
    },
    {
      title: "Name the relationship in plain words first",
      detail:
        "There are only a few: agrees, disagrees, agrees but needs a correction, changes the angle, or supplies evidence for it. Pick one before looking at answers.",
    },
    {
      title: "Anchor on Text 2's attitude",
      detail:
        "The question almost always asks what Text 2 would say about Text 1 — not the reverse. Text 2's stance words are the evidence you're being graded on.",
    },
    {
      title: "Check the strength word in each option",
      detail:
        "The keyed answer is usually the moderate one: 'largely correct but needs refinement'. Options that swing to 'entirely wrong' or 'fully confirmed' are how this type traps you.",
    },
  ],
  signals: [
    { label: "Text 2 pushing back", items: ["however", "contrary to", "in fact", "overlooks", "fails to account for"] },
    { label: "Text 2 refining rather than rejecting", items: ["complicates", "refines", "only under", "in some cases", "largely"] },
    { label: "Text 2 supporting", items: ["consistent with", "supports", "confirms", "as predicted"] },
  ],
  traps: ["too-extreme", "opposite", "out-of-scope"],
  workedExample: {
    passage:
      "Text 1: Ecologists have long held that isolated ponds lose species over time: with no route for new arrivals, local extinctions accumulate and diversity steadily falls.\n\nText 2: Verlaine and colleagues surveyed forty isolated ponds over a decade. Diversity did fall in the smallest ponds, as expected. In ponds above roughly one hectare, however, diversity held steady — birds, the team suspects, carry in enough new organisms to offset losses.",
    question:
      "Based on the texts, how would Verlaine and colleagues (Text 2) most likely describe the view presented in Text 1?",
    options: [
      {
        t: "It holds for small ponds but does not describe larger ones as well as had been assumed.",
        correct: true,
      },
      {
        t: "It is mistaken, since isolated ponds do not lose species over time.",
        trap: "Text 2 found that diversity did fall in the smallest ponds. Saying the view is simply mistaken reverses half of their own findings.",
        trapType: "opposite",
      },
      {
        t: "It is entirely unsupported by any field evidence collected to date.",
        trap: "'Entirely unsupported' is far stronger than anything Text 2 says — their small-pond data actually supports Text 1.",
        trapType: "too-extreme",
      },
      {
        t: "It underestimates how quickly birds are declining in wetland habitats.",
        trap: "Bird decline is never mentioned in either text. Birds appear only as a proposed mechanism for carrying species in.",
        trapType: "out-of-scope",
      },
    ],
    walkthrough: [
      {
        label: "One sentence each",
        text: "Text 1: isolated ponds steadily lose diversity. Text 2: true for small ponds, but not for ponds over about a hectare.",
      },
      {
        label: "Name the relationship",
        text: "Not agreement, not rejection — it's 'right in part, needs a limit put on it.' That prediction is your yardstick.",
      },
      {
        label: "Anchor on Text 2",
        text: "The stance words are 'as expected' (agreeing) and 'however… held steady' (limiting). Both halves must survive in the answer.",
      },
      {
        label: "Check the strength words",
        text: "'Mistaken' and 'entirely unsupported' each throw away the half of Text 2 that agrees with Text 1. The moderate option — holds for small ponds, not for larger — is the only one that keeps both halves.",
      },
    ],
  },
  practice: {},
  trainWith: [{ href: "/rw/paraphrase", label: "Paraphrase Match" }],
};
