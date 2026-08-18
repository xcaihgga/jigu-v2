# 康复师今日日程管理 — Code Wiki

## 一、项目概述

**康复师今日日程管理**是一个面向康复治疗师的轻量级日程管理 PWA（渐进式 Web 应用），以**单文件 HTML** 形式交付，完全离线运行。核心能力是帮助康复师管理每日患者治疗安排、待办事项，并提供定时提醒、月度流水统计、数据备份等实用功能。

| 属性 | 说明 |
|------|------|
| 文件数 | 1 个 HTML 文件 + 1 个 ZIP 包 |
| 技术栈 | React 18（UMD 内联）+ Babel standalone + Tailwind CSS 3（预编译内联） |
| 运行方式 | 浏览器直接打开 HTML 文件即可，无需构建/服务器 |
| 数据持久化 | `localStorage` |
| 离线支持 | 完全离线，无网络依赖 |
| 安装能力 | PWA 安装到桌面（manifest 内联为 data URI） |

---

## 二、项目文件结构

```
/workspace/
├── README.md                          # 仓库说明
├── 康复师日程管理_离线版.html           # 主应用文件（~2.7MB，包含全部代码）
└── .trae-html-share-packages/
    └── 康复师日程管理_离线版.html.zip   # 同上文件的压缩包（分发用）
```

**说明：** 这是一个纯前端单文件应用。所有依赖（React、ReactDOM、Babel、Tailwind CSS）均通过 `<script>` 和 `<style>` 标签内联到 HTML 中，打开即用。

---

## 三、技术架构

### 3.1 技术栈

| 层次 | 技术 | 版本 | 引入方式 |
|------|------|------|----------|
| UI 框架 | React / ReactDOM | 18.3.1 | `<script>` UMD 内联 |
| 编译 | Babel standalone | - | `<script>` 内联，浏览器即时编译 JSX |
| 样式 | Tailwind CSS | 3.4.19 | 预编译为纯 CSS 内联 |
| 状态管理 | React Hooks | - | `useState` / `useEffect` / `useCallback` / `useMemo` / `useRef` |
| 存储 | Web Storage API | - | `localStorage` + `sessionStorage` |
| 音频 | Web Audio API | - | 原生 `AudioContext` 生成提醒蜂鸣 |
| PWA | Web App Manifest | - | 内联为 data URI |

### 3.2 架构模式

```
┌─────────────────────────────────────────────────┐
│                   浏览器窗口                      │
│  ┌─────────────────────────────────────────────┐ │
│  │              App (根组件)                     │ │
│  │  ┌─────────┐  ┌──────────┐  ┌────────────┐ │ │
│  │  │  Header  │  │TabNav + │  │  Calendar   │ │ │
│  │  │ (标题栏) │  │ 日期选择 │  │  View       │ │ │
│  │  └─────────┘  └──────────┘  └────────────┘ │ │
│  │  ┌──────────────┐  ┌───────────────────┐   │ │
│  │  │PatientSchedule│  │    TodoList       │   │ │
│  │  │  (患者日程)   │  │   (待办列表)      │   │ │
│  │  └──────────────┘  └───────────────────┘   │ │
│  │  ┌──────────────┐  ┌───────────────────┐   │ │
│  │  │MonthlyRevenue │  │ ReminderModal     │   │ │
│  │  │  Panel        │  │ (提醒弹窗)        │   │ │
│  │  └──────────────┘  └───────────────────┘   │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │             localStorage                    │ │
│  │  schedule_{date}_patients / todos           │ │
│  │  reminder_times / reminder_sound_enabled    │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**核心设计决策：**
- **单文件**：方便分发，邮件/微信传输即用
- **localStorage 数据模型**：以日期为 key 隔离数据，天然支持多日数据
- **React Hooks**：函数式组件 + Hooks 管理状态和副作用
- **Portal 弹窗**：所有 Modal 使用 `ReactDOM.createPortal` 渲染到 `document.body`

---

## 四、数据模型

### 4.1 核心数据结构

#### 患者（Patient）

```javascript
{
  id: string,           // 唯一标识，格式 "{timestamp}-{random}"
  name: string,         // 患者姓名（必填）
  startTime: string,    // 开始时间 "HH:mm"（必填）
  endTime: string,      // 结束时间 "HH:mm"（必填，须 > startTime）
  gender: string,       // "男" | "女" | "未指定"
  age: number | null,   // 年龄
  department: string,   // 科室（如 PT、OT、骨科）
  disease: string,      // 疾病诊断（如脑卒中后遗症）
  fee: number | null,   // 治疗费用（元）
  notes: string,        // 注意事项
  completed: boolean,   // 是否已完成
  createdAt: number     // 创建时间戳
}
```

#### 待办（Todo）

```javascript
{
  id: string,           // 唯一标识
  text: string,         // 待办内容
  completed: boolean,   // 是否已完成
  createdAt: number     // 创建时间戳
}
```

#### 提醒时间配置

```javascript
[
  { time: "15:30", enabled: true },   // 提醒时间点 + 是否启用
  { time: "18:00", enabled: false }
]
```

### 4.2 localStorage Key 命名规范

| Key 格式 | 类型 | 示例 |
|----------|------|------|
| `schedule_{YYYY-MM-DD}_patients` | 患者数组 JSON | `schedule_2026-08-17_patients` |
| `schedule_{YYYY-MM-DD}_todos` | 待办数组 JSON | `schedule_2026-08-17_todos` |
| `reminder_times` | 提醒时间配置数组 | `[{time:"15:30",enabled:true}]` |
| `reminder_sound_enabled` | 声音开关 | `"true"` / `"false"` |
| `reminded_{date}_{time}` | 提醒去重标记（sessionStorage） | `reminded_2026-08-17_15:30` |
| `pwa_install_dismissed` | PWA 横幅关闭状态 | `"true"` |

---

## 五、模块与组件

### 5.1 工具函数模块

| 函数 | 行号 | 说明 |
|------|------|------|
| `toDateKey(date)` | L2264 | Date → `"YYYY-MM-DD"` 字符串 |
| `getTodayKey()` | L2271 | 获取今天的日期 key |
| `genId()` | L2274 | 生成唯一 ID：`"{timestamp}-{base36}"` |
| `formatDateCN(dateKey)` | L2277 | 日期 key → 中文格式（如 "2026年8月17日 星期一"） |
| `getStorageKey(dateKey, type)` | L2284 | 拼接 localStorage key |
| `calcDailyRevenue(patients)` | L2287 | 计算当日已完成患者的费用合计 |
| `getMonthRevenue(year, month)` | L2296 | 计算指定月份的流水汇总 |
| `getDayStatus(dateKey)` | L2315 | 获取某天状态：`'none'` / `'pending'` / `'done'` |
| `getDayRevenue(dateKey)` | L2327 | 获取某天流水金额 |
| `getCalendarDays(year, month)` | L2338 | 生成月视图日历网格（周一为起始） |
| `formatMoney(n)` | L2351 | 数字 → 带千分位的金额字符串 |
| `getWeekDays(dateKey)` | L2510 | 获取指定日期所在周的 7 天日期 key |
| `getPrevWeekKey/getNextWeekKey` | L2524-2533 | 前/后一周日期 key |

### 5.2 提醒系统工具函数

| 函数 | 行号 | 说明 |
|------|------|------|
| `loadReminderTimes()` | L2357 | 读取提醒时间设置（默认 15:30） |
| `saveReminderTimes(times)` | L2372 | 保存提醒时间设置 |
| `getTodayPendingCount()` | L2377 | 获取今日未完成项数量 |
| `loadReminderSoundEnabled()` | L2392 | 读取声音开关（默认 true） |
| `saveReminderSoundEnabled(enabled)` | L2397 | 保存声音开关 |
| `playReminderBeep()` | L2401 | Web Audio API 播放 800Hz 方波蜂鸣 |
| `playReminderSoundIfEnabled()` | L2423 | 检查开关后播放 |

### 5.3 数据导出/导入工具

| 函数 | 行号 | 说明 |
|------|------|------|
| `exportMonthCSV(year, month)` | L2431 | 导出月度 CSV（含 BOM 头，Excel 友好） |
| `downloadFile(filename, content, mime)` | L2454 | 触发浏览器文件下载 |
| `getTomorrowKey(dateKey)` | L2470 | 计算明天的日期 key |
| `exportAllData()` | L2480 | 导出全量 JSON 备份 |
| `importAllData(jsonString)` | L2493 | 从 JSON 恢复数据，返回恢复条数 |

### 5.4 UI 组件清单

| 组件 | 行号 | 功能说明 |
|------|------|----------|
| `TimePickerDialog` | L2538 | 钟表盘时间选择弹窗（SVG 绘制 24 小时刻度） |
| `TimePicker` | L2629 | 时间选择触发按钮 + 弹窗包装 |
| `GenderSelect` | L2646 | 性别按钮式单选（男/女/未指定） |
| `PatientFormModal` | L2662 | 新增/编辑患者表单弹窗，含完整表单校验 |
| `PatientItem` | L2791 | 单条患者卡片，支持点击编辑、勾选完成、删除 |
| `ConfirmModal` | L2844 | 通用二次确认弹窗 |
| `DailyRevenueBar` | L2867 | 当日流水统计栏（绿色完成/蓝色进行中） |
| `PatientSchedule` | L2891 | **患者日程主模块**：列表、排序、统计、批量操作 |
| `TodoList` | L3021 | **待办列表模块**：增删改查、完成切换 |
| `ReminderModal` | L3122 | 定时提醒弹窗，展示未完成的患者 + 待办 |
| `ReminderSettingsModal` | L3188 | 提醒设置面板：多时段配置、声音开关、测试 |
| `MonthlyRevenuePanel` | L3360 | 月度流水概览面板 |
| `TabNav` | L3393 | Tab 切换导航（日程视图/日历视图） |
| `DateSelector` | L3417 | 日期选择器（前一天/后一天/回到今天） |
| `DayPreviewModal` | L3451 | 日历点击日期弹出只读预览 |
| `CalendarView` | L3536 | **日历视图**：月视图/周视图双模式 |
| `Toast` | L3684 | 轻量级提示组件（自动消失） |
| `DataSyncButtons` | L3704 | 数据备份/恢复按钮组 |
| `PWAInstallBanner` | L3743 | PWA 安装提示横幅 |
| `App` | L3792 | **根组件**：状态管理 + 数据持久化 + 提醒调度 |

### 5.5 App 组件状态一览

| 状态 | 类型 | 说明 |
|------|------|------|
| `selectedDate` | `string` | 当前查看的日期 key |
| `activeTab` | `string` | `'schedule'` 或 `'calendar'` |
| `calendarCursor` | `{year, month}` | 日历游标 |
| `calendarRefresh` | `number` | 日历刷新触发器 |
| `patients` | `Patient[]` | 当前日期的患者列表 |
| `todos` | `Todo[]` | 当前日期的待办列表 |
| `showReminder` | `boolean` | 提醒弹窗显示状态 |
| `previewDate` | `string \| null` | 日历预览弹窗的日期 |
| `reminderTimes` | `Array` | 多时段提醒配置 |
| `showReminderSettings` | `boolean` | 设置面板显示状态 |
| `currentTime` | `string` | 实时时钟 |
| `todayTriggeredCount` | `number` | 今日已触发提醒次数 |
| `reminderSoundEnabled` | `boolean` | 声音开关 |
| `toastMessage` | `string \| null` | Toast 消息 |
| `weekRefDate` | `string` | 周视图参考日期 |

---

## 六、关键业务流程

### 6.1 数据持久化流程

```
用户操作（增/删/改）
    ↓
setPatients / setTodos (React setState)
    ↓
useEffect 监听 patients/todos 变化
    ↓
写入 localStorage (schedule_{date}_patients / _todos)
    ↓
calendarRefresh++ → 触发日历视图重新扫描
```

### 6.2 定时提醒流程

```
页面加载 / reminderTimes 变化
    ↓
scheduleTimers() 清理旧定时器
    ↓
为每个 enabled=true 的时间点注册 setTimeout
    ↓
到达时间点 → checkAndRemind()
    ↓
读取今日未完成的患者 + 待办
    ↓
有未完成项 → 弹出 ReminderModal + 播放蜂鸣
    ↓
sessionStorage 记录已触发标记（防止重复）
```

**防漏机制：**
- 跨天检测：每分钟检查日期是否变更
- 页面可见性检测：切回页面时补漏检查
- 手动测试：右下角 "🧪 测试提醒" 按钮

### 6.3 患者新增流程

```
点击"添加患者"
    ↓
PatientFormModal (mode='add')
    ↓
表单校验（姓名必填、时间必填、结束 > 开始）
    ↓
生成新 ID (genId)，completed=false
    ↓
onAdd → setPatients([...prev, newPatient])
    ↓
useEffect 自动写入 localStorage
```

### 6.4 数据备份/恢复

```
备份：
  handleBackup() → exportAllData() → downloadFile(.json)

恢复：
  handleRestore(file) → FileReader → importAllData()
  → 重载所有状态 + 刷新日历
```

### 6.5 导出月度流水

```
handleExportCSV()
    ↓
exportMonthCSV(year, month)
    ↓
遍历所有 schedule_*_patients key
    ↓
筛选当月已完成记录
    ↓
生成 CSV（含 UTF-8 BOM）
    ↓
downloadFile(.csv)
```

---

## 七、依赖关系

### 7.1 外部依赖（均为内联，无需安装）

| 依赖 | 版本 | 用途 |
|------|------|------|
| React | 18.3.1 | UI 框架（UMD 构建） |
| ReactDOM | 18.3.1 | DOM 渲染 |
| Babel standalone | - | 浏览器端 JSX → JS 编译 |
| Tailwind CSS | 3.4.19 | 原子化 CSS 样式（预编译） |

### 7.2 组件依赖关系图

```
App
├── Header（标题栏）
│   └── DataSyncButtons
├── PWAInstallBanner
├── MonthlyRevenuePanel
├── TabNav
├── DateSelector
├── PatientSchedule
│   ├── PatientFormModal（via 添加/编辑按钮）
│   │   ├── TimePickerDialog
│   │   ├── TimePicker
│   │   └── GenderSelect
│   ├── PatientItem（×N）
│   └── DailyRevenueBar
├── TodoList
│   └── （内联表单，无独立子组件）
├── CalendarView
│   └── DayPreviewModal（via 日期点击）
├── ReminderModal
├── ReminderSettingsModal
├── Toast
└── ConfirmModal（via "全部完成"按钮）
```

---

## 八、运行方式

### 8.1 直接打开（最简单）

```bash
# 直接用浏览器打开
xdg-open /workspace/康复师日程管理_离线版.html
# 或者
open /workspace/康复师日程管理_离线版.html
```

### 8.2 本地 HTTP 服务器（推荐）

某些浏览器对 `file://` 协议下的 localStorage 有限制，建议使用本地服务器：

```bash
# Python 3
cd /workspace && python3 -m http.server 8080

# Node.js
cd /workspace && npx serve .

# 然后访问
# http://localhost:8080/康复师日程管理_离线版.html
```

### 8.3 安装为 PWA

1. 在 Chrome/Edge 中打开页面
2. 地址栏出现"安装"提示 → 点击安装
3. 桌面会出现独立应用图标，可全屏独立运行

### 8.4 数据备份与恢复

- **备份：** 顶部栏 → 点击 📤 图标 → 下载 JSON 文件
- **恢复：** 顶部栏 → 点击 📥 图标 → 选择之前备份的 JSON 文件
- **CSV 导出：** 患者日程模块 → "导出本月 CSV" 按钮

---

## 九、关键设计说明

### 9.1 离线优先

所有数据存储在 `localStorage`，无后端服务。这意味着：
- 数据仅存储在当前浏览器
- 清除浏览器数据会丢失记录（需定期备份）
- 换设备需通过备份/恢复功能迁移

### 9.2 PWA 支持

- 内联 manifest（data URI），无需外部文件
- Service Worker 未实现（当前不需要离线缓存复杂资源）
- 支持 iOS 添加到主屏幕

### 9.3 响应式设计

- 移动端和桌面端自适应
- 日程视图：移动端单列，桌面端双列（患者 + 待办并排）
- 日历视图：月视图 / 周视图自由切换

### 9.4 提醒机制

- 使用 `setTimeout` 注册一次性定时任务
- 多时段可配置（默认 15:30）
- `sessionStorage` 去重防止重复弹窗
- 跨天自动重置提醒
- 页面不可见时不调度（性能优化）
- 支持 Web Audio API 蜂鸣提示（可开关）

---

## 十、代码行号索引

| 模块 | 起始行 | 结束行 | 大小 |
|------|--------|--------|------|
| Tailwind CSS（预编译） | L17 | L2148 | ~2130 行 |
| React / ReactDOM（UMD） | L2150 | L2249 | ~100 行 |
| Babel standalone | L2251 | L2252 | ~2 行 |
| **用户代码起始** | **L2253** | - | - |
| 工具函数（日期/ID/存储） | L2264 | L2353 | ~90 行 |
| 提醒/声音工具函数 | L2356 | L2425 | ~70 行 |
| 导出/导入工具函数 | L2430 | L2533 | ~105 行 |
| TimePickerDialog | L2538 | L2623 | ~85 行 |
| TimePicker | L2629 | L2640 | ~12 行 |
| GenderSelect | L2646 | L2655 | ~10 行 |
| PatientFormModal | L2662 | L2783 | ~122 行 |
| PatientItem | L2791 | L2837 | ~47 行 |
| ConfirmModal | L2844 | L2861 | ~18 行 |
| DailyRevenueBar | L2867 | L2884 | ~18 行 |
| PatientSchedule | L2891 | ~L3020 | ~130 行 |
| TodoList | L3021 | L3121 | ~101 行 |
| ReminderModal | L3122 | L3187 | ~66 行 |
| ReminderSettingsModal | L3188 | L3359 | ~172 行 |
| MonthlyRevenuePanel | L3360 | L3392 | ~33 行 |
| TabNav | L3393 | L3411 | ~19 行 |
| DateSelector | L3417 | L3445 | ~29 行 |
| DayPreviewModal | L3451 | L3530 | ~80 行 |
| CalendarView | L3536 | ~L3683 | ~148 行 |
| Toast | L3684 | L3703 | ~20 行 |
| DataSyncButtons | L3704 | L3742 | ~39 行 |
| PWAInstallBanner | L3743 | L3786 | ~44 行 |
| **App 根组件** | **L3792** | L4216 | **~425 行** |
| 渲染入口 | L4221 | L4221 | 1 行 |

---

## 十一、扩展建议

| 方向 | 说明 | 难度 |
|------|------|------|
| Service Worker | 添加离线缓存和 PWA 完整支持 | 中 |
| 云同步 | 接入后端 API 或云存储（如 Firestore） | 高 |
| 多语言 | 当前硬编码中文，可提取 i18n | 低 |
| 单元测试 | 为工具函数和数据模型添加测试 | 低 |
| TypeScript | 为数据结构添加类型定义 | 中 |
| 患者历史 | 查看单个患者的历史治疗记录 | 中 |
| 数据可视化 | 月度/年度流水图表 | 低 |
| 多设备同步 | WebDAV / iCloud Drive 同步 | 高 |

---

## 十二、安全审查报告（v1.1 修复）

### 12.1 已修复问题

| 编号 | 严重度 | 问题描述 | 修复方案 |
|------|--------|----------|----------|
| P0-1 | 🔴 致命 | ID 生成碰撞风险（同一毫秒可能重复） | 引入时间戳+高熵随机(12位)+进程计数器的三段式 ID |
| P0-2 | 🔴 致命 | localStorage 配额溢出静默失败 | 捕获 QuotaExceededError，Toast 提示用户 |
| P0-3 | 🔴 高 | 删除患者无确认弹窗，误删不可恢复 | 增加 ConfirmModal 二次确认 |
| P0-4 | 🔴 高 | 删除待办无确认弹窗 | 统一使用 ConfirmModal |
| P1-1 | 🟠 中 | 费用计算浮点精度丢失（如 333.33×3 = 999.98999...） | 引入 yuanToFen/fenToYuan，整数分运算 |
| P1-2 | 🟠 中 | 备份恢复无版本校验，可注入恶意数据 | 增加版本号、Schema 校验、异常数据过滤 |
| P1-3 | 🟠 中 | 数据加载无 Schema 校验，坏数据直接渲染 | 加载时过滤掉不合法的患者对象 |
| P1-4 | 🟠 中 | 跨天后提醒定时器不会自动补发 | 增加补发逻辑：时间已过但未触发时立即触发 |

### 12.2 新增工具函数

| 函数 | 说明 |
|------|------|
| `escapeHtml(str)` | 安全转义 HTML 文本（防 XSS 辅助） |
| `validatePatient(p)` | 患者对象 Schema 校验 |
| `yuanToFen(yuan)` | 元转分（整数运算） |
| `fenToYuan(fen)` | 分转元 |
| `calcDailyRevenueFen(patients)` | 按分计算日流水 |
| `APP_VERSION` | 应用版本标识（备份格式校验用） |

### 12.3 架构改进说明

1. **金额精度**：所有金额运算统一使用"分"为单位的整数运算，最后展示时除以 100 保留两位小数
2. **数据校验**：在"写入 → 存储 → 读取"全链路添加 Schema 校验，异常数据被自动过滤
3. **版本兼容**：备份文件包含 `__app_version` 字段，恢复时校验版本号兼容性
4. **错误可观测**：localStorage 写入失败时通过 Toast 告知用户具体原因（配额不足 vs 一般错误）

### 12.4 剩余风险（未修复，需关注）

| 编号 | 风险 | 说明 |
|------|------|------|
| R-1 | 无端到端加密 | 患者敏感数据（姓名、病史、费用）明文存储在 localStorage。建议用户在多设备/公共电脑上使用时注意 |
| R-2 | 无服务端同步 | 数据仅本地存储，设备故障/浏览器重装会丢失。需定期备份 |
| R-3 | localStorage 容量 | 累积一年以上的日记录可能触及 5MB 上限。建议定期清理过期数据或使用 IndexedDB |
| R-4 | 无单元测试 | 当前无自动化测试覆盖，依赖手动验证 |
