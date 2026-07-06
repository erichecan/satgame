export type ProgressResult = "correct" | "incorrect";

// 统一的进度上报：写 Progress + XP + 标记今日已玩该游戏（服务端 markGamePlayed）。
// fire-and-forget：失败不阻塞答题 UI。
export function recordProgress(input: {
  gameType: string;
  skill: string;
  itemId?: string;
  wordId?: string;
  result: ProgressResult;
  errorTag?: string; // 选错时掉进的陷阱类型(trapType),用于错误 DNA
}): Promise<void> {
  return fetch("/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
    .then(() => undefined)
    .catch(() => undefined);
}
