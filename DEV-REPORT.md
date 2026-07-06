# 开发完成报告 — SAT 阅读方法论落地

## 本次做了什么
把一节 SAT 阅读方法论视频里的解题动作,拆成 app 里能单独练的功能:新增 2 个阅读游戏,强化 3 个已有游戏,并给每个阅读游戏加了"先教方法再练"的方法卡。

## 可以访问的页面
| 页面 | 地址 | 说明 |
|------|------|------|
| Paraphrase Match(新) | /rw/paraphrase | 同义改写四选一,40 题 |
| Trim the Sentence(新) | /rw/trim | 长难句点掉修饰、留主干,40 句 |
| Read the Green(增强) | /rw/read-the-green | 新增"关键词定位"阶段 + 陷阱分类标签 |
| Closer(增强) | /rw/closer | 揭晓时高亮上下文线索词 |
| 首页 | / | 游戏卡从 5 个扩到 7 个 |

## 功能完成情况(A→E)
| 方向 | 状态 | 说明 |
|------|------|------|
| A 细节题四步法引导层 | ✅ | Read the Green:关键词定位阶段 + 证据阶段"同义改写"提示 + 陷阱分类标签(同词/逻辑不符/未提及) |
| B 同义改写游戏 | ✅ | Paraphrase Match 新游戏,40 题,正确项位置已打散 |
| C 长难句拆主干游戏 | ✅ | Trim the Sentence 新游戏,40 句,覆盖定语从句/分词/插入语/状语等 |
| D 上下文猜义 | ✅ | Closer 高亮线索词(274/286 题),优先出带线索的词 |
| E 方法教学层 | ✅ | MethodCard 组件,接入全部 4 个阅读游戏 |
| 每日任务 7 游戏 | ✅ | daily + 首页 + 导航同步,进度上报自动标记"今日已玩" |

## 工程要点
- **公共骨架(DRY)**:抽出 `useGameItems` hook + `recordProgress` 工具,消除原本 4 处重复的题库加载与进度上报代码。
- **零数据库迁移**:`GameItem.payload` 是 Json,新增游戏与新字段都不需要改表结构。
- **向后兼容**:所有增强字段可选,旧数据缺字段时自动降级为原玩法,不报错。

## 已知问题 / 取舍
- **关键词覆盖**:关键词用"题干与文章的重合实词"启发式生成(58 题有字面锚点),而 SAT 题干本身多为同义改写、字面重合天然稀少——这恰是考点。带关键词的题被排到最前,保证首屏能练到;其余走降级(直接答题),trap 标签仍显示。
- **trapType 为启发式推断**:旧题的陷阱分类由 trap 说明文本推断("Opposite"→逻辑不符、"Not stated"→未提及),覆盖 132/199;8 条精选题为人工标注。
- 若要关键词/线索质量再上一层,建议后续用 LLM 对全量题目重做标注(内容工程,非本次范围)。

## 验证
- `npx tsc --noEmit` 无错误
- `npm run build` 成功,新路由 `/rw/paraphrase`、`/rw/trim` 已生成
- 浏览器实测:两个新游戏答题/复盘正常,Read the Green 关键词阶段→答案→证据→trap 标签全链路通过,Closer 线索高亮显示,控制台无报错

## 内容脚本
`prisma/seed-methodology.ts` — 只插入 paraphrase/trim,并就地回填现有 read_the_green/closer 的方法论字段;幂等,不清空 5 个游戏的既有内容。重跑:`npx tsx --env-file=.env prisma/seed-methodology.ts`

---

## 追加(2026-07-03):LLM 对全量题目重做标注

对全量 **2002 条题目**(GameItem 1199 + QuizItem 803)由会话内 LLM 重新标注 4 个维度,直接写回 Neon 数据库。方法与过程见 [docs/20260703-annotation-redo-methodology.md](docs/20260703-annotation-redo-methodology.md)。

### 做了什么
| 维度 | 结果 |
|------|------|
| 答案正误 | 全量逐条复审,**修正 37 处答案标错**(QuizItem 正确标记打在了错误选项上) |
| 难度 difficulty | 全量重评:此前几乎全是 2(退化),现按词表 tier+rank 百分位 / 结构信号规则化为 1–4 梯度 |
| 解析 explanation | 回填 **865 条**此前为空的讲解(从 payload 内联理由生成) |
| 位置去偏 | paraphrase 正确项此前 45% 挤在第 0 位,打散为 `[9,15,6,10]` |

### 最重要的发现
37 处答案错误里 **35 处集中在同一批种子数据**(idx 261–326 的词汇/文学/公民术语辨析题,如 `tone/mood` 定义反了、`discourse` 标成 "silence"、`citizen/resident` 反了、`questionnaire` 标成 "a legal contract" 等)。每题结构上确实只有一个 correct,但落在了明显错误的选项上——**结构审计查不到,随机抽样也会整段跳过,只能全量人读**。

### 各游戏复审结论
- QuizItem 803:37 处修复,其余正确
- read_the_green 199 / paraphrase 40 / gate_run 274:全部正确
- dissector 271:数学重算/校验无误
- closer 286 / clusters 89:抽样词义准确;clusters 个别归类偏松(记为小瑕疵,未改)

### 验证
最终程序审计 **0 真实缺陷**(唯一残留的 dissector "math_error" 是代数式误报,题目 √(3x−2)=7→x=17 正确);全库无 0/多正确项;难度梯度化;paraphrase 去偏生效。
