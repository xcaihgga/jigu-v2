# 康复师今日日程管理（PWA）

面向康复治疗师的轻量级日程管理 PWA：患者安排、待办事项、月度流水、定时提醒。

**数据 100% 本地存储（localStorage），无后端、无服务器，完全离线可用。**

## 公网稳定访问地址

**https://xcaihgga.github.io/jigu-v2/**

部署在 GitHub Pages，长期有效。只要页面安装过（Service Worker 已缓存核心资源），即使断网也能正常打开使用；业务数据存于浏览器 localStore，不依赖网络、不随沙箱休眠丢失。

## 移动端安装方式

### 在手机浏览器中打开上方链接后：

- **Android（Chrome / Edge / 夸克 等）**
  1. 打开链接后，浏览器右下角/顶部会**自动弹出「安装应用」或「添加到主屏幕」提示**，点击即可。
  2. 若未弹出：点右上角 `⋮` 菜单 → **「安装应用」** / **「添加到主屏幕」** → 确认。
  3. 桌面出现「康复师日程」图标，打开即全屏、无地址栏。

- **iPhone / iPad（Safari）**
  1. 打开链接，点 Safari 底部**「分享」按钮（方框+上箭头）**。
  2. 下滑列表，点**「添加到主屏幕」**。
  3. 确认名称「康复师日程」→ 点右上角**「添加」**。
  4. 桌面出现图标，打开即全屏、无地址栏（iOS 系统要求必须在 Safari 中操作，Chrome 无此功能）。

> 提示：iOS 添加后首次请用 Safari 打开一次让 Service Worker 完成离线缓存；之后断网也能用。

## 文件结构

```
/workspace/
├── index.html                 # 应用主入口（PWA）
├── manifest.json              # PWA 清单：名称/图标/全屏配置
├── sw.js                      # Service Worker：离线缓存（网络优先）
├── icons/                     # PWA 图标（192 / 512 / maskable）
├── scripts/gen_icons.js       # 图标生成脚本（Node 手写 PNG 编码器）
├── CODE_WIKI.md               # 代码 Wiki（架构/安全审查报告）
└── .github/workflows/pages.yml# GitHub Pages 自动部署
```

## 开发 / 部署

- 本地预览：`python3 -m http.server 8080` 或 `npx serve .`
- 推送 `main` 分支即自动触发 GitHub Pages 部署（见 `.github/workflows/pages.yml`）。
- **更换图标**：编辑 `scripts/gen_icons.js` 后 `node scripts/gen_icons.js` 重新生成，或直接替换 `icons/` 下同名文件。
- **任何页面更新后请把 `sw.js` 中 `CACHE` 版本号 +1**，触发离线缓存刷新。