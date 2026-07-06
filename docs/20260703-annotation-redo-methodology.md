# 全量题目 LLM 重做标注 — 方法论与进度记录

> 创建:2026-07-03。执行者:会话内 Claude。交付:直接写回 Neon 数据库,无人工审批环节,本文档为过程记录。

## 1. 范围

对全量题目 **GameItem 1199 条 + QuizItem 803 条 = 2002 条**,由 LLM 重新标注四个维度:

| 维度 | 说明 |
|------|------|
| 难度 difficulty | 1-5 分级,纠正当前退化(几乎全为 2) |
| 领域 domain | 校正 5 大 domain 归类 |
| 答案正误 | 校验 `correct` 标记是否真的落在唯一最优项;数学题重算 |
| 解析 explanation | 补齐/改写讲解,保证准确、有教学价值 |

## 2. 审计发现(动手前的现状)

程序化审计(`prisma/_audit.ts`)结论:**结构极干净**,全量仅 2 处机器可判缺陷,其中 1 处为误报:

- ✅ 形状/单一正确项/选项数/主题去重 —— 全部合规。
- ❌ **QuizItem 答案标错**(equivocal):问 "equivocal" 词义,`correct` 却标在 "equivocal" 选项本身(应为 "ambiguous"),explanation 已写明正确义。**已修复**。
- ⚠️ dissector "math_error"(3x-2=49)为**误报** —— 该行是平方后的代数式而非算术式,题目 √(3x-2)=7 → x=17 正确,无需改。
- 🔍 **抽样又发现 1 处机器抓不到的语义错误**(drastic):正确项被标成 "gradual and barely noticeable"(与词义相反,应为 "severe and far-reaching"),explanation 已写明"severe"。**已修复**。

### 位置偏置(正确项索引分布)

| 游戏 | 分布 | 判断 |
|------|------|------|
| gate_run(2门) | [144,130] | 轻微偏 0,可接受 |
| read_the_green(4项) | [61,50,44,44] | 轻微偏 0 |
| paraphrase(4项) | [18,10,9,3] | **强偏 0(45%)**,需打散 |
| QuizItem(4项) | [207,213,208,175] | 基本均衡 |

## 3. 标注策略(按可判性分层)

- **语义 MCQ**(QuizItem 803 + read_the_green 199 + paraphrase 40 = 1042):逐批人读复审 `correct` 是否唯一最优;顺带重评难度、补/改 explanation。这是核心工作量。
- **数学**(dissector 271):逐批重算 workEn / answer,校验 ask/tool 正确项。
- **机械类**(closer 286 / gate_run 274 / clusters 89 / trim 40):难度按规则(词频/tier、步数、上下文线索数)+ 抽查语义;explanation 从 payload 内联理由回填。
- **位置去偏**:paraphrase 选项确定性打散,使正确项分散;correct 标记随迁。

## 4. 难度评分规则(1-5)

- 词汇类(closer / clusters / quiz words_in_context):按目标 Word 的 tier(foundation=易) + rank/frequency;生僻词(bedizened/variegated/congenital)→ 4-5,常见词 → 2-3。
- read_the_green / paraphrase:按篇幅 + 推理层数 + 干扰项迷惑度。
- gate_run:按 transition 类型(基础因果 → 2,让步/对比细分 → 3-4)。
- dissector:按 turns/步数 + 工具复杂度(单步线性 → 2,多步/连续百分比/根式 → 3-4)。

## 5. 进度日志(全部完成)

- [x] 现状盘点 + 全量程序审计
- [x] 方法论文档 + 通用 corrections 应用引擎
- [x] 修复 2 处确认硬错误(equivocal, drastic)
- [x] 机械重标注:难度全量规则化 + explanation 回填 865 条 + paraphrase 去偏 29 条
- [x] **QuizItem 803 全量逐条语义复审** → 又发现并修复 **35 条"正确标记打错选项"**的 cluster bug(idx 261–326 段)
- [x] read_the_green 199 全量复审 → 全部正确
- [x] paraphrase 40 全量复审 → 全部正确
- [x] gate_run 274 全量复审 → 全部正确
- [x] dissector 271 数学校验(纯算术 0 错)+ 抽样重算 → 正确
- [x] closer / clusters 抽样 → 词义准确;clusters 个别归类偏松(congenial/negligent)记为小瑕疵
- [x] 最终审计:0 真实缺陷;难度梯度化;paraphrase 位置去偏生效

## 6. 关键教训:随机抽样会漏掉成批错误

QuizItem 的 37 处答案错误里,**35 处集中在同一批种子数据**(idx 261–326,craft/文学/公民术语),表现为"每题确实只有一个 correct,但 correct 落在明显错误(反义或无关)选项上"——结构审计(查单一正确项)查不到,15 条等距随机抽样也正好跳过。**结论:答案正误必须全量人读,不能靠抽样。**
参见 [[content-generation-standards]]。

## 7. 最终修正统计

| 项目 | 数量 |
|------|------|
| QuizItem 答案修正 | 37(2 硬错误 + 35 cluster) |
| 难度重评(全量规则化) | 2002(GameItem 1199 + QuizItem 803) |
| explanation 回填 | 865 |
| paraphrase 位置去偏 | 29 |
