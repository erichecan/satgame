// Method-card content library: the "learn the method, then practice" reminders for each reading/vocab game.
export type Method = { title: string; points: string[] };

export const METHODS = {
  detailFourStep: {
    title: "Detail questions: 4 steps",
    points: [
      "Read the question first and decide what it's actually asking.",
      "Pull the concrete keywords out of the question (names, places, conditions)—they're your coordinates for going back to the passage.",
      "Locate the sentence where those keywords appear; the answer is hiding nearby.",
      "The right answer restates the passage in different words (same idea, different words); an option that copies the passage's wording is usually a trap.",
    ],
  },
  trapTaxonomy: {
    title: "The fixed playbook of distractors",
    points: [
      "SAT wrong answers almost always fall into a few types: repeats-wording / opposite / not-stated / too-narrow / too-extreme / false-comparison / doesn't-follow / wrong-tone.",
      "The two nastiest: too-extreme (will/all/never) and false comparison (inventing an A-beats-B the passage never made)—this is the 1500→1550 divide.",
      "Recognizing the pattern beats going with a gut feeling about which one 'seems right.'",
    ],
  },
  paraphrase: {
    title: "The paraphrase principle",
    points: [
      "SAT's correct answer almost never copies the passage's wording—it says the same idea a different way (same idea, different words).",
      "An option that uses the exact words of the sentence should raise a flag: it often drops the original words in while quietly swapping the meaning.",
      "Check each option: has the meaning been widened, narrowed, reversed, or has information the passage never gave been added?",
    ],
  },
  trim: {
    title: "Trimming a long sentence",
    points: [
      "Find the subject and its main verb first—that's the skeleton of the sentence.",
      "Relative clauses, asides, prepositional phrases, and adverbials are mostly modifiers; deleting them doesn't change the core meaning.",
      "A long sentence is often half deletable modifiers; keep the skeleton and the sentence reads instantly.",
    ],
  },
  contextClue: {
    title: "Guessing meaning from context",
    points: [
      "Don't rush to look up a new word—first read the whole sentence it sits in.",
      "Hunt for clues: contrast words, examples, cause-and-effect, and words placed in parallel with it all hint at its meaning.",
      "Guess a rough direction first (positive/negative, strong/weak), then narrow toward the precise sense.",
    ],
  },
  inference: {
    title: "Inference: find the author's purpose",
    points: [
      "Inference questions ask for the 'most logical completion'—first ask: what is the author's purpose (exigence) in writing this?",
      "An inference is what the passage does NOT state outright; any option that just repeats the passage's own words can't be the inference.",
      "Rule out the usual traps: too-extreme, opposite, off-topic, doesn't-follow.",
    ],
  },
  graphic: {
    title: "Graphic questions: 4 steps",
    points: [
      "Read the question first (don't dive straight into the chart)—know what you're looking for.",
      "Read the blurb for the claim / conclusion (not the experiment's steps).",
      "Read the chart: what the title, axes, and legend mean, and find the trend (rising/falling/contrast).",
      "Eliminate from A to D; if the question says 'varied widely,' pick the one showing a big difference, not just 'different.'",
    ],
  },
  mainPurpose: {
    title: "Main-purpose questions",
    points: [
      "It asks for the 'purpose,' not the 'main idea'; the options are all 'verb + object' action phrases.",
      "Skim the whole thing but focus on the first sentence (topic) and the last; after but/however the second half matters, and the part between em-dashes can be skipped.",
      "Fix the passage's tone first; the right answer matches that tone but in different words.",
    ],
  },
  ssatReading: {
    title: "SSAT reading: one minute per question",
    points: [
      "There's no time to read word for word—put your effort into understanding the question, not the whole passage.",
      "Passage only: rule out any option the passage doesn't mention; don't use outside knowledge and don't assume.",
      "Title questions and author's-view questions are, at heart, all testing the main idea.",
    ],
  },
  morphology: {
    title: "Breaking a word down",
    points: [
      "Prefix + root give the meaning; the suffix gives the part of speech.",
      "Longer words are easier to break apart—short words are the nightmare (memorize those by association: mar↔war = to damage).",
      "After breaking it up, judge the whole word's tone—an in-/un- start can still be positive (incontrovertible = certain).",
    ],
  },
  connotation: {
    title: "Positive / negative shading",
    points: [
      "Tag every word +/−/neutral—don't just memorize a definition.",
      "Connotation drifts with context—the same word can lean differently in different sentences.",
      "Tell synonyms apart by their fine shades (discern = notice a subtle difference vs detect = involves analysis).",
    ],
  },
} satisfies Record<string, Method>;
