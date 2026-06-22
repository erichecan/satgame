# SAT Game — 开发计划

## 读取的产品文档
- Claude 共享对话 `07fc9b33`（需求原始来源，含 PRD、HTML 原型、游戏设计讨论）
- 用户本次对话补充说明

---

## 产品定位

为 Isabella（Grade 9，加拿大，计划备考 SAT）打造的每日游戏化复习 APP。  
核心原则：**玩法本身就是练习**，不是换皮选择题。

---

## 功能模块拆解

### 模块一：词汇游戏（NYT Games 风格）

> 定位：应对学习过程中产生的生词，扩充 SAT 词汇量

**游戏前流程（必须先学词）**：
1. 每次进入词汇游戏区前，先展示 50 个 SAT 单词（词义卡）
2. 游戏的词汇范围 = 这 50 个词 + 它们的同/反义词 + 生词本里的词
3. 学完词才解锁当日三个 NYT 游戏

**三个 NYT 风格游戏**：

| 游戏 | 原型 | 考点 | 难度 |
|------|------|------|------|
| **Clusters**（Connections 式） | 原型已有 | 近义词细微辨析 | ★★★ |
| **Five**（Wordle 式） | 原型已有 | 拼写 + 词义回忆 | ★★ |
| **Strands**（Strands 式） | 需重建 | 主题词汇归类 | ★★★★ |

### 模块二：R&W 综合练习游戏

> 定位：针对 SAT R&W 四大考点的专项游戏，含完整学习引擎

**五个游戏**：

| 游戏 | 玩法形式 | 考点 |
|------|----------|------|
| **Closer** | 语义测距猜词（含挖空句子线索） | 词在语境中的含义 |
| **Stronger** | 2048 合成，近义词强弱阶梯 | 近义词精确度 |
| **Families** | 三消，消除前答词义 | 词义归类 |
| **Gate Run** | 跑酷双门，限时选标点/连接词 | 标点、过渡词 |
| **Pair Up** | 连连看，词↔释义 或 近义↔反义 | 词义配对 |

**学习引擎（所有 R&W 游戏共用）**：
- Item 数据模型：word / skill / rule / difficulty / distractor_type
- 掌握度记在考点维度（不记在题目）
- SRS = 艾宾浩斯遗忘曲线：答错打回最短间隔，连对 3 次毕业
- 两种重来：即时迁移（换句考同规则）+ 间隔重现（换语境）
- 生词本：错词自动入册，到期织回游戏复习

**词义解释卡**：默认英英，底部「译成中文」按钮按需翻译

### 模块三：数学读题模块（Problem Dissector）

> 定位：练读题与解题规划，不练计算

**拆题三步流程**（对同一道题）：
1. 在问什么 → 点出题目真正求哪个量
2. 用什么方法 → 识别题型/公式（选择题）
3. 转几个弯 → 把解题步骤按顺序排出（卡片拖排）

功能：中/英文切换，揭晓后显示完整算式

---

## 数据库 Schema 设计

```prisma
// 词汇条目
model Word {
  id            String   @id @default(cuid())
  word          String   @unique
  partOfSpeech  String   // noun/verb/adj/adv
  definitionEn  String
  definitionCn  String
  exampleEn     String
  tone          String   // positive/negative/neutral
  intensity     Int      // 1-5，用于 Stronger 游戏词链
  difficulty    Int      // 1-3，对应 SAT 难度
  category      String   // vocabulary/grammar/transition
  synonyms      String[] // 关联同义词 id
  antonyms      String[] // 关联反义词 id
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
}

// Connections 游戏分组
model ConnectionGroup {
  id          String   @id @default(cuid())
  theme       String   // 隐藏分类名
  color       String   // yellow/green/blue/purple
  wordIds     String[] // 4 个词
  difficulty  Int      // 1-4
  setId       String   // 属于哪个 daily set
}

// 每日词汇集（50 词一组）
model DailyWordSet {
  id        String   @id @default(cuid())
  date      String   // YYYY-MM-DD
  wordIds   String[] // 50 个词 id
  isActive  Boolean  @default(true)
}

// 数学题目
model MathProblem {
  id          String   @id @default(cuid())
  textEn      String
  textCn      String
  questionEn  String
  questionCn  String
  archetype   String   // linear/quadratic/percentage/ratio/exponential/geometry
  turns       Int      // 解题弯数
  options     Json     // 选项 (what/method/steps)
  answer      Json     // 正确答案
  explanation Json     // 步骤解析
  difficulty  Int      // 1-3
}

// 用户进度（单用户，Isabella）
model UserProgress {
  id          String   @id @default(cuid())
  wordId      String?
  mathId      String?
  gameType    String   // clusters/five/strands/closer/stronger/families/gaterun/pairup/dissector
  skill       String   // 考点
  result      String   // correct/incorrect
  attempts    Int      @default(1)
  masteryScore Float   @default(0)
  nextReview  DateTime?
  createdAt   DateTime @default(now())
}

// 生词本
model VocabNote {
  id          String   @id @default(cuid())
  wordId      String
  addedFrom   String   // 从哪个游戏加入
  masteryLevel Int     @default(0) // 0=新 1=学习中 2=掌握
  nextReview  DateTime?
  reviewCount Int      @default(0)
  createdAt   DateTime @default(now())
}
```

---

## 页面/路由清单

```
/                     首页（今日状态、模块入口）
/vocab/study          词汇学习（50 词卡片）
/vocab/clusters       Clusters 游戏
/vocab/five           Five 游戏
/vocab/strands        Strands 游戏
/vocab/notebook       生词本
/rw                   R&W 游戏大厅
/rw/closer            Closer
/rw/stronger          Stronger
/rw/families          Families
/rw/gaterun           Gate Run
/rw/pairup            Pair Up
/math                 数学模块大厅
/math/dissector       Problem Dissector
/api/progress         进度记录 API
/api/words            词汇查询 API
/api/semantic-distance 语义距离（Closer 游戏用，调 LLM）
```

---

## 开发顺序（三个 Phase）

### Phase 1（MVP，本次执行）
目标：三个 NYT 游戏 + 词汇学习流程 + 基础进度追踪

1. Next.js 项目初始化
2. 数据库 schema + 迁移
3. 种子内容：第一批 50 个 SAT 词 + Connections 分组数据
4. 词汇学习页面（50 词卡片翻转展示，含中英切换）
5. Clusters（Connections 式）游戏
6. Five（Wordle 式）游戏
7. Strands（Strands 式）游戏
8. 首页 + 今日进度状态

### Phase 2（R&W 游戏）
Closer / Stronger / Families / Gate Run / Pair Up + 完整 SRS 引擎 + 生词本

### Phase 3（数学模块）
Problem Dissector + 更多题目内容

---

## 预计风险点

1. **Strands 出题难度**：需要手工排布字母网格，确保所有主题词无重叠填满格子，Phase 1 用预设盘面
2. **Five 词库限制**：Wordle 只能用 5 字母词，会过滤掉很多 SAT 词，需要精挑合适词
3. **Closer 语义距离**：需要调用 LLM API 判断语义远近，需要配置 ANTHROPIC_API_KEY
4. **内容生产**：词义、例句、Connections 分组需要人工审核，Phase 1 先手动录入 50 词
5. **单用户场景**：当前设计是单用户（Isabella），用户系统简化，无需注册登录

---

## 技术架构

- **框架**: Next.js 14 App Router
- **数据库**: PostgreSQL + Prisma
- **UI**: Tailwind CSS + shadcn/ui
- **语言**: TypeScript
- **LLM**: Anthropic Claude API（仅 Closer 游戏的语义裁判）
- **部署**: 待确认
