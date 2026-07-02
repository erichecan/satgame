# 每日打卡流程设计（背 50 词 + 10 题测验 + 5 游戏）

**日期**：2026-07-01
**状态**：已确认，待写实施计划

## 背景与动机

现有实现（见 [DEV-REPORT.md](../../../DEV-REPORT.md)）已经把 5 个游戏（Clusters / Closer / Read the Green / Gate Run / Dissector）移植上线，各自独立记录进度、发 XP。但没有一条贯穿全局的"今天该做什么"主线——学生可以只挑一个简单游戏应付了事，也可能完全跳过背单词。

本次设计引入一条明确的每日主线：**背 50 个高频词 → 做 10 道仿真 SAT 短文题（关联这 50 词）→ 5 个游戏各玩一遍**，三项全部完成才算当日打卡成功、发 streak 和结算徽章。

## 一、数据模型变更

在 `prisma/schema.prisma` 现有模型基础上新增/修改：

### 1.1 `Word` 表新增字段

```prisma
model Word {
  // ...现有字段不变
  tier String   // "foundation"（通用学术词汇）| "sat_core"（SAT 高频词）
  rank Int      // tier 内的顺序，决定新词推进顺序
}
```

### 1.2 新增 `QuizItem` 表（每日测验题库，独立于游戏用的 `GameItem`）

```prisma
model QuizItem {
  id         String   @id @default(cuid())
  passage    String   // 25-150 词短文
  question   String
  options    Json     // [{t: string, correct?: boolean}]，四选一
  wordIds    String[] // 这道题用到词库里的哪几个词（关联 Word.id）
  domain     String   // craft_structure | words_in_context | info_ideas | expression_conventions
  difficulty Int      @default(2)
  explanation String?
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())

  @@index([isActive])
}
```

不复用 `GameItem` 是因为这是"每日必做主线"内容，与游戏内容的生命周期、复用逻辑不同，混在一起会让两类内容互相干扰。

### 1.3 新增 `DailyAssignment` 表（当天任务快照，支持中途退出继续）

```prisma
model DailyAssignment {
  id           String    @id @default(cuid())
  date         String    @unique // "YYYY-MM-DD"，服务器本地日期
  wordIds      String[]  // 当天分配的 50 个词（40 新词 by rank + 10 SRS 到期词）
  quizItemIds  String[]  // 当天分配的 10 道题
  wordsViewed  String[]  @default([]) // 已翻过的词 id（去重追加）
  quizAnswers  Json      @default("{}") // { [quizItemId]: "correct" | "incorrect" }
  gamesPlayed  String[]  @default([]) // 当天玩过的 gameType（去重追加）
  completedAt  DateTime? // 三项全部完成时写入，触发打卡结算
  createdAt    DateTime  @default(now())
}
```

`completedAt` 的写入条件：`wordsViewed.length >= 50 && Object.keys(quizAnswers).length >= 10 && gamesPlayed.length >= 5`（5 个游戏各玩过一轮，不要求全对——每个游戏"玩过一轮"= 走到该游戏现有的终止态：Clusters 解完/揭晓、Closer 猜中/放弃、Read the Green 走完一篇、Gate Run 游戏结束、Dissector 走到 reveal）。

## 二、每日流程与 API

### 2.1 `GET /api/daily`

获取（或首次创建）今天的 `DailyAssignment`：
- 若今天的记录不存在：按 `tier/rank` 顺序取 40 个未学过的新词 + 从 `Progress`/`VocabNote` 里挑 10 个 `nextReview <= now` 的到期词，合并去重到 50 个；再从 `QuizItem` 里找 `wordIds` 与这 50 词有交集的题，优先覆盖更多不同的词，凑够 10 道（不够则用通用（`wordIds` 为空）的 SAT 短文题兜底）
- 若已存在：直接返回，带上当前进度（用于中途继续）

### 2.2 `POST /api/daily/word-viewed`

翻卡片时调用，`{ wordId }` → 追加进 `wordsViewed`，若 `unknown: true`（用户点了"不认识"）则同时调用现有 `addToReview(wordId, "self_reported_unknown")` 入生词本。

### 2.3 `POST /api/daily/quiz-answer`

`{ quizItemId, result }` → 写入 `quizAnswers`。

### 2.4 `POST /api/progress`（修改现有路由）

5 个游戏调用这个接口报告结果时，额外把 `gameType` 追加进当天 `DailyAssignment.gamesPlayed`（去重）。

### 2.5 打卡结算

以上任一接口写入后检查是否三项全部达标；首次达标时：
- 写 `DailyAssignment.completedAt`
- `streak + 1`（**行为改动**：现有 `gamification.ts` 里 `recordActivity()` 目前每次 `/api/progress` 调用都加 streak，改成 streak 只在这里触发；5 个游戏的 XP 仍然照常发放，只是不再驱动 streak）
- 检查徽章（沿用现有 `streak_3` / `streak_7` / `xp_100` / `xp_500`，新增 `first_checkin`「今日打卡」）

## 三、页面改动

### 3.1 新增 `/study`（背单词翻卡片）

逐词卡片：正面词 + 词性/音标，翻面词义 + 例句 + 同组辨析（如果该词属于近义词组）。每张卡片有「认识」「不认识」按钮，点完自动前进下一张。50 张翻完后替换成「去做题 →」按钮跳转 `/daily-quiz`。

### 3.2 新增 `/daily-quiz`（每日测验）

10 道题依次呈现，复用现有 Read the Green 的"答题 + 讲解"交互模式（短文 + 四选一 + 即时解析），答完 10 题后显示当天完成情况汇总，若三项都齐提示打卡成功。

### 3.3 首页（`/`）改版

- 顶部新增「今日任务」卡片，取代原本单纯的统计展示，作为主入口：三段进度 `背单词 0/50 · 测验 0/10 · 游戏 0/5`，点击对应分段跳转，三项齐了显示"今日打卡成功"标记
- 原有 XP / streak / 生词待复习 / 徽章 卡片保留，往下移
- 5 个游戏卡片保留，标题改为「今日任务·游戏」，每个卡片加当天完成勾选标记（读取 `gamesPlayed`）

### 3.4 桌面端布局优化

现有 5 个游戏页面和新页面此前都是按手机宽度（480-560px 定宽卡片）做的。这次要让整体在桌面浏览器（≥1024px）下正常好看：
- `/study`、`/daily-quiz` 在 `lg:` 断点以上采用左右分栏（左侧当前卡片/题目，右侧当天进度列表）
- 5 个游戏页面在桌面端居中容器放宽到 640-720px，字号相应加大
- 所有新旧页面都要过手机宽度（375px）和桌面宽度（1280px）两轮验证

## 四、内容生产计划

### 4.1 词库（1500 词，分两层）

- `foundation` 层（约 600 词）：通用学术词汇，参照 Academic Word List 一类的权威列表，打通日常英语到学术英语的断层
- `sat_core` 层（约 900 词）：SAT 高频词，参照 Barron's / Magoosh / PrepScholar 等机构面向现行数字 SAT 的高频词表
- 每层内按频率/难度排 `rank`

### 4.2 题库（QuizItem，约 500-700 道）

覆盖 R&W 四大考点，短文 + 四选一结构；尽量让 1500 词都至少配对到 1-2 道题。

### 4.3 生产流程（沿用已定原则：预生成为主，人工审核后入库）

```
WebSearch 找权威高频词表做种子
  → LLM 批量生成词义/例句/辨析组
  → 人工审核
  → 写入 Word 表

LLM 批量生成配套 QuizItem（短文 + 题 + 选项，标注涉及的词）
  → 人工审核
  → 写入 QuizItem 表
```

### 4.4 分批交付

不等 1500 词全部审完才上线：
- **第一批**：约 300 词（foundation 150 + sat_core 150）+ 120 道配套题，够 Isabella 从上线起正常打卡约 6 天
- 后续每批约 300 词 + 120 题，生成一批、审核一批、导入一批，约 5 批补满 1500 词 + 500-700 题

## 五、明确排除的范围（YAGNI）

- 不做多用户账号体系（沿用现有单口令登录，`DailyAssignment` 按日期唯一，不分用户）
- 不做真正的桌面端安装包（Electron/Tauri），仍是 Web 应用，只做响应式布局优化
- 不在 MVP 阶段接入实时 LLM 生成每日测验（题库预生成 + 人工审核）
- Closer 游戏的语义评分维持现状（无 `ANTHROPIC_API_KEY` 则降级），不在本次范围内解决
