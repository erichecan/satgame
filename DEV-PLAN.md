# SAT Game — 开发计划（MVP 精简版 · 基于 demo 评估 v2）

> 本版本基于对 `demo/` 下 **11 个可玩 HTML 原型**的实测评估，将范围收敛为
> **5 个核心游戏 + gamification**。关键认知：**这些 demo 不是草图，是接近成品的可玩原型**，
> 开发工作量主要是「移植 + 接数据」，而非「从零写游戏」。
> 完整 9 游戏旧设计归档于 `docs/20260622-DEV-PLAN-full-9games.md`，可视化版见 `docs/20260625-dev-plan.html`。

## 读取的产品文档 + 资产
- `docs/` 下 5 份 PRD / 规格 / 学习引擎文档
- `demo/` 下 11 个可玩 HTML 原型（本次逐一实测）

---

## 一、demo 取舍决策（看完 11 个后）

11 个原型实为两代设计（绿色高尔夫主题 + 现代 Space Grotesk 主题），去重并按 SAT 相关度筛选：

### 保留 5 个（MVP 核心）—— 完整覆盖数字 SAT 全部 domain

| 游戏 | demo 文件 | 对应 SAT domain | 完成度 |
|------|-----------|----------------|--------|
| **Clusters** | `sat-connections.html` | R&W · 词义辨析（Craft & Structure） | 高，3 套题 |
| **Closer** | `closer-sat-vocab.html` | R&W · 词在语境（Words in Context） | 高，接 Claude API |
| **Read the Green** | `read-the-green.html` | R&W · 阅读理解/证据/推断（Information & Ideas，占比最大） | 高，含陷阱识别 |
| **Gate Run** | `gate-run.html` | R&W · 标点 + 过渡词（Conventions / Expression） | 高，标点过渡合一 |
| **Dissector** | `math-problem-dissector.html` | Math · 读题 + 题型 + 步骤规划 | 最高，中英双语 |

### 砍 6 个（含理由）

| 游戏 | demo 文件 | 砍的理由 | 残值处理 |
|------|-----------|----------|----------|
| The Break | `break-punctuation.html` | 考点已被 Gate Run 吸收 | 题目并入 Gate Run 题库 |
| Links | `links-transitions.html` | 考点已被 Gate Run 吸收 | 题目并入 Gate Run 题库 |
| Five (Wordle) | `sat-wordle.html` | SAT 不考拼写 | 降级为可选「记忆玩具」，不进 MVP |
| Stronger | `word-merge-2048.html` | 2048 套近义词强弱牵强，娱乐 > 教学 | 词链数据留给 Clusters/Closer |
| Families | `word-match-3.html` | 词义归类与 Clusters 考点重叠 | 弃用 |
| Pair Up | `pair-up.html` | 基础配对，被 Clusters/Closer 覆盖 | 弃用 |

> **新增说明**：`read-the-green` 是原 4 游戏方案漏掉的维度——纯阅读理解+证据题，
> 而这是数字 SAT R&W 占比最大的题型。看完 demo 后将 MVP 从 4 → 5 个游戏。

---

## 二、开发的真实性质：移植，而非重写

每个保留的 demo 已经是**单文件、可玩、视觉成品级**的原型。MVP 开发 = 对每个游戏做这 6 件事：

1. **移植**：单文件 HTML/JS → Next.js + TypeScript React 组件
2. **数据外迁**：把硬编码的题目数组 → 数据库种子表（题目即内容资产）
3. **接进度**：统一接入 `/api/progress` → SRS + XP + streak + 徽章
4. **接学习支持层**（见下节）：遇词即查 + 答错/求助自动入册 + 讲解 —— demo 全都缺，这是把"玩"变成"学"的关键
5. **Closer 后端化**：demo 直接在前端调 `api.anthropic.com`（无 key、不安全）→ 改为 `/api/semantic-distance` 后端代理 + 24h 缓存
6. **壳**：首页、导航、复习本、成就页

---

## 二·五、学习支持层（⭐ 贯穿全部 5 游戏 —— demo 普遍缺失）

> **问题**：所有 demo 都有「答错当下的即时反馈」，但都缺**沉淀与闭环**——遇到不认识的词没法查、答错/不会的内容不入册、错过的东西不会回来再考。这不是单游戏补丁，而是一套**全局通用机制**。

### 三大机制

**A. 遇词即查（通用组件 `<WordChip>` / `<DefinitionCard>`）**
- 任何游戏里出现的词，点一下 → 词义卡（英英优先 + 「译成中文」按钮 + 例句 + ⭐入册）
- 解决 Clusters 这类「词不认识根本没法玩」的硬伤——玩中即学

**B. 统一入册（一个函数 `addToReview()` 管所有游戏）**
- **触发策略（已定）**：**答错 OR 求助**（用提示 / 揭晓 / 超时 / 没做出来）OR 手动点 ⭐ —— 「不会」也是薄弱信号，不漏掉
- 每次入册给 **toast 正反馈**：「✓ ambivalent 已加入生词本，3 天后会再考你」——让「错」变成有奖励的事，而非挫败
- 入册时记 `reason`（wrong / asked_hint / gave_up / manual）

**C. 复习闭环（SRS 织回，已在 learning-engine.md 设计）**
- 入册内容按艾宾浩斯曲线到期 → 自动织回每日游戏出题
- **错的东西一定会回来**——这是真正「学到」的保证

### 讲解方式（已定：预存解析为主）
- MVP 用 demo 已有的预存解析（Gate Run 的 why / Read 的陷阱类型 / 词义卡 / Dissector 解题）—— 零成本、即时
- 预留「换个说法再讲一遍」AI 按钮（调 Claude），**Phase 2 再上**，避免 MVP API 成本

### 逐游戏补法

| 游戏 | demo 现状 | 本层补上 |
|------|----------|----------|
| Clusters | 仅「One away」，词不可查 | 点词查义；揭晓每词可入册；错误讲解「X 其实属于 Y 组」 |
| Closer | 有 nudge+提示+揭晓词义卡 | 词义卡加 ⭐入册；猜错的词沉淀 |
| Read the Green | 有陷阱类型解析 | 错题入错题本；原文/选项难词可点查 |
| Gate Run | 有 why 但一闪而过 | 错的规则入错题本；跑完汇总「本局错了哪几条规则」+ 可复习 |
| Dissector | 有 hint+揭晓 | 用 hint / 排错的薄弱题型入册；错题沉淀 |

---

## 三、功能模块拆解（按开发顺序）

### 模块 0：框架 + 首页 + 进度/gamification + 学习支持层骨架
- Next.js 初始化、Prisma + Neon 连接
- 首页：今日状态、5 游戏入口、当前 streak / XP / 等级
- `/api/progress`：唯一写入口，统一结算 SRS + XP + 徽章
- **学习支持层通用件**：`<WordChip>` / `<DefinitionCard>`（遇词即查）、`addToReview()`（统一入册）、入册 Toast —— 后续每个游戏移植时接上

### 模块 1：Clusters（移植 `sat-connections`）
- Connections 式 4×4 归类，黄绿蓝紫难度，One Away 提示
- 题目迁库（已有 3 套）

### 模块 2：Read the Green（移植 `read-the-green`）
- 短文 → 答题 → 点证据句 → 陷阱类型解析（too broad / not stated / opposite）
- 题目迁库（已有 3 篇，需扩充）

### 模块 3：Gate Run（移植 `gate-run` + 并入 break/links 题目）
- 跑酷双门，限时选标点/过渡词，连击 + 计时递减
- 合并三个 demo 的题库

### 模块 4：Closer（移植 `closer-sat-vocab` + 后端化）
- 挖空句 + 输入猜词，语义测距（高尔夫 yards 隐喻）
- `/api/semantic-distance` 后端代理 Claude API，结果缓存；无 key 时降级为预设近义词表

### 模块 5：Dissector（移植 `math-problem-dissector`）
- 中英双语三步拆题（在问什么 → 用什么方法 → 转几个弯 + 步骤拖排）
- 题目迁库（已有 5 道）

### 模块 6：复习本 + Gamification 收尾
- **复习本页**（生词 / 错题 双 tab，来自 `addToReview` 的沉淀，按 reason 筛选）
- Streak、XP/等级、徽章解锁页

---

## 四、数据库 Schema（MVP）

> 与 demo 的题目结构对齐：新增 `ReadingItem`（Read the Green），其余沿用 v1。

```prisma
model Word {
  id String @id @default(cuid())
  word String @unique
  partOfSpeech String
  definitionEn String
  definitionCn String
  exampleEn String
  tone String
  difficulty Int
  synonyms String[]
  antonyms String[]
  isActive Boolean @default(true)
}

model ConnectionGroup {           // Clusters
  id String @id @default(cuid())
  theme String
  tier Int                        // 0黄 1绿 2蓝 3紫
  words Json                      // [[word, gloss], ...]
  setId String
}

model ReadingItem {              // Read the Green（新增）
  id String @id @default(cuid())
  sentences String[]              // 短文按句拆分
  question String
  options Json                    // [{text, correct?, trap?}]
  evidenceIndex Int               // 证据句下标
  evidenceWhy String
  skill String                    // main_idea | inference | command_of_evidence
  difficulty Int
}

model GateRunQuestion {          // Gate Run（含 break/links 并入）
  id String @id @default(cuid())
  before String
  after String
  doors String[]                  // 两个选项
  correct Int
  kind String                     // punctuation | transition
  why String
  difficulty Int
}

model CloserWord {               // Closer
  id String @id @default(cuid())
  word String @unique
  partOfSpeech String
  definitionEn String
  exampleEn String                // 含 <b>目标词</b>
  difficulty Int
}

model MathProblem {              // Dissector
  id String @id @default(cuid())
  textEn String
  textCn String
  ask Json                        // [{text, correct?}]
  tool Json
  cueEn String
  cueCn String
  turns Int
  steps Json                      // 有序步骤（中英）
  workEn String
  workCn String
  answerEn String
  answerCn String
  archetype String
  difficulty Int
}

model UserProgress {
  id String @id @default(cuid())
  refId String?                   // 题目/词 id
  gameType String                 // clusters|reading|gaterun|closer|dissector
  skill String
  rule String?
  result String
  attempts Int @default(1)
  masteryScore Float @default(0)
  consecutiveCorrect Int @default(0)
  nextReview DateTime?
  createdAt DateTime @default(now())
}

model VocabNote {                // 生词本（错题本由 UserProgress result=incorrect 且未毕业派生）
  id String @id @default(cuid())
  wordId String
  addedFrom String                // 来源游戏
  reason String                   // wrong | asked_hint | gave_up | manual（入册原因）
  masteryLevel Int @default(0)
  nextReview DateTime?
  reviewCount Int @default(0)
  createdAt DateTime @default(now())
}

model UserStats {                // gamification
  id String @id @default(cuid())
  totalXp Int @default(0)
  level Int @default(1)
  currentStreak Int @default(0)
  longestStreak Int @default(0)
  lastActiveDate String @default("")
}

model Achievement {
  id String @id @default(cuid())
  code String @unique
  title String
  progress Int @default(0)
  target Int
  unlockedAt DateTime?
}
```

---

## 五、页面 / 路由清单

```
/                       首页（今日状态、streak/XP、5 游戏入口）
/vocab/clusters         Clusters
/rw/reading             Read the Green
/rw/gaterun             Gate Run
/rw/closer              Closer
/math/dissector         Dissector
/review                 复习本（生词 / 错题 双 tab）
/achievements           成就 / 徽章
/api/review             入册 / 复习队列（addToReview）
/api/progress           进度 + XP/徽章结算
/api/semantic-distance  Closer 语义裁判（后端代理 Claude API）
```

---

## 六、大改评估（架构 / 质量 / 性能）

1. **架构**：5 游戏共用 `/api/progress` 唯一写入口，SRS/XP/徽章在此统一结算。Closer 的 LLM 调用是唯一外部依赖，后端隔离 + 缓存。各游戏组件独立，无相互依赖。
2. **质量**：直接复用 demo 的成品级交互与视觉，不重写；词义卡、进度结算、SRS 抽公共模块。两代 demo 视觉语言需统一（建议统一到 Space Grotesk 主题）。
3. **性能**：单用户、数据量小，无 N+1；Closer 语义结果缓存 24h 防重复调用。

---

## 七、预计风险点

1. **视觉统一**：两代 demo（高尔夫绿 / 现代灰）风格不一，移植时需定一套统一设计 token。
2. **内容扩充**：demo 每个游戏仅 3-5 题，够验证体验、不够长期用。MVP 后用「LLM 生成 + 人审」（词汇/阅读/语法）与「参数化模板 + 代码验证」（数学）扩充。**初始内容量已定：每个游戏 200 题**（见八·五）。
3. **Closer 依赖 Claude API**：必须后端代理（demo 前端直调不安全），配 `ANTHROPIC_API_KEY`；无 key 降级。
4. **单用户**：无注册登录，进度无 userId（未来多用户再加）。

---

## 八、技术架构

- Next.js 14 App Router + TypeScript
- PostgreSQL（**Neon**）+ Prisma
- Tailwind CSS + shadcn/ui
- Anthropic Claude API（仅 Closer 语义裁判，后端代理）
- 部署：**GCP Cloud Run**（Project ID 等待用户在部署阶段提供）

---

## 八·五、内容生成计划（初始题量：每游戏 200 题）

| 游戏 | 目标题量 | 生成方式 | 审核方式 |
|------|---------|---------|---------|
| Clusters | 200（≈50 组×4 词） | LLM 批量生成分组 + 主题名 | 人审：分组唯一性、难度分级 |
| Closer | 200 | LLM 生成挖空句 + 候选词，语义裁判用实时 API | 人审：例句自然度、候选词区分度 |
| Read the Green | 200 | LLM 生成短文+证据题+陷阱选项 | 人审：陷阱类型分布、证据可追溯 |
| Gate Run | 200 | LLM 生成句子 + 正确/错误标点·过渡词 | 人审：语法准确性 |
| Dissector（数学） | 200 | **参数化模板 + 代码验证**（非纯 LLM，保证数值正确） | 抽查：题型覆盖度 |

**流程**：LLM/模板批量生成 → 写入 staging 表 → 人工审核（你）→ 标记 `isActive=true` → 迁入正式题库。审核标准沿用 `docs/20260622-PRD-rw.md` §6.3：词义准确、例句非模板化、难度分级合理、无文化偏见。

**词库来源**：优先参照 College Board 官方 Digital SAT 真题/Bluebook 练习题反推高频词和句型分布做种子，LLM 负责扩写变体，不凭空发明考点。

**总量**：5 × 200 = 1000 题，按 SAT 常见备考周期（8-12 周，每日 20-30 分钟）估算，足够支撑约 2-3 个月不重复。
