const CACHE = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function fallbackScore(guess: string, target: string) {
  const g = guess.toLowerCase().trim();
  const t = target.toLowerCase().trim();
  if (g === t) return { valid: true, match: true, score: 100, nudge: "" };
  return {
    valid: true,
    match: false,
    score: 5,
    nudge: "ANTHROPIC_API_KEY is not set; for now we can only tell whether you exactly matched the target word.",
  };
}

export async function POST(req: Request) {
  try {
    const { guess, target, pos } = (await req.json()) as {
      guess: string;
      target: string;
      pos: string;
    };

    if (!guess || !target) {
      return Response.json(
        { error: true, message: "Missing required field guess/target" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json(fallbackScore(guess, target));
    }

    const cacheKey = `${target}::${guess.toLowerCase().trim()}`;
    const cached = CACHE.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return Response.json(cached.data);
    }

    const system =
      'You are the scoring engine for a vocabulary game called "Closer". ' +
      `The secret target word is "${target}" (part of speech: ${pos}). ` +
      "The player sends one guessed English word. Rate how close their guess is to the " +
      "target in MEANING ONLY (semantic similarity), ignoring spelling.\n\n" +
      'Reply with ONLY a JSON object, no markdown and no extra text, with keys:\n' +
      '"valid": boolean — false only if the guess is not a real English word.\n' +
      '"match": boolean — true if the guess IS the target word, an obvious inflection of it ' +
      "(plural, tense, etc.), or a synonym so exact you would accept it as winning.\n" +
      '"score": integer 0-100 — semantic closeness. Use the full range: 100 = target or true ' +
      "synonym; 80-99 = very close in meaning; 55-79 = clearly related; 30-54 = same general " +
      "topic; 10-29 = faintly related; 0-9 = unrelated.\n" +
      '"nudge": string, max 9 words — a tiny clue about how the guess relates to the target\'s ' +
      "meaning. NEVER write the target word or any part of it.";

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        system,
        messages: [{ role: "user", content: guess }],
      }),
    });

    if (!res.ok) {
      console.error("[Anthropic API Error]", res.status, await res.text());
      return Response.json(fallbackScore(guess, target));
    }

    const data = await res.json();
    let text = (data.content || [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("")
      .trim();
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (match) text = match[0];
    const out = JSON.parse(text);

    if (out.nudge) {
      const re = new RegExp(target, "ig");
      out.nudge = out.nudge.replace(re, "———");
    }

    CACHE.set(cacheKey, { data: out, expires: Date.now() + CACHE_TTL_MS });
    return Response.json(out);
  } catch (error) {
    console.error("[API Route Error]", error);
    return Response.json(
      { error: true, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
