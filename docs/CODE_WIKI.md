# 肌骨康复项目 Code Wiki

> 本文档是仓库的完整代码百科，覆盖**整体架构**、**模块职责**、**关键类与函数**、**依赖关系**、**运行方式**等全部关键信息。
> 仓库实际包含**两个独立应用**：① 医智学（肌骨康复学习软件）② 肌骨康复速查 V5.0（临床参考工具），二者共享同一份医学数据源。

---

## 1. 项目概览

### 1.1 双应用定位

| 应用 | 入口文件 | 定位 | 目标用户 |
|------|---------|------|---------|
| **医智学** | `learning-app.html` + `app.js` | 肌骨康复**学习软件**（刷题、打卡、考试、闪卡、错题本） | 康复/骨科学习者 |
| **肌骨康复速查** | `index.html` | 肌骨康复**临床参考工具**（量表评估、康复方案、知识库） | 康复医学专业人员 |

两者共用同一份医学数据源 `data.js`（58 块肌肉 + 218 种疾病），但实现方式完全不同：
- **医智学**：数据先经 `compress_data.js` 压缩为 `data.min.json`，运行时由 `data-loader.js` 异步加载；题库由 `gen_questions.js` 自动生成（4744 道）。
- **肌骨康复速查**：直接内联 `src/*.js` 数据模块与 `data.js`，运行时同步读取。

### 1.2 技术栈

| 分类 | 技术 | 说明 |
|-----|------|------|
| 前端 | 原生 HTML/CSS/JS | 无第三方框架；医智学用 **ES5** 语法保证旧浏览器兼容 |
| 数据 | JSON | 统一 JSON 结构，数据与逻辑分离 |
| 构建 | Python + Node.js | `build_single.py` / `build_offline.py`（Python）、`gen_questions.js` / `compress_data.js`（Node） |
| 部署 | GitHub Pages | `.github/workflows/pages.yml` 自动部署 |
| 存储 | localStorage | 用户进度、错题本、统计、每日打卡 |
| 离线 | 单文件 HTML | 所有 JS 与数据内联进一个 HTML 文件 |

### 1.3 关键数字

- 58 块肌肉（`data.js` 中 `muscles`）
- 218 种疾病（`data.js` 中 `diseases`）
- 4744 道自动生成题目（`questions.js`，单选 + 判断）
- 50+ 临床评估量表、25+ 临床工具、25+ 疾病-量表映射、20+ 临床指南
- 医智学离线版约 3 MB

---

## 2. 项目整体架构

### 2.1 医智学（学习应用）架构

```
┌────────────────────────────────────────────────────────────────┐
│                      learning-app.html                         │
│   UI 层：CSS 主题 + 底部 Tab（首页/知识/学习/我的）+ 弹窗/闪卡   │
└───────────────┬────────────────────────────────────────────────┘
                │  (加载顺序：app.js → data-loader.js → questions.js)
                ▼
┌────────────────────────────────────────────────────────────────┐
│                          app.js                                │
│  · 全局状态 state（金币/经验/等级/连续天数/掌握度/徽章…）        │
│  · 学习方法：费曼/西蒙/SQ3R/刷题                                  │
│  · 每日打卡、考试模式(100题/60分钟)、错题本、学习统计、知识闪卡   │
│  · 三层防护：全局错误捕获 / localStorage 溢出保护 / 安全访问工具 │
└───────────────┬────────────────────────────────────────────────┘
                │
        ┌───────┴────────┐
        ▼                ▼
┌───────────────┐  ┌──────────────────────┐
│ data-loader.js│  │    questions.js      │
│ 异步加载 JSON  │  │  window.questionBank │
│ + 重试+超时保护 │  │  4744 道题           │
└───────┬───────┘  └──────────────────────┘
        ▼
┌──────────────────────┐
│     data.min.json    │  ← 由 compress_data.js 从 data.js 压缩生成
│  {"ms":[…],"ds":[…] }│
└──────────────────────┘
        ▲
┌───────┴───────┐
│   data.js     │  ← 原始医学数据（肌肉+疾病），医智学与速查共用
└───────────────┘
```

### 2.2 肌骨康复速查（参考应用）架构

```
┌──────────────────────────────────────────────────────────┐
│                       index.html                         │
│  主入口：内联 CSS + UI 框架，按需渲染各数据模块           │
└──────────────┬───────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────┐
│               数据模块 (src/ + 根目录)                    │
│  scales.js / scales-extra.js / scales-pro.js  → 评估量表 │
│  clinical-tools.js                            → 临床工具 │
│  knowledge-base.js                            → 知识库   │
│  rehab-protocols.js / protocols-pro.js        → 康复方案 │
│  pain-protocols.js                            → 疼痛方案 │
│  data.js                                      → 肌肉数据 │
└──────────────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│    assets/illustrations/*.webp（解剖/康复/运动插图）      │
└──────────────────────────────────────────────────────────┘
```

### 2.3 构建与部署管线

```
data.js ──compress_data.js──▶ data.min.json
data.js ──gen_questions.js──▶ questions.js（4744 题）
index.html + src/* ──build_single.py──▶ single-file-v5.html（速查单文件版）
learning-app.html + data-loader.js + questions.js + app.js + data.min.json
                       ──build_offline.py──▶ yizhixue-offline.html（医智学离线版）
main 分支 push ──GitHub Actions──▶ GitHub Pages 部署
```

---

## 3. 目录结构

```
/workspace/
├── .github/workflows/pages.yml   # GitHub Pages 自动部署
├── assets/illustrations/         # 60+ 医学插图（解剖/康复/运动，WebP）
├── docs/                         # 文档
│   ├── CODE_WIKI.md              # ← 本文档
│   ├── PROJECT_OVERVIEW.md       # 速查应用项目概述
│   ├── MODULES_DETAILED.md       # 速查应用模块详解
│   ├── DATA_STRUCTURES.md        # 速查应用数据结构
│   ├── BUILD_GUIDE.md            # 速查应用构建/运行指南
│   ├── OFFLINE_README.md         # 医智学离线版说明
│   └── yizhixue-offline.html     # 医智学离线版产物
├── src/                          # 速查应用数据模块
│   ├── scales.js                 # 核心评估量表（20+）
│   ├── scales-extra.js           # 扩展量表（认知/吞咽/心肺）
│   ├── scales-pro.js             # 专业量表（神经/肌力/痉挛/言语）
│   ├── clinical-tools.js         # 临床工具（关节测角/肌力/痉挛/步态等）
│   ├── knowledge-base.js         # 疾病-量表映射 + 临床指南
│   ├── rehab-protocols.js        # 康复方案（PT/OT/ST）
│   ├── protocols-pro.js          # 专业康复方案
│   └── pain-protocols.js         # 疼痛分期治疗方案
├── app.js                        # 医智学主逻辑（ES5）
├── learning-app.html             # 医智学入口
├── data-loader.js                # 医智学数据异步加载器
├── questions.js                  # 自动生成题库（4744 题）
├── gen_questions.js              # 题库生成器（Node）
├── data.min.json                 # 压缩后的医学数据
├── compress_data.js              # 数据压缩脚本（Node）
├── data.js                       # 原始医学数据（58 肌肉 + 218 疾病，约 7MB）
├── index.html                    # 肌骨康复速查入口
├── single-file-v5.html           # 速查单文件版产物
├── build_single.py               # 速查单文件构建脚本
├── build_offline.py              # 医智学离线版构建脚本
├── gh_home.html                  # GitHub Pages 首页（营销/导航页）
├── neurorehab.html               # 神经系统康复评估软件（独立应用）
├── medical-report.html           # 医智学 V5.0 现状报告（静态页）
└── README.md                     # 项目说明
```

---

## 4. 主要模块职责

### 4.1 医智学学习应用

| 模块 | 文件 | 职责 |
|------|------|------|
| 应用入口 | `learning-app.html` | 手机风格 UI（430px 宽）、加载动画、错误遮罩、底部 Tab、全部弹窗结构 |
| 主逻辑 | `app.js` | 学习状态管理、刷题/打卡/考试/错题本/统计/闪卡/徽章等全部业务逻辑，含三层防护 |
| 数据加载 | `data-loader.js` | 异步 XHR 加载 `data.min.json`，带超时（25s/30s）、重试（最多 3 次、指数退避）、字段完整性解析 |
| 题库 | `questions.js` | `window.questionBank = { all: [...] }`，题目含 `q/answer/type/tags` |
| 数据压缩产物 | `data.min.json` | `{ms: [...], ds: [...]}` 精简字段后的数据 |
| 题库生成器 | `gen_questions.js` | Node 脚本，从 `data.js` 自动生成单选/判断题 |
| 数据压缩器 | `compress_data.js` | Node 脚本，将 `data.js` 压缩为 `data.min.json` |
| 离线构建 | `build_offline.py` | 将 `data-loader.js/questions.js/app.js` 内联 + 注入 `data.min.json`，生成 `yizhixue-offline.html` |

### 4.2 肌骨康复速查应用

| 模块 | 文件 | 职责 |
|------|------|------|
| 应用入口 | `index.html` | 内联 CSS + UI 框架，按模块渲染 |
| 核心量表 | `src/scales.js` | VAS/NRS/NDI/ODI/DASH/Barthel 等 20+ 评估量表，均实现 `calculate()` |
| 扩展量表 | `src/scales-extra.js` | 认知（MMSE/MoCA）、吞咽（洼田/GUSS）、平衡（Berg/TUG）、心肺（6MWT/BODE/CAT） |
| 专业量表 | `src/scales-pro.js` | Fugl-Meyer、ASIA、UPDRS、MMT、改良 Ashworth、Frenchay 等 |
| 临床工具 | `src/clinical-tools.js` | 关节测角、肌力分级、痉挛评估、步态分析、感觉/反射检查、BMI/靶心率计算器 |
| 疾病知识库 | `src/knowledge-base.js` | `diseaseScaleMap`（疾病→核心/推荐/可选量表）+ `clinicalGuidelines`（指南摘要，A/B/C 证据等级） |
| 康复方案 | `src/rehab-protocols.js` | PT（颈椎 CMT、ACL、卒中等）/OT（ADL、精细运动、认知）/ST（吞咽、构音、失语）分期方案 |
| 专业方案 | `src/protocols-pro.js` | 运动损伤、ERAS 快速康复、神经重症、心肺康复等进阶方案 |
| 疼痛方案 | `src/pain-protocols.js` | 足底筋膜炎、网球肘、腕管综合征等 16 种肌骨疼痛分期处理 |
| 肌肉数据 | `data.js` | 每块肌肉 26 个字段（功能/损伤/评估/诊断/处理/康复/扳机点/红旗征…） |

### 4.3 其他应用与资源

| 模块 | 文件 | 职责 |
|------|------|------|
| 首页 | `gh_home.html` | GitHub Pages 落地页，品牌宣传与导航 |
| 神经评估 | `neurorehab.html` | 独立的神经系统康复评估软件（侧边栏 + 卡片式 UI） |
| 状态报告 | `medical-report.html` | 医智学 V5.0 现状静态报告页 |
| 插图资源 | `assets/illustrations/` | 60+ WebP 插图（解剖/医疗/康复/运动） |
| CI | `.github/workflows/pages.yml` | push 到 main 后自动部署到 GitHub Pages |

---

## 5. 关键类与函数说明

### 5.1 app.js —— 全局状态 `state`

医智学的核心是单一全局状态对象，所有进度数据最终序列化存入 localStorage（键 `yizhixue_state`）：

```javascript
var state = {
  coins: 0,             // 金币
  exp: 0,               // 经验值
  level: 1,             // 等级（由 exp 换算）
  studyDays: 0,         // 累计学习天数
  completionCount: 0,   // 完成答题组数
  mastery: {},          // 知识点掌握度 {tag: 0~100}
  lastStudyDate: null,  // 上次学习日期
  lastRefreshDate: null,// 上次刷新日期
  streak: 0,            // 连续打卡天数
  totalAnswered: 0,     // 累计答题数
  totalCorrect: 0,      // 累计答对数
  dailyDoneDate: null,  // 每日任务完成日期
  dailyDoneCount: 0,    // 每日任务完成次数
  examDoneCount: 0,     // 考试完成次数
  tagStats: {},         // 各标签正确率统计
  badges: {}            // 徽章解锁状态
};
```

### 5.2 app.js —— 三层防护体系

| 层级 | 位置 | 说明 |
|------|------|------|
| 第一层：全局错误捕获 | 文件开头 IIFE | 重写 `window.onerror` + 监听 `unhandledrejection`，错误入 `window.__errorLog`（最多 10 条）并展示错误遮罩 `errorOverlay` |
| 第二层：localStorage 溢出保护 | `_progressiveCleanupThenSet` | 写入失败时渐进清理：错题本裁到 100 → 30 → 清辅助键（daily/stats）→ 最后才动 `state`，保证用户核心数据 |
| 第三层：安全访问工具 | `safeSetItem/safeGetItem/safeIndex/safeProp/safeParseJSON/safeGetElement/safeSetInnerHTML` 等 | 所有 DOM/JSON/存储访问都经安全包装，异常不中断主流程 |

### 5.3 app.js —— 学习流程关键函数

| 函数 | 行号 | 职责 |
|------|------|------|
| `init()` | 544 | 应用初始化：加载状态、绑定事件、首次渲染 |
| `onAppReady()` | 620 | `dataReady` 事件回调，数据就绪后渲染 |
| `checkDailyRefresh()` | 648 | 跨天判断，执行每日重置/补签逻辑 |
| `creditStudyDay()` | 659 | 学习打卡：累加天数、连续天数、发放金币/经验 |
| `updateLevel()` | 524 | 根据经验值换算等级 |
| `switchTab(tab)` / `pushNav(view)` / `navBack()` | 732/784/789 | Tab 切换与视图栈导航 |
| `renderHomeContent()` | 821 | 渲染首页（今日任务、连续打卡、等级卡片等） |
| `buildMethodCard(method)` / `selectMethod(method)` | 929/942 | 学习方法卡片（费曼/西蒙/SQ3R/刷题）渲染与选择 |
| `buildKnowledgeCards()` | 984 | 批量渲染知识卡片（276 张，含性能优化） |
| `buildMuscleCard` / `buildDiseaseCard` | 1009/1039 | 肌肉/疾病卡片渲染 |
| `showMuscleDetail` / `showDiseaseDetail` | 1070/1084 | 详情展示 |
| `renderFlashcardModal` / `showFlashcard` / `nextFlashcard` / `prevFlashcard` / `flipFlashcard` | 1107–1158 | 知识闪卡：翻面、前后切换 |
| `quizThisKnowledge` | 1165 | 基于当前知识点随机出题 |
| `openModal` / `closeModal` / `onMaskClick` | 1210–1242 | 通用弹窗控制 |

### 5.4 app.js —— 每日任务与考试模式

| 函数 | 行号 | 职责 |
|------|------|------|
| `renderDailyStart()` | 1252 | 每日任务开始界面 |
| `startDailyQuiz()` / `startDailyQuizWithQuestions(questions)` | 1280/1289 | 启动每日刷题 |
| `renderExamStart()` | 1308 | 考试说明界面 |
| `startExamMode()` | 1337 | 启动考试（100 题 + 60 分钟） |
| `startExamTimer()` / `updateExamTimer()` | 1361/1370 | 考试计时 |
| `pauseExam()` / `resumeExam()` | 1394/1417 | 考试暂停/恢复 |
| `renderExamQuestion()` | 1439 | 渲染当前题目 |
| `selectExamOption(index)` | 1524 | **核心答题逻辑**：判定对错（判断题为 `answer ? 0 : 1`），更新 UI、状态、tagStats、错题本、金币/经验 |
| `getCorrectText(q, correctIndex)` / `getUserAnswerText(q, userAnswer)` | 1592/1602 | 答案文本解析 |
| `nextExamQuestion()` | 1612 | 进入下一题 |
| `updateTagStats(q, isCorrect)` | 1624 | 更新知识点正确率统计 |
| `submitExam()` / `confirmSubmitExam(early)` | 1651/1642 | 交卷（支持提前交卷确认） |
| `renderExamResult(score, total, accuracy, elapsedSec)` | 1715 | 考试结果页（得分/正确率/用时） |

### 5.5 app.js —— 错题本与统计

| 函数 | 行号 | 职责 |
|------|------|------|
| `addWrongQuestion(question, userAnswer)` | 1808 | 错题入错题本（localStorage 键 `yizhixue_wrong`） |
| `renderWrongQuestions()` | 1829 | 渲染错题列表 |
| `removeWrongQuestion(index)` | 1913 | 单题移除 |
| `clearAllWrong()` / `doClearWrong()` | 1920/1925 | 清空错题本（带确认） |
| `renderStats()` | 1935 | 学习统计页（累计答题/正确率/标签分布） |
| `updateStats()` | 688 | 更新统计 |
| `buildBadge(icon, name, unlocked)` | 2016 | 徽章渲染 |
| `confirmReset()` / `doReset()` | 2025/2029 | 重置所有进度（带确认） |

### 5.6 data-loader.js —— 数据加载器

| 函数 | 职责 |
|------|------|
| `setLoadingText(text, sub)` | 更新加载提示 |
| `showError(msg, sub)` | 显示错误遮罩，暴露为 `window.__showLoadError` |
| `parseMuscles(ms)` | 将 JSON 肌肉对象解析为完整字段对象（21 字段，缺省补空串） |
| `parseDiseases(ds)` | 疾病解析（20 字段，兼容 `ICD-10编码`/`ICD10编码` 字段名笔误） |
| `loadData()` | 主流程：XHR GET `data.min.json?v=时间戳`，30s 超时，成功回调 `onDataLoaded` |
| `handleLoadFailure(msg, sub)` | 失败处理：最多重试 3 次，指数退避（2s/4s/8s），超限显示错误 |
| `onDataLoaded(data)` | 设置 `window.muscles`/`window.diseases`，标记 `__dataReady`，派发 `dataReady` 事件 |

**事件契约**：加载完成后派发 `window.dispatchEvent(new Event('dataReady'))`，`app.js` 通过 `onAppReady()` 监听该事件开始渲染。

### 5.7 gen_questions.js —— 题库生成器（Node）

| 函数 | 职责 |
|------|------|
| `getField(obj, ...keys)` | 兼容字段名笔误，多候选键依次取值 |
| `truncate(s, n)` | 按字符截断，过长加省略号 |
| `shortOption(s, n)` | 取第一句作为单选选项文本 |
| `extractPhrase(text)` | 从长文本中提取有意义短语（先按句切分取中段，再按逗号切） |
| `shuffle(arr)` | Fisher-Yates 洗牌 |
| `pickDistractors(pool, n, correct, excludeSet)` | 挑选干扰项 |
| `addSingle(q, correct, distractors, tags)` | 生成单选题（`{q, options, answer, type:'single', tags}`） |
| `addJudge(q, answer, tags)` | 生成判断题（`{q, answer, type:'judge', tags}`） |
| `genJudge(itemName, fieldName, fieldValue, otherPool, tags)` | 判断题生成：50% 概率正确陈述，否则从其他条目抽取干扰陈述，抽取失败回退正确陈述 |
| `genMuscleQuestions(m)` | 从肌肉数据生成题目（区域单选、功能、损伤、评估、处理等） |
| `genDiseaseQuestions(d)` | 从疾病数据生成题目（病症部位、分类、治疗方案等） |
| `genCrossQuestions()` | 跨肌肉/疾病关联题 |

**执行方式**：`node gen_questions.js`，用 `vm` 沙箱解析 `data.js`，输出 `questions.js`（写入 `window.questionBank`，含 `all` 数组）。

### 5.8 compress_data.js —— 数据压缩器（Node）

- 用 `vm` 解析 `data.js` 提取 `muscles`/`diseases`
- 只保留学习所需字段（肌肉 21 字段、疾病 19 字段），字段值清洗（去换行、压缩空白、超长截断：肌肉 150 字符、疾病 200 字符）
- 输出 `{"ms":[…],"ds":[…]}`
- 执行：`node compress_data.js`

### 5.9 src/* —— 速查应用数据结构

所有数据模块遵循统一 JSON 结构，核心是**评估量表的 `calculate()` 统一接口**：

```javascript
// scales.js —— 评估量表
{
  id: 'ndi',               // 唯一标识
  name: 'NDI颈椎功能障碍指数',
  shortName: 'NDI',
  category: 'neck',        // pain/neck/back/upper/wrist/lower/ankle/function
  description: '…',
  reliability: '信度',      // 信度信息
  reference: '文献',        // 参考文献
  totalScore: 50,
  type: 'choice',          // slider/number/choice/yesno/custom
  question: '…',           // 单题量表的题目
  questions: [{ text, options, scores }],  // 多题量表
  interpretation: [{ min, max, level, color, desc }],  // 评分解释区间
  calculate: function(answers, customActivities?) {
    return { score, maxScore, detail? };   // ← 统一评分接口
  }
}
```

```javascript
// clinical-tools.js —— 临床工具
{
  id: 'rom_shoulder',
  name: '肩关节活动度',
  category: '关节测角',    // 关节测角/肌力评估/痉挛评估/步态分析/感觉评估/反射检查/生命体征/体格评估/运动处方
  type: 'reference' | 'calculator',
  content: {               // reference: joint/position/goniometer/movements
    formula, inputs,       // calculator: 计算器输入
    calculate(...args),    // calculator: 计算函数
    interpretation         // calculator: 结果解释
  }
}
```

```javascript
// knowledge-base.js
const diseaseScaleMap = {
  '脑卒中': { core: [...], recommended: [...], optional: [...] }
};
const clinicalGuidelines = [
  { id, title, category, source, year, recommendations: [{text, level}], relatedScales }
];
```

```javascript
// rehab-protocols.js / pain-protocols.js —— 分期方案
{
  id, category: 'PT'|'OT'|'ST'|'疼痛', categoryName, name, icon, evidence,
  description,
  stages: [{ name, goal, duration, exercises: [...], cautions, criteria? }]  // pain 另含 causes/symptoms
}
```

### 5.10 构建脚本

| 脚本 | 语言 | 职责 |
|------|------|------|
| `build_single.py` | Python | 按 `script_map` 将 `index.html` 引用的 9 个外部 JS 内联，输出 `single-file-v5.html` |
| `build_offline.py` | Python | 将 `data-loader.js`（注入内嵌数据分支）、`questions.js`、`app.js` 内联，并注入 `<script>window.__INLINE_DATA__=…</script>`，输出 `yizhixue-offline.html` |

---

## 6. 依赖关系

### 6.1 医智学运行时依赖图

```
learning-app.html
  ├── app.js                 （主逻辑）
  │     └── dataReady 事件 ←── data-loader.js
  ├── data-loader.js         （异步加载 data.min.json）
  │     └── window.muscles / window.diseases → 供 app.js 使用
  ├── questions.js           （window.questionBank）
  └── data.min.json          （运行时数据，XHR 加载）
```

### 6.2 医智学生成/构建依赖图

```
data.js ──(Node vm 解析)──▶ compress_data.js ──▶ data.min.json
data.js ──(Node vm 解析)──▶ gen_questions.js ──▶ questions.js
learning-app.html + data-loader.js + questions.js + app.js + data.min.json
         ──build_offline.py──▶ yizhixue-offline.html
```

### 6.3 速查应用依赖图

```
index.html
  ├── scales.js / scales-extra.js / scales-pro.js   （评估量表）
  ├── clinical-tools.js                             （临床工具）
  ├── knowledge-base.js                             （知识库）
  ├── rehab-protocols.js / protocols-pro.js         （康复方案）
  ├── pain-protocols.js                             （疼痛方案）
  └── data.js                                       （肌肉数据）
       └── 知识库/方案数据模块引用量表名称与疾病信息（弱耦合）
build_single.py ──内联以上全部──▶ single-file-v5.html
```

### 6.4 CI 依赖

```
main 分支 push / workflow_dispatch
  → actions/checkout@v4
  → actions/configure-pages@v5
  → actions/upload-pages-artifact@v3（上传整个仓库根目录）
  → actions/deploy-pages@v4 → GitHub Pages
```

---

## 7. 数据流（端到端）

```
医学知识采集（人工整理）
    ▼
data.js（58 肌肉 + 218 疾病，全量字段）
    ├──▶ compress_data.js ──▶ data.min.json（精简字段，供医智学运行时）
    ├──▶ gen_questions.js ──▶ questions.js（4744 题）
    └──▶ index.html（速查应用直接使用）
            ▼
医智学运行时：
  data-loader.js 异步加载 data.min.json → 派发 dataReady
    → app.js 渲染首页/知识卡片
    → 用户答题 → selectExamOption 判定 → 更新 state / tagStats / 错题本
    → saveState 写入 localStorage（yizhixue_state）
    → 每日打卡/连续天数/经验/等级/徽章 联动更新
```

---

## 8. 项目运行方式

### 8.1 医智学（学习应用）

```bash
# 方式一：本地 HTTP 服务器（推荐，XHR 加载 data.min.json 需要）
cd /workspace
python3 -m http.server 8000
# 浏览器访问 http://localhost:8000/learning-app.html

# 方式二：直接使用离线版（无需服务器）
# 浏览器打开 /workspace/yizhixue-offline.html 或 /workspace/docs/yizhixue-offline.html
```

### 8.2 肌骨康复速查（参考应用）

```bash
cd /workspace
python3 -m http.server 8000
# 浏览器访问 http://localhost:8000/index.html
# 或直接打开单文件版 single-file-v5.html（无跨域问题）
```

> 注意：直接 `file://` 打开 `learning-app.html` 时 XHR 加载 `data.min.json` 可能受浏览器跨域限制，建议用本地服务器或离线版。

### 8.3 重新生成题库

```bash
cd /workspace
node compress_data.js     # 重新生成 data.min.json
node gen_questions.js     # 重新生成 questions.js（4744 题）
```

### 8.4 重新构建单文件版本

```bash
cd /workspace
python3 build_single.py   # 生成 single-file-v5.html（速查）
python3 build_offline.py  # 生成 yizhixue-offline.html（医智学离线版）
```

### 8.5 部署

```bash
# 推送到 GitHub 仓库 main 分支，GitHub Actions 自动部署到 GitHub Pages
git add .
git commit -m "更新"
git push origin main
# 访问 https://<username>.github.io/<repo>/
```

### 8.6 开发流程

1. **改数据**：编辑 `data.js` → 重跑 `compress_data.js` / `gen_questions.js`
2. **改学习逻辑**：编辑 `app.js` / `learning-app.html`（ES5 语法），刷新浏览器即可
3. **改速查内容**：编辑 `src/*.js` → 重跑 `build_single.py`
4. **验证**：浏览器打开对应页面；测试离线版用 `build_offline.py` 后打开产物

### 8.7 浏览器兼容性

- 医智学：Chrome 60+ / Firefox 55+ / Safari 12+ / Edge 79+ / 微信内置浏览器 / iOS Safari 12+（ES5 + 特性检测）
- 速查：Chrome 60+ / Firefox 55+ / Safari 12+ / Edge 79+ / Opera 47+

---

## 9. 扩展指南（摘要）

完整扩展示例见 [DATA_STRUCTURES.md](DATA_STRUCTURES.md) 第 6 节，要点如下：

| 扩展目标 | 操作 |
|---------|------|
| 新增评估量表 | 在 `src/scales.js` push 量表对象，实现 `calculate()` + `interpretation` |
| 新增临床工具 | 在 `src/clinical-tools.js` push 工具对象，指定 `type`（reference/calculator） |
| 新增疾病映射 | 在 `src/knowledge-base.js` 的 `diseaseScaleMap` 添加 `core/recommended/optional` |
| 新增临床指南 | `clinicalGuidelines.push({...})`，标注证据等级 A/B/C |
| 新增康复方案 | `rehabProtocols.push({...})`，指定 `category` 与 `stages` |
| 新增肌肉/疾病 | 在 `data.js` 追加对象，重跑 `compress_data.js` + `gen_questions.js` |
| 新增学习功能 | 在 `app.js` 新增函数并接入 `state` 持久化（`saveState`） |

---

## 10. 文档导航

- [Code Wiki（本文档）](CODE_WIKI.md)
- [项目概述](PROJECT_OVERVIEW.md) —— 速查应用整体说明
- [核心模块详细说明](MODULES_DETAILED.md) —— 速查应用模块逐项详解
- [数据结构与关键函数](DATA_STRUCTURES.md) —— 数据结构与扩展指南
- [构建与运行指南](BUILD_GUIDE.md) —— 速查应用构建/部署/FAQ
- [医智学离线版说明](OFFLINE_README.md) —— 离线版使用与重新生成
