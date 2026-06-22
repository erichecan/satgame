# 游戏机制详细规格文档

**版本**：v1.0  
**日期**：2026-06-22  
**覆盖游戏**：全部 9 个游戏（3 个 NYT 词汇 + 5 个 R&W + 1 个数学）

---

## 一、NYT 词汇游戏

### 1.1 Clusters（Connections 式）

**路由**：`/vocab/clusters`

#### 核心流程

```
初始状态：16 个词随机排布在 4×4 网格
用户点击选词（高亮显示），最多选 4 个
点击「提交」→ 判断：
  ✓ 全对 → 消除该组，显示分类名和颜色，动画效果
  ✗ 错误 → 显示剩余尝试次数，词格抖动动画
全部 4 组消除 → 胜利
尝试次数耗尽（4 次）→ 显示全部答案
```

#### 颜色与难度映射

| 颜色 | 难度 | 通常特征 |
|------|------|----------|
| 黄 | 1（最易） | 同类词性、词义距离远 |
| 绿 | 2 | 语义相近但可区分 |
| 蓝 | 3 | 需要语境理解 |
| 紫 | 4（最难） | 细微联系，可能误导 |

#### 特殊机制

**One Away 提示**：
```
条件：选中 4 词中恰好有 3 词属于同一正确分组
提示文字：「差一步！」（One away!）
不透露哪 3 个是正确的
```

**动画规格**：
- 正确消除：卡片翻转 → 变色 → 上移汇集 → 显示主题名
- 错误：卡片左右抖动（shake）
- 胜利：从下往上依次弹出所有分组

#### 状态记录

```typescript
{
  gameType: "clusters",
  skill: "synonym_grouping",
  result: "correct" | "incorrect",
  attempts: number  // 本次猜测是第几次尝试
}
```

---

### 1.2 Five（Wordle 式）

**路由**：`/vocab/five`

#### 核心流程

```
初始状态：6 行空格（每行 5 格）
用户通过键盘输入 5 字母词 → 回车提交
每格着色 → 继续下一行
6 次内猜中 → 胜利动画
6 次耗尽未猜中 → 显示答案词 + 词义卡
```

#### 字母着色算法（关键：处理重复字母）

```typescript
function colorWord(guess: string, answer: string): ('green' | 'yellow' | 'gray')[] {
  const result = Array(5).fill('gray')
  const answerLetters = answer.split('')
  const guessLetters = guess.split('')
  
  // 第一遍：标记所有绿色（位置和字母均正确）
  for (let i = 0; i < 5; i++) {
    if (guessLetters[i] === answerLetters[i]) {
      result[i] = 'green'
      answerLetters[i] = null  // 消耗掉这个字母
      guessLetters[i] = null
    }
  }
  
  // 第二遍：标记黄色（字母存在但位置错）
  for (let i = 0; i < 5; i++) {
    if (guessLetters[i] === null) continue  // 已是绿色
    const answerIdx = answerLetters.indexOf(guessLetters[i])
    if (answerIdx !== -1) {
      result[i] = 'yellow'
      answerLetters[answerIdx] = null  // 消耗掉这个字母
    }
  }
  
  return result
}
```

#### 键盘颜色规则

**优先级：绿 > 黄 > 灰，只升不降**

```typescript
function updateKeyboard(keyColors: Map<string, Color>, guess: string, colors: Color[]) {
  const priority = { green: 3, yellow: 2, gray: 1 }
  for (let i = 0; i < guess.length; i++) {
    const letter = guess[i]
    const current = keyColors.get(letter) ?? 'unset'
    if (priority[colors[i]] > (priority[current] ?? 0)) {
      keyColors.set(letter, colors[i])
    }
  }
}
```

#### 提示系统

| 触发条件 | 提示类型 |
|---------|---------|
| 第 3 次猜错后 | 可选：显示词义描述（一句话） |
| 第 5 次猜错后 | 可选：显示首字母 |

提示为「可选」：用户主动点击「需要提示」按钮才显示，不自动弹出。

#### 胜利/失败后显示

```
无论胜负，显示答案词的完整词义卡：
- 单词 + 词性
- 英文释义
- 英文例句
- [译成中文] 按钮
- 明日 Five 倒计时（如每日限一次）
```

---

### 1.3 Strands（Strands 式）

**路由**：`/vocab/strands`

#### 核心流程

```
初始状态：N×M 字母网格（Phase 1 为预设盘面，如 6×8）
用户按住拖动，划选相邻字母（8方向均可，不能重复经过）
松开手指 → 判断是否为主题词
  ✓ 主题词 → 高亮为主题色，词格锁定
  ✓ Spangram → 高亮为金色，贯穿网格
  ✗ 非主题词 → 提示可使用「提示词」
全部主题词找到 → 胜利
```

#### 数据结构

```typescript
type StrandsBoard = {
  grid: string[][]         // 字母矩阵，如 6×8
  theme: string            // 主题名
  themeWords: {
    word: string
    path: [number, number][]  // 每个字母的 [row, col] 坐标
    definitionEn: string
  }[]
  spangram: {
    word: string
    path: [number, number][]
  }
}
```

#### 交互规格

**划选规则**：
- 手指/鼠标按下开始
- 只能经过相邻格子（上下左右斜，8方向）
- 同一次划选不能经过同一格子两次
- 松开即提交

**提示词机制**：
- 找到 3 个非主题词（普通有效词）→ 解锁一次提示
- 提示：高亮目标词的第一个字母格子
- 每局最多 3 次提示

#### Phase 1 预设内容规格

Phase 1 手工预制 5 套盘面，每套包含：
- 6×8 字母网格（48 格）
- 5-7 个主题词
- 1 个 Spangram（至少触及网格两侧）
- 主题词合计字母数 + Spangram 字母数 = 48（填满全格）

---

## 二、R&W 游戏

### 2.1 Closer（语义测距猜词）

**路由**：`/rw/closer`

#### 核心流程

```
[句子，目标词位置为 [___]]
[候选词列表，3-5 个]

用户从候选词中选择，可查看每个候选词释义
选择后提交 → 调用 /api/semantic-distance
API 返回：选中词与正确答案的语义距离（0.0-1.0）
显示反馈：
  距离 0.0 = 完全正确（绿色）
  距离 0.1-0.3 = 非常接近（黄色）
  距离 0.4-0.7 = 有些偏差（橙色）
  距离 0.8-1.0 = 相差较远（红色）
```

#### 候选词设计

每题 3-5 个候选词，按如下原则选择：
- 1 个完全正确答案
- 1-2 个语义接近但语境不符的近义词
- 1 个词性正确但语义差异较大的词
- 可选：1 个明显错误（作为对比）

#### /api/semantic-distance 接口规格

```typescript
// Request
POST /api/semantic-distance
{
  sentence: string,          // 含 [___] 的原句
  correctWord: string,       // 正确答案
  selectedWord: string,      // 用户选择的词
  context?: string           // 额外上下文（如文章段落）
}

// Response
{
  distance: number,          // 0.0-1.0，越小越接近
  explanation: string,       // 一句话解释为什么正确或为什么有偏差
  isCorrect: boolean         // distance < 0.1 视为正确
}
```

**Claude API Prompt 模板**：
```
Given the sentence: "[sentence]"
The blank [___] should be filled with: "[correctWord]"
The user chose: "[selectedWord]"

Rate the semantic distance between "[selectedWord]" and "[correctWord]" in this specific context.
Return a JSON with:
- distance: float 0.0-1.0 (0 = identical/interchangeable, 1 = completely wrong)
- explanation: one sentence explaining the difference or similarity
```

---

### 2.2 Stronger（近义词强弱阶梯）

**路由**：`/rw/stronger`

#### 核心流程

```
棋盘：4×4 或 5×5 格子
初始：若干词块随机散落棋盘
用户滑动词块（类 2048）
同方向相邻 + 语义强弱相邻的两块 → 合并
合并前：显示两词，用户确认它们在同一强弱阶梯上
  ✓ 确认正确 → 合并为更强/更弱的词
  ✗ 非相邻强度 → 提示不能合并
目标词出现 → 过关
```

#### 词链数据结构

```typescript
type WordChain = {
  dimension: string,     // "情绪强度" | "表达正式程度" | "批评程度"
  direction: "ascending" | "descending",  // 链的方向
  words: {
    id: string,
    word: string,
    intensity: number,   // 1-5
    definitionEn: string
  }[]
}
```

#### 词链示例

**情绪强度（升序）**：
```
content(1) → pleased(2) → happy(3) → joyful(4) → elated(5) → ecstatic(5+)
```

**批评强度（升序）**：
```
question(1) → doubt(2) → challenge(3) → rebuke(4) → condemn(5)
```

**正式程度（升序）**：
```
talk(1) → discuss(2) → deliberate(3) → confer(4) → convene(5)
```

---

### 2.3 Families（词义归类，三消）

**路由**：`/rw/families`

#### 核心流程

```
棋盘：6×6 或 7×7 词块（每个词块为一个单词）
随机词块从上方落下
用户点击词块 → 弹出分类问题：
  "这个词属于哪个 Family？"
  选项：A. 表示坚持 B. 表示批评 C. 表示支持 D. 表示怀疑
  
  ✓ 答对 → 词块变为该分类颜色
  ✗ 答错 → 触发即时迁移（换句，同分类，重新问）

同分类相邻词块达到 3 个 → 触发消除动画
消除时：展示被消除词的词义简介
```

#### Family 分类数据

每个 Family（分类）：
- 名称（中英双语）
- 颜色标识
- 包含的词列表（来自词汇池）

示例 Families：
- Resistance 坚持/抵抗：resilient, tenacious, steadfast, persistent, resolute
- Criticism 批评：scrutinize, critique, rebuke, censure, condemn, castigate
- Support 支持：advocate, champion, endorse, espouse, bolster
- Doubt 怀疑：skeptical, dubious, cynical, incredulous, suspicious

---

### 2.4 Gate Run（跑酷双门）

**路由**：`/rw/gaterun`

#### 核心流程

```
游戏视图：横向跑道，角色从左向右跑
每隔 2-3 秒，出现一对门（左门/右门）
每扇门上显示一个词/标点选项
用户点击（或按键）选择正确的门
  ✓ 角色跑过正确门，继续
  ✗ 角色碰到错误门，跌倒动画 → 暂停 → 显示解析 → 继续
```

#### 题目数据结构

```typescript
type GateRunQuestion = {
  sentenceBefore: string,   // 门之前的句子片段
  blank: string,             // [___] 位置标记
  sentenceAfter: string,    // 门之后的句子片段
  optionA: string,           // 左门选项
  optionB: string,           // 右门选项
  correct: 'A' | 'B',
  skill: 'punctuation' | 'transition',
  rule: string,              // 具体规则，如 "semicolon_before_independent_clause"
  explanation: string        // 解析（为什么正确）
}
```

#### 难度节奏控制

| 阶段 | 门间隔 | 题型 |
|------|--------|------|
| 开始（1-5 题） | 3 秒 | 过渡词（较易） |
| 中期（6-15 题） | 2.5 秒 | 标点 + 过渡词 |
| 后期（16+ 题） | 2 秒 | 复杂句型 |

#### 连击系统

- 连续答对 3 题：+1 连击，速度+5%
- 连续答对 5 题：+2 连击，背景颜色变暖色
- 答错：连击清零，速度恢复基础值

---

### 2.5 Pair Up（连连看）

**路由**：`/rw/pairup`

#### 核心流程

```
两列：左列为词，右列为释义/近义/反义
用户点击左列一个词 → 点击右列对应项
  ✓ 正确匹配 → 两项消除，绿色连线动画
  ✗ 错误匹配 → 红色抖动，记录错误

全部匹配完成 → 过关
显示本局用时 + 错误次数
```

#### 三种题型

```typescript
type PairUpMode = 'word-definition' | 'word-synonym' | 'word-antonym'
```

| 模式 | 左列 | 右列 | 示例 |
|------|------|------|------|
| word-definition | 词 | 英文释义 | reluctant ↔ unwilling to do something |
| word-synonym | 词 | 近义词 | brevity ↔ conciseness |
| word-antonym | 词 | 反义词 | loquacious ↔ taciturn |

#### 每局配置

- 每局 6 对（12 个项目）
- 难度混合：相似词放在同一局（增加迷惑性）
- 混合模式：三种类型各 2 对

---

## 三、数学游戏

### 3.1 Problem Dissector

**路由**：`/math/dissector/[id]`

#### 三步 UI 流程

**步骤一展示**：
```
[题目文本（英文/中文）]
[语言切换按钮]

问题：这道题在求什么？
○ 矩形的面积
● 矩形的宽
○ 矩形的长
○ 矩形的周长

[提交答案]
```

**步骤二展示**（步骤一答对后）：
```
[步骤一确认：题目求"矩形的宽" ✓]

问题：用什么方法解这道题？
○ 线性方程（直接求解）
● 二次方程（因式分解）
○ 百分比公式
○ 几何面积公式

[提交答案]
```

**步骤三展示**（步骤二答对后）：
```
[步骤一 ✓ 步骤二 ✓]

请按正确顺序排列解题步骤：
（拖动卡片排序）

┌──────────────────────────────────┐
│ 展开方程：x² + 2x - 48 = 0      │
├──────────────────────────────────┤
│ 设宽为 x，则长为 x+2             │  ← 拖动排序
├──────────────────────────────────┤
│ 因式分解：(x+8)(x-6) = 0         │
├──────────────────────────────────┤
│ 建立方程：x(x+2) = 48            │
└──────────────────────────────────┘

[提交排序]
```

**揭晓展示**（步骤三完成后）：
```
完整解题过程：

1. 设宽为 x，则长为 x+2
2. 建立方程：x(x+2) = 48
3. 展开：x² + 2x - 48 = 0
4. 因式分解：(x+8)(x-6) = 0
5. 解方程：x = 6（舍去 x = -8）
6. 验证：6 × 8 = 48 ✓

答：宽为 6

[下一题] [返回题库]
```

#### 拖排交互技术规格

- 使用 `@dnd-kit/core` 实现拖拽排序
- 移动端支持触摸拖排
- 正确顺序提交后，卡片依次高亮（动画）
- 错误时：显示正确顺序，错位卡片标红

---

## 四、通用 UI 规格

### 4.1 词义解释卡（所有游戏共用）

```
┌─────────────────────────┐
│ RESILIENT               │
│ adjective               │
├─────────────────────────┤
│ able to recover quickly │
│ from difficult          │
│ conditions              │
│                         │
│ Example:                │
│ Despite the setbacks,   │
│ she remained resilient  │
│ throughout the ordeal.  │
│                         │
│ [译成中文]              │
└─────────────────────────┘
```

中文展开后追加：
```
│ ─────────────────       │
│ 有韧性的；能迅速         │
│ 恢复的                  │
│ 例：尽管遭受挫折，她      │
│ 始终保持着韧性。         │
```

### 4.2 进度提示位置

- 游戏内顶部工具栏：当前分数 / 连击数 / 剩余尝试次数
- 不显示倒计时（除 Gate Run 外）
- 不显示生命值

### 4.3 错误反馈原则

- 即时：错误后立即有视觉反馈（红色、抖动）
- 解析：显示为什么错，不只说"答错了"
- 不惩罚：没有"生命值耗尽无法继续"的机制

---

## 五、游戏进度 API

```typescript
// POST /api/progress
{
  gameType: 'clusters' | 'five' | 'strands' | 'closer' | 'stronger' 
            | 'families' | 'gaterun' | 'pairup' | 'dissector',
  wordId?: string,          // 词汇类游戏
  mathId?: string,          // 数学题
  skill: string,            // 具体考点
  result: 'correct' | 'incorrect',
  attempts: number,
  sessionId?: string        // 同一局的多次尝试归为一组
}
```
