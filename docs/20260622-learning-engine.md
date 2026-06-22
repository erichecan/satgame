# 学习引擎规格文档

**版本**：v1.0  
**日期**：2026-06-22  
**模块**：SRS 系统 + 生词本 + 内容管线

---

## 一、设计原则

### 1.1 掌握度记在考点维度

**核心决策**：不记录「这道题学会了」，记录「这个考点/规则学会了」。

```
考点（skill）= 一个抽象的学习目标
  例：word_in_context / synonym_precision / semicolon_usage

规则（rule）= 考点下的具体规则
  例：causal_conjunction / contrast_conjunction / colons_before_list
```

同一规则可以用无限多的句子/词来出题。用户的掌握度绑定在规则上，而非题目上。

**好处**：
- 防止「题目记忆」（背答案）而非「规则理解」
- 换句子/换词后，真实考验是否掌握了原理
- 内容可以无限扩展，不影响掌握度数据

### 1.2 两种重来，各有用途

| 类型 | 触发时机 | 形式 | 目的 |
|------|---------|------|------|
| 即时迁移 | 答错后立即 | 换句/换词，同规则 | 趁热打铁，不停留在错误 |
| 间隔重现 | SRS 计时到期 | 换语境，同规则 | 在遗忘发生前强化 |

---

## 二、SRS 系统（艾宾浩斯遗忘曲线）

### 2.1 间隔计划

| 状态 | 连续正确次数 | 下次复习时间 |
|------|------------|-------------|
| 新词 | 0 | 当日内 |
| 学习中 | 1 次 | +1 天 |
| 学习中 | 2 次 | +3 天 |
| 已掌握 | 3 次（毕业） | +7 天 |
| 稳固中 | 4 次 | +14 天 |
| 长期记忆 | 5 次 | +30 天 |

**答错重置规则**：
- 任意阶段答错 → `masteryScore` 降一档，`nextReview` 重置为 1 天后
- 已毕业词答错 → 退回到「学习中」状态

### 2.2 数据模型

```prisma
model UserProgress {
  id           String    @id @default(cuid())
  wordId       String?   // 词汇类（可选）
  mathId       String?   // 数学题（可选）
  gameType     String    // 来源游戏
  skill        String    // 考点域（如 "synonym_precision"）
  rule         String?   // 具体规则（如 "contrast_conjunction"）
  result       String    // "correct" | "incorrect"
  attempts     Int       @default(1)
  masteryScore Float     @default(0)  // 0.0-1.0
  consecutiveCorrect Int @default(0)  // 连续正确次数
  nextReview   DateTime?
  createdAt    DateTime  @default(now())
}
```

### 2.3 掌握度计算逻辑

```typescript
function updateMastery(progress: UserProgress, result: 'correct' | 'incorrect') {
  if (result === 'correct') {
    progress.consecutiveCorrect += 1
    
    // 毕业判断：连续 3 次正确
    if (progress.consecutiveCorrect >= 3) {
      progress.masteryScore = 1.0
      progress.nextReview = addDays(now, 7)  // 毕业后 7 天复习
    } else {
      // 间隔渐增
      const intervals = [1, 3]
      const days = intervals[progress.consecutiveCorrect - 1] ?? 3
      progress.nextReview = addDays(now, days)
    }
  } else {
    // 答错：重置
    progress.consecutiveCorrect = 0
    progress.masteryScore = Math.max(0, progress.masteryScore - 0.3)
    progress.nextReview = addDays(now, 1)
  }
  
  return progress
}
```

### 2.4 每日复习队列

每次进入游戏时，系统自动合并两类词进入出题池：
1. `nextReview <= now` 的到期复习词
2. 当日新词（DailyWordSet）

优先级：到期复习词 > 当日新词

---

## 三、生词本（VocabNote）

### 3.1 自动入本规则

以下任一情况，词自动加入生词本：
- 游戏中答错（任何 R&W 或 NYT 游戏）
- 用户手动点击「加入生词本」按钮

```prisma
model VocabNote {
  id           String    @id @default(cuid())
  wordId       String
  addedFrom    String    // 来源游戏 ID（clusters/five/closer 等）
  masteryLevel Int       @default(0)  // 0=新 1=学习中 2=已掌握
  nextReview   DateTime?
  reviewCount  Int       @default(0)
  createdAt    DateTime  @default(now())
  
  // 关系
  word         Word      @relation(fields: [wordId], references: [id])
}
```

### 3.2 生词本复习流程

```
nextReview <= today 的词 → 织入当日游戏（随机选择合适游戏）
masteryLevel 升级规则：
  0 (新) → 游戏中答对 1 次 → 1 (学习中)
  1 (学习中) → 游戏中答对 2 次 → 2 (已掌握)
  2 (已掌握) → 30 天后再次复习（防止遗忘）
```

### 3.3 生词本 UI（/vocab/notebook）

```
筛选：全部 | 新词 | 学习中 | 已掌握
排序：加入时间 | 到期时间 | 字母序

每条记录：
[词] [词性] [来源游戏 icon]
[英文释义（截断）]
[掌握等级 badge] [下次复习时间]
[点击展开：完整词义卡]
```

---

## 四、考点（Skill）分类体系

### 4.1 词汇考点

| skill | rule（示例） | 对应游戏 |
|-------|------------|---------|
| word_in_context | connotation_positive / connotation_negative | Closer |
| synonym_precision | intensity_scale / formality_scale | Stronger |
| word_classification | semantic_field_resistance / semantic_field_criticism | Families |
| word_pairing | definition_match / synonym_match / antonym_match | Pair Up |

### 4.2 语法考点

| skill | rule | 对应游戏 |
|-------|------|---------|
| punctuation | semicolon_before_independent_clause | Gate Run |
| punctuation | colon_before_list | Gate Run |
| punctuation | comma_before_conjunction | Gate Run |
| transition_words | causal_conjunction (therefore/thus/consequently) | Gate Run |
| transition_words | contrast_conjunction (however/nevertheless/despite) | Gate Run |
| transition_words | additive_conjunction (furthermore/moreover/additionally) | Gate Run |
| transition_words | exemplification (for instance/specifically/namely) | Gate Run |

### 4.3 数学读题考点

| skill | rule | 对应游戏 |
|-------|------|---------|
| problem_reading | identify_unknown_quantity | Dissector |
| method_selection | linear / quadratic / percentage / ratio / geometry | Dissector |
| step_ordering | multi_step_planning | Dissector |

---

## 五、内容生产管线

### 5.1 架构

```
[LLM 批量生成] → [人工审核] → [写入数据库] → [游戏调用]
                                ↑
                         stable ID（永不改变）
```

### 5.2 各类内容的生成 Prompt 设计原则

**词汇内容（Word 表）**：
- 提供 SAT 词汇列表
- LLM 生成：词性、英文释义、例句、语气(tone)、强度(intensity)、同反义词
- 审核重点：释义是否符合 SAT 级别、例句是否自然

**Connections 分组（ConnectionGroup）**：
- 提供词汇池
- LLM 生成：4 个分组，每组 4 词，主题名，难度分级
- 审核重点：分组是否有语义依据、黄绿蓝紫难度是否合理

**Gate Run 题目**：
- 提供规则类型（如 causal_conjunction）
- LLM 生成：句子 + 两个选项（一对一错）+ 解析
- 审核重点：正确选项是否唯一正确、解析是否清晰

**Closer 题目**：
- 提供目标词和语境类型
- LLM 生成：挖空句子 + 3-5 个候选词（含干扰项）
- 审核重点：句子语境是否有足够线索、候选词选择是否合理

### 5.3 动态 LLM 调用（运行时）

只有两个场景需要实时调用 Claude API：

**场景一：Closer 语义距离判断**
```
POST /api/semantic-distance
调用时机：用户提交选词后
延迟要求：< 3 秒（用户等待可接受范围）
缓存策略：相同 (correctWord, selectedWord, context) 三元组结果缓存 24 小时
```

**场景二：「用另一种方式解释」（预留）**
```
触发：用户在词义卡点击「换个说法解释」按钮
当前状态：Phase 2 后期实现，Phase 1/2 初期不上线
```

### 5.4 内容质量标准

| 维度 | 标准 |
|------|------|
| 准确性 | 词义符合 SAT 考试级别（College Board 认可范围） |
| 自然度 | 例句不带明显机器感，接近真实语境 |
| 难度 | difficulty 1-3 与实际难度一致 |
| 适龄 | 适合 Grade 9 学生（14岁），无偏见、无敏感内容 |
| 覆盖度 | 各 archetype 题目数量均衡 |

---

## 六、单用户设计说明

当前版本为单用户场景（仅 Isabella 使用）：

- 无注册/登录系统
- 所有进度数据无用户 ID 区分
- 若未来扩展多用户，需要在 UserProgress 和 VocabNote 中加 `userId` 字段

---

## 七、关键技术决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| 掌握度维度 | 考点/规则维度 | 防题目记忆，考查真实理解 |
| SRS 算法 | 简化艾宾浩斯 | 适合游戏化场景，不需要完整 SM-2 复杂度 |
| LLM 调用策略 | 离线预生产为主，实时为辅 | 降低延迟风险和 API 成本 |
| 词义语言 | 英英优先，中文按需 | 培养英文思维，减少翻译依赖 |
| 错误处理 | 即时迁移（换题不换规则） | 错误是学习机会，不惩罚，趁热打铁 |
| Strands 内容 | Phase 1 手工预制盘面 | 算法生成约束复杂，优先验证游戏体验 |
