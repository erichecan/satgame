# Game content batch — output schema (READ THIS FIRST)

You are generating content for a real SAT-prep app used by an actual 15-year-old ESL student. Quality, correctness, and **variety** matter — do not produce repetitive, templated items.

## Source words (for games that link to vocabulary)

`/Volumes/datacenter/04-eric/AIcoding/satgame/prisma/content/words-export.json` is an array of 1544 real SAT words already in the app database: `{ word, definitionEn, partOfSpeech, definitionCn, exampleEn, synonymGroup, tier, rank }`. When a game links to vocabulary, every linked word MUST exist in this file (exact spelling, case-insensitive OK) — the app connects game content to the words the student studied, and that only works for words in the database.

## Every batch file

Write valid JSON to your assigned path:
```json
{ "items": [ <item>, <item>, ... ] }
```
Each `<item>`:
```json
{
  "gameType": "<one of: clusters | closer | read_the_green | gate_run | dissector>",
  "domain": "<see per-game>",
  "difficulty": 2,
  "payload": { <game-specific, see below> },
  "explanation": "<string or null>",
  "words": [ "<DB word strings this item links to, exact spelling>" ]
}
```

## Answer-position rule (applies to any game with a fixed correct choice)

Distribute the correct-answer position **evenly** across all slots — never always position 0. After generating, count the distribution yourself and reshuffle option order until it is roughly even. This is a hard requirement; a previous run shipped 100%-position-0 content and it was a defect.

---

## clusters  (domain: `craft_structure`)
16 words sorted into 4 themed groups of 4. Some words should look like they could belong to another group (the trap).
```json
"payload": {
  "groups": [
    { "theme": "Praise", "words": [
      { "word": "laud", "gloss": "praise highly" },
      { "word": "extol", "gloss": "praise enthusiastically" },
      { "word": "commend", "gloss": "praise formally" },
      { "word": "applaud", "gloss": "express approval" }
    ] }
    // exactly 4 groups, exactly 4 words each
  ]
}
```
`words` (item level) = all 16 word strings. No word repeated within a puzzle. Vary themes across puzzles (don't reuse the same 4 themes). Make ~1/3 of puzzles deliberately tricky (set `explanation` to note the trap).

## closer  (domain: `words_in_context`)
One target word; a context sentence with the word blanked as `{word}`.
```json
"payload": {
  "word": "meticulous",
  "def": "Showing great, careful attention to detail.",
  "pos": "adjective",
  "ex": "His {word} lab notes recorded every measurement twice."
}
```
`ex` MUST contain the literal `{word}` exactly once and must NOT spell the word out. Write a fresh self-contained sentence with real context clues (don't just copy the file's exampleEn). `words` = [the target word]. One item per assigned word; every word used exactly once.

## read_the_green  (domain: `info_ideas`)
A 4-5 sentence passage + a main-idea/purpose/evidence question with 4 options; identify the evidence sentence.
```json
"payload": {
  "sentences": ["...", "...", "...", "..."],
  "question": "What is the main point of the passage?",
  "options": [
    { "t": "Correct answer text.", "correct": true },
    { "t": "Wrong option.", "trap": "why it's wrong (opposite/too narrow/not stated/...)" },
    { "t": "Wrong option.", "trap": "..." },
    { "t": "Wrong option.", "trap": "..." }
  ],
  "evidenceIndex": 3,
  "evidenceWhy": "why that sentence is the best support"
}
```
Exactly 4 options, exactly ONE `correct:true`, other 3 carry a `trap` string. `evidenceIndex` = 0-based index into `sentences`. Embed 2-4 DB words naturally in each passage; `words` = those words. Passages must feel like real SAT excerpts (argument, finding, contrast, narrative shift) — not trivia. Apply the answer-position rule.

## gate_run  (domain: `expression_conventions`)
`before [gap] after` with 2 "doors"; pick the correct one.
```json
"payload": {
  "kind": "punctuation" | "transition",
  "before": "She was exhausted",
  "after": "she kept running.",
  "doors": [",", ";"],
  "correctIndex": 1,
  "why": "Two complete sentences — a comma splices them, use a semicolon."
}
```
- `punctuation`: doors are punctuation marks (comma/semicolon/colon/dash/period). `words` = [].
- `transition`: doors are transition words; the CORRECT door word MUST be a DB word (lowercased in `words`, e.g. `["however"]`). Vary the logical relation (contrast/cause/addition/example/sequence).
Exactly 2 doors; `correctIndex` 0 or 1. Split correctIndex ~50/50 across your batch (answer-position rule). Vary the rules — don't make them all semicolons.

## dissector  (domain: `math`)  — `words` always `[]`
Bilingual (en/zh) SAT math word problem with staged decomposition. **Every answer must be mathematically verified.**
```json
"payload": {
  "textEn": "...", "textZh": "...",
  "ask":  [ {"en":"...","zh":"...","correct":true}, {"en":"...","zh":"..."}, {"en":"...","zh":"..."}, {"en":"...","zh":"..."} ],
  "tool": [ {"en":"...","zh":"...","correct":true}, {"en":"...","zh":"..."}, {"en":"...","zh":"..."}, {"en":"...","zh":"..."} ],
  "cueEn": "...", "cueZh": "...",
  "steps": [ {"en":"...","zh":"..."}, {"en":"...","zh":"..."} ],
  "turns": 2,
  "workEn": "40 × 1.25 = 50\n50 × 0.90 = 45", "workZh": "...",
  "answerEn": "$45", "answerZh": "$45"
}
```
`ask` and `tool` each = exactly 4 options with exactly one `correct:true`. `turns` = number of `steps`. Spread topics across SAT math domains: Algebra (linear, systems), Advanced Math (quadratics, functions, exponentials), Problem-Solving & Data Analysis (percent, ratio, rate, statistics), Geometry/Trig. Re-verify every computation. Apply the answer-position rule to both `ask` and `tool`.

---

## Before finishing every batch
Self-validate: valid JSON; correct item count; per-item schema correct; exactly one correct option where required; linked words exist in words-export.json; answer-position distribution even. Fix issues. Report counts + position distribution + confirmation words were found.
