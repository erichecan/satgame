import { useEffect, useState } from "react";

// 统一的题库加载 hook：按 gameType 拉取 GameItem，返回题目与加载态。
export function useGameItems<T extends { id: string }>(gameType: string, take?: number) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const q = take ? `&take=${take}` : "";
    fetch(`/api/game-items?gameType=${gameType}${q}`)
      .then((r) => r.json())
      .then((d) => {
        if (active) setItems((d.items ?? []) as T[]);
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [gameType, take]);

  return { items, loading };
}
