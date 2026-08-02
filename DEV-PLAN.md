# DEV-PLAN — 第三期:Strategy Lessons(Khan Academy 式全套技巧课)

> 需求来源:孩子自测反馈 —— 初级题(main idea、逻辑总结)没问题,但**生词密度高**或**学科交叉文章**(science/history 类)就不会做。
> 用户决策(2026-08-01 对话确认):
> 1. 范围:**全套 SAT Reading & Writing 技巧库**(不只两个薄弱点)。
> 2. 讲解语言:**全英文**(与全站英文 UI 一致)。
> 3. 内容来源:AI 总结技巧体系为骨架 + 联网校验补充(用户两个想法合并)。
> 4. 展示形式:**Khan Academy 式** —— Course → Unit → Lesson,每课 Learn → Worked Example → Practice → Mastery。
>
> 上一期(干扰项分类学)已归档于 `docs/20260801-DEV-PLAN-phase2-trap-taxonomy.md`。
> 规模判定:**大改(BIG)** — 新模块 + 1 处 schema 小迁移 + 约 150 条新内容。

---

## 0. 架构原则:建在现有资产上,不另起炉灶

| 现有资产 | 在本期中的角色 |
|---|---|
| `src/lib/rw-methods.ts` 方法卡库 | 技巧课的"浓缩版提醒",课内引用;课是方法卡的展开版 |
| `src/lib/trap-types.ts` 干扰项分类学 | 每课的 "Common Traps" 小节直接复用 |
| 2002 条已重标注题目(domain + difficulty 1-4) | Practice 题优先从现有题库按 skill 匹配抽取,不够才新生成 |
| 8 个 rw 游戏 | 每课末尾 "Train this skill" 链接到对应游戏,课→练闭环 |
| `Progress` 模型(gameType + skill) | 直接复用记录课内练习,skill = 课程 skill slug |

---

## 1. 课程体系(官方 DSAT 分类学 + 2 个薄弱点专项单元)

按 College Board / Khan Academy 官方 Digital SAT R&W 四域分类学搭目录,另加 2 个针对薄弱点的自建单元:

### Unit 0 — The Reading Engine(基础引擎,复述已有方法论)
- L0: The 4-Step Answer Engine(读题抓关键词 → 回原文定位 → 同义改写 → 按分类学排除)

### Unit 1 — Craft and Structure
- L1: **Words in Context**(⭐薄弱点①:难词应对 —— 语境线索、词性/褒贬先判、词根词缀、"不认识也能做")
- L2: Text Structure and Purpose(purpose≠idea,动词+宾语读法)
- L3: Cross-Text Connections

### Unit 2 — Information and Ideas
- L4: Central Ideas and Details
- L5: Command of Evidence — Textual
- L6: Command of Evidence — **Quantitative**(⭐薄弱点②之一:图表+科学数据文章)
- L7: Inferences(专属干扰项集:极端措辞/non sequitur/矛盾/离题/复述)

### Unit 3 — Expression of Ideas
- L8: Transitions(四类过渡词)
- L9: Rhetorical Synthesis

### Unit 4 — Standard English Conventions
- L10: Boundaries(标点边界:分号/冒号/破折号)
- L11: Form, Structure, and Sense

### Unit 5 — Passage-Type Playbook(⭐薄弱点②:跨学科文体专项,自建单元)
- L12: Science Passages(实验结构:hypothesis→method→result→limitation)
- L13: Social Science / Data Passages
- L14: History & Founding Documents(古旧措辞降维读法)
- L15: Literature & Poetry

共 **16 课**。每课结构(Khan Academy 式):
1. **Learn** — 全英文技巧讲解:When to use / Steps / Signal words / Common traps(复用 trap-types)
2. **Worked Example** — 1 道真题式例题,分步 reveal(先自己选 → 逐步拆解 → 对照策略步骤)
3. **Practice** — 8 题,即时反馈,解析逐条对应策略步骤与陷阱类型
4. **Mastery** — 按 skill 记录进度(Not started / Familiar / Proficient / Mastered),课程首页显示掌握度地图

---

## 2. 数据设计

- **课文内容**:不进数据库。`src/content/lessons/*.ts` 每课一个文件(结构化:sections、steps、workedExample),git 版本化、便于人工全量审读。
- **练习题**:复用 `GameItem`,新增 `gameType = "lesson"`;**schema 迁移仅 1 处**:`GameItem` 加可选列 `skill String?` + 索引(现有 domain 太粗,需 skill 级标签)。存量数据不动(⚠️ 幂等、只增,绝不清空已重标注数据)。
- **进度**:复用 `Progress`(gameType="lesson", skill=课程 slug),不迁移。

## 3. 页面 / API 路由

| 路由 | 内容 |
|---|---|
| `/lessons` | 课程首页:Unit 分组 + 每课掌握度(KA 式 mastery map);导航加入口 |
| `/lessons/[slug]` | 单课页:Learn → Worked Example → Practice 三段式,底部链接对应 rw 游戏 |
| `/api/lessons/[slug]/items` | 按 skill 抽取练习题(现有题优先 + 新题) |
| 复用 `/api/progress` | 记录作答 |

## 4. 内容生产管线(执行顺序)

1. **技巧汇编**(用户想法①+②):AI 总结骨架 + 联网校验(College Board、Khan Academy 官方策略、主流备考方法论),产出 `docs/20260801-sat-strategy-compendium.md`,作为 16 课的唯一内容源。
2. **写 16 课课文**(全英文),从汇编落到 `src/content/lessons/`。
3. **配题**:每课 1 例题 + 8 练习 = 144 题。先脚本按 domain/difficulty 从存量 2002 题匹配打 skill 标签,缺口再新生成(遵守内容生成规范:多样、SAT 真实感、正确项位置均衡、挂接词库)。
4. **⛔ 全量逐条复审**:所有新生成/新标注题目答案逐条复审 + 记录,不得抽样(上期教训:35/37 错答集中同批种子,抽样查不出)。

## 5. 开发顺序

1. schema 迁移(GameItem.skill)+ 内容类型定义
2. 技巧汇编研究 → 16 课课文
3. `/lessons` 首页 + `/lessons/[slug]` 课页(Learn + Worked Example)
4. 配题管线 + Practice 交互 + 进度记录
5. 导航接入、全量复审、build + smoke 验证

## 6. 大改三评估

- **架构**:课文走内容文件、题目走既有 GameItem、进度走既有 Progress,新增面仅 2 个页面路由 + 1 个 API + 1 个可空列,无单点风险。
- **质量(DRY)**:方法卡/陷阱分类学/游戏骨架全部复用;课↔游戏互链而非重复造练习引擎。
- **性能**:课文静态打包零查询;练习题按 skill 索引抽取 ≤10 条/次,无 N+1;首页掌握度用 Progress groupBy 走已有索引。

## 7. 风险

1. **内容量大**(16 课 + ~144 题):分单元交付,先 Unit 0/1/5(覆盖两个薄弱点),再补齐其余 —— 但目录一次搭全,未完成课显示 "Coming soon"。
2. **答案错标风险**(最高):管线第 4 步强制全量复审,作为验收项。
3. **英文课文质量**:按 SAT 教学惯用语写,汇编阶段引用官方措辞校准。
4. 本项目 Next.js 为非常规版本:写代码前先读 `node_modules/next/dist/docs/` 相关章节(AGENTS.md 要求)。

## 8. 部署

沿用现状:push main → GitHub Actions → GCP `supply-491510`(绝不用 print-482914)。无需新配置。
