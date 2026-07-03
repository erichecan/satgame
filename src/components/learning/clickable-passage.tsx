import { WordChip } from "@/components/learning/word-chip";

export function ClickablePassage({ text, sourceGame }: { text: string; sourceGame?: string }) {
  const tokens = text.split(/(\b[a-zA-Z']+\b)/g);
  return (
    <>
      {tokens.map((token, i) =>
        /^[a-zA-Z']+$/.test(token) ? (
          <WordChip key={i} word={token} sourceGame={sourceGame} />
        ) : (
          <span key={i}>{token}</span>
        )
      )}
    </>
  );
}
