# DEV-PLAN — SAT 阅读方法论落地(A→E)

> 输入来源:Kate Language《SAT 基础班 Foundation 第一课》视频总结(2026-07-03 归档)。
> 上阶段 MVP(5 游戏)计划已归档于 `docs/20260703-DEV-PLAN-mvp-5games.md`。
> 内容策略:**按 SAT 阅读通用方法论补全**,不局限于该视频单课;遵循已有 content-generation-standards 记忆(多样化、SAT-authentic、选项位置不偏、链接 DB 词)。
> 规模判定:**大改(BIG)** — 新增 2 个游戏页 + 改 3 个现有页 + 内容生成 + 首页与每日任务逻辑调整,远超 5 文件。

---

## 0. 方法论 → 可训练动作(设计总纲)

视频与 SAT 阅读公认解题框架,拆成 app 里能单独练的"动作":

| 方法论动作 | 落地方式 | 方向 |
|---|---|---|
| 基于证据(答案回原文找句) | 已有,强化 | A |
| 细节题四步:读题→抓关键词→回原文定位→匹配选项 | 引导层 | A |
| 正确答案=同义改写,陷阱=同词偷换 | 独立游戏 | B |
| 长难句拆主干 | 独立游戏 | C |
| 生词靠上下文推断(context clues) | 升级 Closer | D |
| 先教方法再练(主动阅读) | 方法卡教学层 | E |

**架构基石(降低风险)**:`GameItem` 用 `gameType:String + payload:Json`,新增游戏只需新 `gameType` 值 + 新 payload 结构,**无需 Prisma 迁移**;`GET /api/game-items` 已支持任意 gameType,直接复用。

---

## A. 强化 Read the Green:细节题四步法引导层 【改现有】

- **理由**:已实现"答案+证据"两段式,只差把"抓关键词、回原文定位、识别同词陷阱"显性化。改动小、当天见效。
- **玩法增量**:
  1. 答题前先让用户点出**题干关键词**(人名/地点/条件词),再解锁选项。
  2. 证据阶段常驻规则提示:*正确答案是原文的换词说法,不是原词*。
  3. 复盘对每个错误选项标注 `trapType`:`same-word`(同词陷阱)/ `wrong-logic`(逻辑不符)/ `out-of-scope`(过度推断)。
- **payload 扩展(向后兼容,旧数据无字段时降级为现玩法)**:
  ```
  { sentences, question, options:[{t, correct, trap, trapType}],
    evidenceIndex, evidenceWhy, keywords:string[] }
  ```
- **文件**:`src/app/rw/read-the-green/page.tsx`;内容回填 `keywords` / `trapType`。

## B. 新增 Paraphrase Match:同义改写配对 【新游戏】

- **理由**:视频最核心一课——正确答案≠原词而是同义改写;SAT 阅读通用底层技能,值得独立成游戏反哺所有阅读题。
- **玩法**:给一句原文,四选一,选出正确的**同义改写**;3 个干扰项为"用了原词但意思被偷换/扩大/反转"。
- **gameType**:`paraphrase`;**skill**:`info_ideas`。
- **payload**:`{ source:string, options:[{t, correct, why}], sourceWords?:string[] }`
- **文件**:新增 `src/app/rw/paraphrase/page.tsx` + seed 内容。

## C. 新增 Trim the Sentence:长难句拆主干 【新游戏】

- **理由**:视频 5:15"先找主干,约一半可删";长难句速读硬技能,现完全缺失。
- **玩法**:给一个 SAT 长难句,用户点掉修饰成分(定语从句、插入语、状语),只留主谓宾;校验保留主干是否正确。
- **gameType**:`trim`;**skill**:`craft_structure`。
- **payload**:`{ tokens:[{text, core:boolean}], gloss:string }`(core=true 为主干需保留)。
- **文件**:新增 `src/app/rw/trim/page.tsx` + seed 内容。

## D. 升级 Closer:从"语义猜词"到"上下文猜义" 【改现有】

- **理由**:视频讲生词处理靠上下文推断,现 Closer 句子只是配角。让句子承载线索,复盘点明"哪些词提供了线索"。
- **payload 扩展**:现 `{ word, pos, def, ex }` → 追加 `contextClues:string[]`(揭晓时高亮线索词)。
- **文件**:`src/app/rw/closer/page.tsx`;内容补线索词。

## E. 方法论教学层:Method Cards 【新组件】

- **理由**:视频是"先教方法再练";现 app 上来即做题。每个 RW 游戏入口放 30 秒可读完的方法卡(四步法/同义改写原则/主干拆解),做题时可随时调出。
- **文件**:新增共享组件 `src/components/rw/method-card.tsx`;各 RW 页与首页引用。

---

## 路由与内容清单

| 方向 | 路由 | gameType | 需生成内容 |
|---|---|---|---|
| A | /rw/read-the-green(改) | read_the_green | 回填现有题 keywords/trapType |
| B | /rw/paraphrase(新) | paraphrase | 约 40–60 条 |
| C | /rw/trim(新) | trim | 约 40–60 条 |
| D | /rw/closer(改) | closer | 回填现有词 contextClues |
| E | 组件,无路由 | — | 方法卡文案 |

## 执行顺序(用户确认:A→B→C→D→E)

1. **A** 改现有页 + 回填内容(最快见效,验证 payload 向后兼容策略)
2. **B** 新游戏(建立"新增 gameType"标准流程,C 复用)
3. **C** 新游戏(复用 B 流程)
4. **D** 升级 Closer
5. **E** 教学层,统一接入五个 RW 入口

## 首页 / 每日任务耦合(⚠️ 必须处理)

`src/app/page.tsx` 的 `GAMES` 数组与 `gamesDone / 5` 硬编码"5 个游戏";每日任务 `daily.gamesPlayed` 也按此计数。新增 B、C 后:
- **方案 1(默认建议)**:新游戏进入 `GAMES` 展示,但**不计入每日必做 5 项**,标为"额外练习",不打乱既有打卡门槛。
- **方案 2**:每日必做扩为轮换池(每天从 N 个游戏抽 5 个)。
> 待拍板;默认走方案 1。

## 大改三评估(规则第十三节)

- **架构**:payload=Json 使新游戏零迁移;新增 gameType 与现有解耦,无单点风险。唯一跨切面是首页/daily 的"5"硬编码,已标处理方案。
- **质量(DRY)**:B/C 的"加载题库→逐题→复盘→记 progress→下一题"骨架与现有三游戏高度重复,应抽出共享 hook(如 `useGameItems(gameType)`)与复盘卡组件,避免第 4 份复制粘贴。
- **性能**:`game-items` 一次性取全量 + word overlap 排序,单游戏题量(≤100)无 N+1 风险;继续走 `@@index([gameType, isActive])`。

## 风险点

1. A/D 的 payload 向后兼容:旧数据无新字段时必须降级为现玩法,不能报错。
2. 内容质量:同义改写干扰项要真实"像 SAT 陷阱",不能一眼假;主干拆解要语法正确。生成后需抽检。
3. 首页"5"硬编码若漏改,会出现"游戏 6/5"显示 bug。
