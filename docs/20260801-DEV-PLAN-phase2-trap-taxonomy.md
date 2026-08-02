# DEV-PLAN — SAT 方法论第二期(干扰项分类学 · 拆词 · 推断 · 错误 DNA)

> 输入来源:Kate Language 频道 31 篇视频总结(`docs/20260703-katelanguage-digest/`),重点 10 篇:
> evidence-based reading、推断题 zYqe5qnXbfQ、图表题 uPP3aZDqLqc、1550 bootcamp cCX3pg8Muno、
> SSAT 阅读 A0zoPvHW3mY、拆词 LzPW5z6d3fk / 5vNYdVJFRXU / x9A-GuEVIEE、214 词汇 ghQ2piw7Ecg、语法 cQBeAVcSMVE。
> 上一期(方法论落地 A→E)已归档于 `docs/20260703-DEV-PLAN-methodology-A-E.md`。
> 数据现状:全量 2002 条题目已 LLM 重标注,difficulty 已梯度化为 1–4(见 `docs/20260703-annotation-redo-methodology.md`)。
> ⚠️ 所有内容脚本必须**幂等、只增/就地更新、绝不清空**已重标注的数据。
> 规模判定:**大改(BIG)** — 3 个新游戏 + 1 处 schema 迁移(Progress.errorTag)+ 新内容 + 分析视图。

---

## 0. 统一设计洞察:一个"答案选择引擎"贯穿全部题型

把 5 篇阅读/推断/图表/main-purpose/SSAT 材料叠加,同一套动作反复出现,构成 satgame 所有阅读类游戏共享的引擎:

> ① 读题抓关键词(不通读) → ② 回原文定位(只深读题目指向段落) → ③ 正确答案=同义改写、基调一致 → ④ 按**固定分类学**排除干扰项

上一期已落地 ①②③;本期主攻 **④(干扰项分类学)** 并补齐词汇/推断的技能空白。

---

## 补充:我额外发现、并入本计划的问题

除你已列的三点外,读材料时还发现以下缺口(分别并入下方对应任务):

- **A. 推断题的干扰项集是专属的**:极端措辞 / 非逻辑推理(non sequitur)/ 矛盾 / 离题 / 原文复述——与证据题不同,需在推断游戏里单独训练(并入 P3)。
- **B. main-purpose ≠ main-idea**:purpose 题读"动词+宾语"、抓首末句、but/however 后半为重、双破折号中间可略、先定 tone。这是 Read the Green 没隔离出来的子技能(并入 F0 方法卡 + P1 内容标签)。
- **C. 过渡词其实分四类**(组合/对比/强调/因果),Gate Run 现在只混做;冗余(redundancy)、所有格撇号只接名词、分号=替 and/but/because(不加逗号)、冒号=列表/时间/强调末词——Gate Run 可据此深化(并入 P5)。
- **D. connotation 随语境漂移**:褒贬不能按"词"静态判定,必须放进句子里判——决定了褒贬游戏的数据结构必须带例句(并入 P5 设计约束)。
- **E. 近义词要教"细微差别"**(discern vs detect、abide vs condone、sequel/series/sequence),Clusters 现在只归类不辨析(并入 P2 的第三支柱或 Clusters 增强,列为考虑项)。
- **F. 时间预算按题型不同**:语法/词汇 10–20s、图表 70s、数学 90s+;"时间压力本身就是能力"。可给阅读游戏加"考试节奏"计时模式(记为第二批候选)。
- **G. 难度阶梯**:SSAT → SAT 基础 → 1550 冲刺 → DSAT。数据已有 difficulty 1–4,但游戏未利用。新内容一律按重标注同一 rubric 打分,为后续"自适应/分级"留接口(贯穿各任务)。
- **H. 数据教训**:重标注发现 35/37 答案错误集中在同一批种子,**结构审计与抽样都查不到,只能全量人读**。→ 本期所有新内容(拆词/推断/陷阱)生成后必须**逐条 LLM 复审**,不得只抽样(并入各任务验证项 + 风险)。

---

## F0(基础任务):方法卡内容库 —— "丰富提醒"

- **目标**:把散落在各页的 MethodCard 文案收拢成一个中央内容库,并补齐 5 套方法提醒。
- **理由**:你的第 1 点要求。现在每个页面各自硬编码 points,无法复用、难以扩充。
- **做法**:
  - 新增 `src/lib/rw-methods.ts`,导出命名方法集:`evidenceBased`、`inference`、`graphic`、`mainPurpose`、`ssatReading`、`morphology`、`connotation`、`trapTaxonomy`,每套 3–5 条要点(内容取自对应视频)。
  - 各游戏改为 `<MethodCard {...METHODS.inference} />`。
  - 可选:新增 `/methods` 页,集中展示全部方法卡("先教方法再练"的总入口)。
- **文件**:`src/lib/rw-methods.ts`(新)、`src/components/rw/method-card.tsx`(小改,支持 title+points 传入)、各 RW 页引用。

---

## P1:扩充干扰项分类学 + Trap Spotter 专项 【改现有 + 1 新游戏】

- **理由**:你的第 2 点。1500→1550 的分水岭。改动小、直接强化已建的 Read the Green / Paraphrase。
- **权威分类学(canonical,8 类)** —— `trapType` 枚举扩为:

  | 值 | 中文标签 | 判定信号 |
  |---|---|---|
  | `same-word` | 同词复述 | 用原文原词(推断题里=必错) |
  | `opposite` | 与原文相反 | 直接矛盾 |
  | `out-of-scope` | 未提及/需外部知识 | 原文没说 |
  | `too-narrow` | 以偏概全 | 一个细节冒充主旨 |
  | `too-extreme` | 极端措辞 | will/certainly/all/never |
  | `fictitious-comparison` | 虚假比较 | 造出原文没有的 A vs B |
  | `non-sequitur` | 不当推理 | 虚假等价/跳步 |
  | `tone-mismatch` | 基调不符 | 词对但情感色调反了 |

  > 向后兼容:旧值 `wrong-logic` 保留为合法值(前端仍能显示"逻辑不符"),新内容用细分值;回填时把 `wrong-logic` 尽量细化为 `opposite`/`non-sequitur`。
- **改动**:
  - 前端 `TRAP_LABEL` 补全 8 个中文标签(read_the_green、以及 P4 需要用到的地方)。
  - `seed-methodology.ts` 的 `deriveTrapType` 扩展识别更多信号(extreme:/\b(all|never|always|will|certainly|none)\b/;comparison:/\bmore\b.*\bthan\b|比较|更/;等),就地重跑回填。
- **Trap Spotter(新游戏,专项训练最阴险两类)**:
  - **玩法**:给"原文+题干+一个选项",问"这个选项为什么不对?"→ 从 8 类里选;或"它其实是对的?"。专门堆料 **虚假比较 / 极端措辞** 两类。
  - **gameType** `trap_spotter`,**skill** `info_ideas`,**payload** `{ passage?:string, question:string, option:string, verdict:"correct"|TrapType }`。
  - **内容**:约 40–50 条,虚假比较/极端措辞各占大头。
- **文件**:`src/app/rw/read-the-green/page.tsx`(标签)、`src/app/rw/trap-spotter/page.tsx`(新)、`prisma/seed-methodology.ts`(枚举回填 + trap_spotter 内容)。

---

## P2:Morphology 拆词游戏 —— 最大新技能空白 【新游戏】

- **理由**:你的第 3 点。三支柱词汇系统里"词法拆解"完全没有,SSAT/SAT/AP 通吃,天然适合拖拽/切分交互。
- **数据模型**:
  - **词缀词典** `MORPH_AFFIXES`:`{ part:string, kind:"prefix"|"root"|"suffix", gloss:string, note?:string }`(re-=再、in-/im-/il-/ir-=否定、com-/con-=共同、contra=反对、vert=转、meta=变、morph=形、-osis=过程[名词]、nov=新、-an/-ist/-er=表人、cip=抓取、hum=土、en-=加强、dis-=否定、-tive/-able/-atic=形容词…)
  - **可拆词** `MORPH_WORDS`:`{ word, segments:[{text, kind, gloss}], meaning, pos, connotation:"+"|"-"|"0" }`
    例:metamorphosis → [meta/变, morph/形, osis/过程(名词)];incontrovertible → [in/否定, contra/反对, vert/转, ible/形] 整体=确凿(**褒**,教"in- 未必贬")。
- **玩法(三步,呼应三支柱)**:
  1. **切分**:把整词按边界点切成 prefix/root/suffix(点分隔位或拖拽)。
  2. **定词性**:根据后缀选词性(-osis→名词、-tive/-able→形容词、-an/-ist/-er→表人名词)。
  3. **判词义与褒贬**:根据前缀+词根选词义方向 + 标 +/−/中性(强调"拆完看整体,别被 in-/un- 误导")。
  - 教学彩蛋:显示"长词更好拆"的进度反馈(越长的词给更高分/更强正反馈)。
- **gameType** `morphology`,**skill** `words_in_context`(或新增 `word_structure`),**difficulty** 按词长与词缀熟悉度打 1–4。
- **内容**:约 40–60 词 + ~30 条词缀词典;正确切分唯一、词义/词性经复审。
- **文件**:`src/app/vocab/morphology/page.tsx`(新)、`prisma/seed-methodology.ts` 或新 `prisma/seed-morphology.ts`(内容)、`src/lib/rw-methods.ts`(方法卡)。
- **考虑项(并入 E)**:近义词细分可作为 Clusters 的"辨析模式"或 Morphology 的第 4 步,本期先记录,不强做。

---

## P3:推断题游戏(exigence)—— DSAT 最高频 【新游戏】

- **理由**:你排序第 3。DSAT 每篇 4–5 题、最高频;"most logically completes the text"。核心动作与证据题不同:**识别作者写作目的(exigence)→ 预测该补什么 → 排除推断专属干扰项**。
- **玩法**:
  1. 读短文(结尾留空 "___",对应 "which choice most logically completes the text")。
  2. **先答"作者目的"**(exigence)一小步:2–3 选一,选出这段为何而写(把抽象方法变成可练的动作)。
  3. 再从 4 个补全项里选,复盘按**推断专属干扰项**标注:extreme / non-sequitur / opposite / tangent / copy-paste(复用 P1 的 trapType,新增 `tangent` 可并入 out-of-scope)。
- **gameType** `inference`,**skill** `info_ideas`,**payload** `{ text:string, blankMarker:"___", exigenceOptions:[{t,correct}], options:[{t,correct,trap,trapType}], why }`。
- **内容**:约 40–50 条,科学/社科为主(呼应 DSAT 话题分布)。
- **文件**:`src/app/rw/inference/page.tsx`(新)、内容脚本、方法卡 `inference`。

---

## P4:错误 DNA 分析视图 —— 差异化产品功能 【schema 迁移 + 新页】

- **理由**:你排序第 4。bootcamp 反复强调"错题本 + 个人错误模式"(如总选'更有道理'=虚假比较偏好)。复用已记的 Progress + P1 新 trapType。
- **⚠️ 唯一需要迁移**:`Progress` 现在不记"用户掉进了哪类陷阱"。新增可空列:
  ```prisma
  model Progress { …; errorTag String? }  // 记录错选项的 trapType
  ```
  - `POST /api/progress` 接收可选 `errorTag`;`recordProgress()` 增加可选参数。
  - Read the Green / Paraphrase / Trap Spotter / Inference 在**选错**时把该错误选项的 `trapType` 作为 `errorTag` 上报。
- **分析视图** `/insights`:
  - 按 `errorTag` 聚合我的错题 → "你最常掉进:**虚假比较(37%)**、极端措辞(21%)…" + 每类一句应对提示(链到对应方法卡/Trap Spotter 专项)。
  - 按 skill / gameType 的正确率;按 difficulty 的表现(利用已梯度化的 1–4)。
- **文件**:`prisma/schema.prisma`(+errorTag,迁移)、`src/lib/record-progress.ts`、`src/app/api/progress/route.ts`、`src/app/insights/page.tsx`(新)、四个游戏页选错上报。

---

## P5(第二批):图表题 / 褒贬极速 / Gate Run 深化

- **图表题(graphic)**:image/表格 + 短文 + 问题,四步法(读题→找 claim→看图找 pattern→A到D 排除)。设计要点:正确答案要体现"大差异"非仅"不同";概括题选覆盖完整区间者。`gameType graphic`,可用 SVG/简单图表渲染。
- **褒贬极速(connotation)**:Gate-Run 式速度判定 +/−/中性。**约束(并入 D)**:必须带例句,因褒贬随语境漂移;同一个词在两句里可给不同答案。`gameType connotation`。
- **Gate Run 深化(并入 C)**:过渡词按四类(组合/对比/强调/因果)打标签并教;新增"冗余(redundancy)""所有格撇号"两种子题;分号/冒号规则补全。
- **时间模式(并入 F,候选)**:给阅读游戏加可选"考试节奏"倒计时(70s/题),练"每题 1 分钟"。

---

## 跨任务约定

- **零迁移面**:除 P4 的 `Progress.errorTag` 外,所有新游戏与 trapType 扩充都靠 `GameItem.payload:Json`,无需改表。
- **DRY**:全部新游戏复用上一期骨架 `useGameItems` + `recordProgress`(P4 给后者加可选 errorTag)。
- **内容质量(硬性,并入 H)**:拆词/推断/陷阱内容生成后**逐条 LLM 复审**——重标注证明抽样与结构审计查不出整段性错误。
- **难度(并入 G)**:新内容按重标注同一 rubric 打 difficulty 1–4。
- **首页/每日任务**:每加一个新游戏,同步 `GAMES_PER_DAY`、首页 `GAMES`、`nav.tsx`(注意"游戏 N/总数"计数)。本期至多 +3(trap_spotter、morphology、inference),7→最多 10。

## 执行顺序(按你排序)

1. **F0** 方法卡内容库(打底,各任务都要用)
2. **P1** 干扰项分类学 + Trap Spotter(当天见效)
3. **P2** Morphology 拆词
4. **P3** 推断题
5. **P4** 错误 DNA(含迁移)
6. **P5** 第二批(图表/褒贬/Gate Run)

## 大改三评估

- **架构**:新增 3 gameType 走 payload,解耦;唯一迁移 `Progress.errorTag` 可空、向后兼容。分析视图 `/insights` 为纯读聚合。
- **质量(DRY)**:复用既有骨架;方法卡收拢进内容库消除各页硬编码重复。
- **性能**:`/insights` 用 Progress 的 `groupBy(errorTag/skill/gameType)`,走已有索引;新游戏题量 ≤100/次,无 N+1。

## 风险

1. **内容正确性**(最高):拆词的切分唯一性、推断题的 exigence 与答案、陷阱分类的准确——必须全量复审,不可抽样。
2. **trapType 迁移歧义**:`wrong-logic` 细化为 `opposite`/`non-sequitur` 时可能误判——保留旧值兜底,拿不准就不改。
3. **每日任务计数**:游戏数从 7 增到 10,`GAMES_PER_DAY` 与首页/nav 三处必须同步,否则出现"N/总数"错位。
4. **errorTag 采集完整性**:四个游戏都要在选错分支上报,漏一个则错误 DNA 数据有偏。
