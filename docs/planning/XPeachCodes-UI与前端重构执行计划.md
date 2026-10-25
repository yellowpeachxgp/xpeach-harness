# XPeachCodes UI 与前端重构执行计划

> 文档状态：**已批准，执行中**（2026-09-25 用户批准并授权启动为长任务 goal，
> 授权拉起不限数量 SWE-2-Max 代理进行推理、测试、审查、开发）。
>
> 已批准的三项决策：
> 1. **主题**：浅色为产品基线，兼顾 dark 色系；通过系统 API（`prefers-color-scheme` /
>    Electron `nativeTheme`）提供「浅色 / 深色 / 跟随系统」三档用户可选设置。
> 2. **旧布局**：设定「移除旧布局」里程碑；重新设计一套清晰、Apple 模块风的交互
>    布局取代双轨并存。
> 3. **翻译**：由主控自行决定翻译范围与内容，不再上交决策。
>
> 职责声明：本计划覆盖 **UI / 前端 / 渲染层**。另一代理负责架构与模块调整，本计划
> 刻意不触碰 Session 引擎语义、Server 路由、Core 领域逻辑与 IPC 契约形状；UI 侧需要
> 新数据契约时，先记录为协调项再实施。
>
> 继承约束：不改生产 New API；真实账号验证只用专用测试账号；凭据/Key/Token 不进日志、
> 提交或文档；不以局部测试通过代替完整验收；用户可见英文文案逐字节冻结，全部走 i18n。

---

## 1. 目标与完成定义

把 XPeachCodes 的产品界面从「新工作台叠在旧布局上」的过渡态，推进为《系统修复与 UI
重构规划》第 5 节描述的统一 Agent 产品界面：同一套 V2 组件、同一套信息密度、同一套
交互系统，覆盖工作台、账户、密钥、模型、用量、会话、代码、终端与设置。

完成不是「页面能显示」，而是：

1. spec 5.7 列出的基础组件在 `@xpeachcodes/ui` 中全部存在，带 Props/状态/键盘/焦点/
   宽窄窗口契约、stories 与定向测试；页面层不再自建第二套按钮、表格、徽标。
2. spec 5.6 的页面重写完成：登录、概览（工作台）、API 密钥、模型与分组、用量与日志、
   项目/工作台、Agent 会话、代码工作区、设置与诊断。
3. spec 5.3/5.4/5.5 的交互模型落地：时间线按事件类型分流呈现；代码/Diff/终端与 Agent
   任务共享上下文；命令面板、任务中心、通知、可恢复错误、键盘优先、窄窗口可用。
4. 每条链路有可复现证据：定向单测、App 全量回归、浏览器回归、类型检查、
   `git diff --check`、逐屏 Playwright 审查、修改会话/时间线前后的生产构建性能基线
   对比、验收文档入库 `opencode/docs/验收/`。

## 2. 职责边界（与架构代理的分工）

| 我负责 | 我不碰（协调项） |
|---|---|
| `packages/app` 全部 UI/页面/组件/样式/i18n 键 | `packages/core`、`packages/server`、`packages/protocol` 内部逻辑 |
| `packages/ui`（V1/V2 组件、token、stories） | sidecar/daemon 生命周期、Provider 激活的服务端语义 |
| `packages/session-ui` 展示组件 | `packages/xpeach` 客户端协议实现（我可调用，不改其契约） |
| `packages/desktop/src/renderer`、preload 类型消费 | preload/main 新增 IPC 通道（提出需求 → 架构方实现 → 我接入 UI） |
| `packages/app/e2e`、UI 相关 stories | 数据库 schema、迁移、Event/Session 持久化 |

冲突避免：另一位代理在同仓库并行工作。规则为——**文件级所有权**：我提交的文件不
越过上表左列；共享文件（如 `app.tsx`、路由、context）的改动写清楚意图单独成 commit；
每批工作开始前 `git pull`/`git status` 确认对方提交；不在同一文件做长时间私有改写。
若对方改动破坏我的假设（组件签名、数据契约），记录为阻塞项并修复适配层而非回滚对方。

## 3. 现状盘点（2026-09-25 实测）

### 3.1 已有资产

- **V2 设计系统**：`ui/src/v2/components` 约 50 个组件，每个含 `.tsx` + `.css` +
  `.stories.tsx`；`workspace-section-v2`、`workspace-context-bar-v2`（含 `.md` 契约
  文档与 `.test.ts`）已成为页面组织范式；`metric-card-v2`、`status-badge-v2`、
  `state-v2`、`toast-v2` 等已存在。
- **设计 token**：`ui/src/v2/styles/colors.css` 全色阶 + `theme.css` 语义 token
  （`--v2-background-*`、`--v2-text-*`、`--v2-border-*`…）；主题系统
  `ui/src/theme/` 支持 light/dark 双 variant，默认 `oc-2`，运行时可切换。
- **产品层**：`app/src/xpeach/` 含 `home-dashboard`（工作台头部+指标卡+订阅卡）、
  `agent-task-center`（跨服务任务中心）、`key-control-panel`（445 行 Key 控制板）、
  `model-access-selector`、`harness-interaction-list`，以及 `pages/login.tsx`、
  `pages/account.tsx`（632 行）。
- **会话页骨架**：`pages/session/` 下 composer（permission/question/todo/followup/
  revert docks）、timeline（虚拟列表 + projection/rows）、v2（review panel、文件浏览）、
  terminal-panel(v1/v2)、side-panel。
- **双轨布局**：`settings.general.newLayoutDesigns()` 控制 `data-new-layout`，
  `NewHome`（工作台版）与 `LegacyHome` 并存，`/xpeach/login`、`/xpeach/account`
  已挂载路由。
- **测试基建**：App 单测 931 通过；浏览器回归 41；`e2e/`（playwright.config.ts，
  smoke/regression/user-story/performance/reproduction）；`agent-browser` 与
  playwright-cli 可用；`docs/验收/scripts/playwright-screen-audit.sh` 可复现逐屏审查。
- **i18n**：约 60 语言包，`language.t()` / `language.plural()` API；
  `workbench`（250 键）与 `session.trajectory`（34 键）域仅 en/zh 基本就绪，
  其余语言整块未译（有 coverage 回归护栏钉住基线）。

### 3.2 确认缺口（spec 5.7 对照）

| spec 要求 | 现状 |
|---|---|
| StatusBadge / MetricCard | ✅ `status-badge-v2` / `metric-card-v2` |
| **DataTable** | ❌ 不存在（Key 列表目前是卡片堆叠） |
| **FilterBar** | ❌ 不存在 |
| **DetailDrawer** | ❌ 仅旧 `components/ui/drawer.tsx`，无 V2 |
| **ConfirmDialog** | ❌ 不存在（删除确认各自手写） |
| **EmptyState / ErrorState** | ❌ 不存在（`state-v2` 是状态原语，非页面级空/错态） |
| **Skeleton** | ❌ 不存在 |
| **UsageChart** | ❌ 不存在（用量只有进度条/数字） |
| WorkspaceShell | 半成：`layout.tsx`/`sidebar-shell` 承担，未组件化收口 |
| SessionTimeline | 半成：`pages/session/timeline` 存在但事件形态未按 5.3 表分流 |
| PlanList / ToolCallCard | 半成/散件：docks 有，时间线事件卡未统一 |
| CommandPalette / TaskCenter | ✅ 已有（dialog-command-palette-v2 / agent-task-center） |
| NotificationCenter | 仅有 `context/notification.tsx`，无通知中心 UI |
| ContextInspector | 半成：`session-inspector-surface` 存在 |

### 3.3 Phase 0 执行结果摘要（2026-09-24 实测，详见 `docs/验收/2026-09-24-UI重构Phase0基线.md`）

- 「添加项目」静默失败**已定性并修复**（`d3744113`）：根因是 `choose`/`select` 的
  `healthy === false` 健康门静默 return；现改为 `app.server.unreachable` error toast。
  遗留协调项：health 探针需携带失败原因（401 vs 网络）才能区分「去登录」与「重试」，
  属架构侧数据契约。
- **主题三档已端到端存在**（`ui/src/theme/context.tsx` + 两套设置 UI + 命令面板 +
  preload + Electron `nativeTheme` 透传）。Phase 7 缩减为一致性问题修复：
  preload 默认值 `oc-2` vs app `defaultTheme="new-api"` 不一致、html 底色硬编码、
  `scroll-view.css` 死选择器、注释掉的 media fallback、`loader.ts` 无调用方死 API。
- **新布局无导航侧栏**：`NewLayout`（36 行）只有 titlebar+main；导航靠首页 dashboard +
  tab 条 + 命令面板。旧壳 `LegacyLayout`（2464 行）持有全部侧栏。Apple 模块风新壳
  需要**新建**导航轨组件（见 Phase 2 增补），而非改造旧侧栏。
- **双轨分支面**：全 app 约 100+ 处 `newLayoutDesigns()` 分支，集中在 session.tsx、
  message-timeline.tsx（30 处）、session-side-panel.tsx、各 composer dock。移除旧布局
  是大型机械清理，只能在最后阶段逐屏对照执行。
- **构建基线**：`vite build` 33.27s / 2612 模块 / 主包 2849 kB（gzip 842 kB），
  ghostty-web 1382 kB、emacs-lisp 语法包 780 kB；oc-2.json、dialog-select-model、
  dialog-select-server 存在静/动态双导入导致的分割失效点。
- **token 缺口**：app CSS 硬编码色 27 处、session-ui 8 处、TSX 内联 9 处；xpeach
  品牌插画色与 terminal 调色板合理保留，状态色（`#68b486`/`#bc7c62`/`#c16b5d` 等）
  需在 Phase 1/2 归并入 `--v2-*` 语义 token。
- `account.tsx` 实为 ~700 行单页，但 profile/keys/groups/models/logs/usage 数据
  已全部加载——Phase 3 是路由拆分+呈现重构，数据层无需新增。
- sidecar 状态目录无上限累积——产品行为决策，UI 侧只需在诊断页展示。

## 4. 设计方向

以设计稿（`xpeach-home-peach-billing.png`、`xpeach-key-control-panel-final.png` 等）
与 spec 5.1 为准：

- 浅色为主界面基线（设计稿均为浅色）；spec 的「深石墨」落在 dark variant 的 token
  精修上，不为 dark 单独设计第二套结构。
- 桃色/暖橙为强调色，克用于状态与主行动；高信息密度用卡片分区而非大面积装饰。
- 固定窄侧栏 + 宽内容区；页标题、状态、主动作同一水平线；窄窗口折叠侧栏、表格转
  堆叠行+详情抽屉；核心动作留在首屏。
- 动效只用短淡入、抽屉滑入、进度与状态转场。
- 账户/Key/用量页偏高密度（表格、徽标、抽屉）；工作台保留呼吸感，突出「现在能否用」。

## 5. 分阶段计划

每阶段内部工作单元遵循仓库既有的「小步修复 → 定向测试 → 验收文档」节奏。UI 阶段
不强制每步重打 ARM64 包（纯 UI 变更以 dev/Playwright 证据为准），但每个 Phase 收尾
做一次 Desktop 生产构建 + `package:mac` + 隔离生命周期验收，与既有惯例一致。

### Phase 0 — 基线固化与开放问题（先行，阻塞后续排期）

- 清点 `data-new-layout` 双轨的真实覆盖面：列出仍只在旧布局存在的表面清单。
- 查证「添加项目」静默失败观察：补 `choose` 分支单测（模拟 `focused()` 为空 /
  health false / web 无原生对话框三路径），定性为缺陷则修复为可见反馈，定性为环境
  限制则在 web 平台禁用并注明原因——**不允许保留「可点击但无反应」形态**。
- 记录会话页生产构建性能基线（首屏、会话切换、大包渲染），供后续每步对比。
- 审计 V2 token 覆盖度：补齐 DataTable/Drawer 等需要的 spacing/elevation/typography
  token 缺口。
- 输出：`docs/验收/<date>-UI基线与双轨清点.md`。

门槛：双轨表面清单入库；「添加项目」有定性结论；性能基线数字入库。

### Phase 1 — V2 组件基座补齐

在 `@xpeachcodes/ui` 新增（命名沿用 `-v2` 惯例）：

1. `data-table-v2`：列定义、排序、空态、加载骨架、窄窗口转堆叠行的契约。
2. `filter-bar-v2`：多维度筛选条，受控值、清除、键盘可达。
3. `detail-drawer-v2`：右侧滑入详情，焦点圈禁、Esc 关闭、层级堆叠。
4. `confirm-dialog-v2`：危险操作二次确认（destructive variant、确认文案注入）。
5. `empty-state-v2` / `error-state-v2`：图标+标题+说明+主动作；错误态要求携带
   可操作恢复动作（重试/重新登录/重选 Key）。
6. `skeleton-v2`：行/块/卡片骨架，pulse 动效可被 `prefers-reduced-motion` 关闭。
7. `usage-chart-v2`：轻量 SVG 趋势/占比图（不引重型图表库），loading/empty/error 三态。

每个组件交付：Props 契约、状态矩阵（default/hover/disabled/loading/error/empty）、
键盘与焦点行为、明暗双 variant、`.stories.tsx`、定向 `.test.ts`（纯逻辑部分）、
i18n 默认键。参照 `workspace-context-bar-v2.md` 写 `.md` 契约文档。

门槛：`packages/ui` 类型检查通过；新组件 stories 可被 Storybook/构建加载；
页面层改造时不再新建私有按钮/表格/徽标。

### Phase 2 — 工作台首页收敛

把 `NewHome` 从「dashboard 卡 + 旧布局残件」收敛为 spec 5.6 概览页：

- 首屏四要素齐备：账户状态/余额/用量进度（已有 home-dashboard）、当前 Key 与当前
  模型可用状态、模型请求成功率/延迟/最近请求（读现有 usage 数据，无则如实空态）、
  快速动作（选 Key/选模型/开始对话/开 Key 管理）。
- 项目与最近会话统一进 `WorkspaceSectionV2` 分区，复用 `data-table-v2`/`empty-state-v2`；
  任务中心保留跨服务聚合能力。
- 未登录态：整页登录引导一致化（消除「登录查看余额」与「没有后台任务」的引导强度
  分裂，09-22 审查遗留观察）。
- 布局壳层：确认 `data-new-layout` 下工作台是默认且唯一首页形态；旧 `LegacyHome`
  保留为回退分支但不新增功能。

#### Phase 2 增补（Phase 0 实测后修订）：导航轨 + 账户区路由骨架

新布局当前**没有任何持久导航**（`NewLayout` 仅 titlebar+main）。按已批准的
「Apple 模块风」方向，Phase 2 前置交付导航壳：

- **AppRail（新组件，`packages/ui` 或 `packages/app`）**：56px 图标轨，
  宽窗可展开为图标+标签源列表；分两组——上部工作区（工作台/项目/会话），
  底部账户区（密钥/模型/用量）+ 设置；当前路由高亮；窄窗自动折叠为图标。
  参照 macOS System Settings / Music 的源列表语义。
- **路由骨架**：新增 `/xpeach/account/keys`、`/xpeach/account/models`、
  `/xpeach/account/usage` 路由（Phase 3 填内容，Phase 2 先建空态页+导航可达），
  `/xpeach/account` 改为 overview 子页或重定向。
- titlebar 保留 Safari 式 tabs + 命令面板 + 任务/账户胶囊，不重复承载导航。

门槛：Playwright 逐屏审查首页通过（宽屏/窄窗/未登录/已登录模拟态）；App 全量单测
不下降；首屏无回归（对照 Phase 0 基线：33.27s / 2849 kB）。

### Phase 3 — 账户中心三页

按 spec 5.6 把 `xpeach/pages/account.tsx`（632 行单页）拆为三个可达页面/分区，
路由挂在 `/xpeach/account/*`：

1. **API 密钥页**：`data-table-v2` 列名称/分组/状态/额度/模型限制/最近使用；
   激活 Key 用克制的 primary 动作；`detail-drawer-v2` 承载限制规则/复制/编辑/停用/
   删除；完整 Key 只在创建后的安全确认中显示一次；当前 Key 用稳定「已连接」徽标。
   复用现有 `key-control-panel` 的领域逻辑（`account-model.ts`、可用性判定、
   激活→`refreshProviders` 链路），只重构呈现。
2. **模型与分组页**：按提供商/能力/分组组织；能力徽标（文本/视觉/工具/上下文长度）；
   搜索筛选不整页刷新；模型标注受哪个 Key/分组约束；目录失败显示缓存目录+刷新。
3. **用量与日志页**：时间/模型/Key/分组 `filter-bar-v2`；请求数/Token/消耗/成功率/
   延迟指标卡；`usage-chart-v2` 趋势 + 日志表分离；日志详情脱敏。

门槛：账户/Key/模型访问既有测试与 E2E 不退化；新页面有定向浏览器回归；
中英文案走 `workbench` 域；窄窗口表格转堆叠行验收。

### Phase 4 — Agent 会话页工作台化

最大风险面，切片执行，每片独立验收：

1. **顶部控制区**：会话标题/项目目录/当前模型/当前 Key/连接状态/快速动作一屏可见
   （在 `WorkspaceContextBarV2` 上扩展）；模型不可用时在输入区附近解释+修复动作。
2. **时间线事件分流**（spec 5.3 表）：为每类事件定正式呈现——用户目标块（可编辑
   重提交）、计划步骤列表（当前步/阻塞因）、文件读取卡、文件修改 Diff 卡（接受/
   撤销/跳转）、终端命令卡（命令/输出/退出码/重跑）、工具调用卡（参数摘要/进度/
   结果/错误）、权限请求（影响范围+三选一）、模型流式响应。落点是
   `pages/session/timeline` 的行类型 + `session-ui` 展示组件，不改事件投影语义。
3. **右侧上下文面板**：当前文件/变更/任务计划/模型与 Key/运行指标，可折叠；
   整合现有 inspector 表面。
4. **输入区**：文件/代码片段/目录/图片/快捷命令入口归一；草稿恢复保留。
5. **会话操作**：暂停/继续/取消/重试/分支/压缩/导出在顶部可达。

每片先行生产构建基准对比（AGENTS.md 要求会话/时间线改动必须前后对比性能）。
门槛：时间线相关既有回归（约 117 项 Session 定向 + 31 项时间线 + E2E）不下降；
性能基线无恶化；逐屏审查会话页通过（需项目上下文——用模拟服务构造）。

### Phase 5 — 代码工作区整合

- 文件树/编辑器/Diff/终端共享同一项目上下文（现有 `session-file-browser-tab`、
  `review-panel-v2`、`terminal-panel-v2` 的契约统一收口）。
- Diff 面板按文件/变更块组织：接受、拒绝、恢复、跳回对话来源。
- 终端事件与 Agent 命令关联：从终端跳回触发它的任务步骤。
- 代码行级上下文动作（解释/修复/测试/重构）以可见入口触发，不依赖隐藏命令。
- Agent 写文件的锁定/进行中状态；只读分析/计划/执行/验证四模式在 UI 显式标注。

门槛：文件浏览器/Diff/终端既有回归不退化；来源区分（Agent vs 用户变更）在 UI
可辨识；窄窗口下面板独立折叠。

### Phase 6 — 全局交互系统

- 命令面板补齐 spec 5.5 动作集：开项目/切会话/选模型/跑任务/看 Key/开日志。
- 任务中心升级为全局任务中心：后台 Agent/测试/构建/同步/更新任务统一。
- **通知中心**：基于 `context/notification.tsx` 建 UI——只收需用户处理的状态，
  不把网络请求变成打扰。
- 可恢复错误统一：每个错误携带重试/重新登录/重选 Key/详情/回滚动作
  （复用 `error-state-v2`）。
- 键盘优先收口：快捷键可发现、焦点回收、Esc 退出层级全页面一致。

门槛：键盘走查清单全过；通知不打断核心任务；窄窗口所有弹层可退出。

### Phase 7 — 收敛与验收

- `playwright-screen-audit.sh` 全页面逐屏重审（含会话页——需模拟项目上下文）。
- 明暗双 variant 走查；480px 窄窗走查。
- i18n：`workbench`/`session.trajectory` 域 en+zh 完整；其余 58 语言如实标注
  「回退英文基线」——**AGENTS.md 禁止凭模型知识翻译**，批量翻译需语料核验，
  列为可选后续批次而非本计划完成条件。
- 生产构建 + `package:mac` + 隔离生命周期验收；`app.asar` SHA-256 回读。
- 代码库基线文档（`docs/codebase/*`）刷新 UI 相关段落；交接文档更新。

门槛：逐屏审查零未决缺陷（或全部定性为「环境限制」并记录）；全量单测/浏览器回归/
类型检查通过；安装包生命周期 3/3。

## 6. 验证方法学（沿用仓库已建立的纪律）

- 类型检查：`bunx tsgo --noEmit` 在各包目录（app/ui/session-ui/desktop）；不在根跑 test。
- 单测：`bun test` 在包目录；UI 纯逻辑（model/controller）可测，DOM 渲染不可依赖
  bun test（bun 1.3.14 下 jsxImportSource 与 --conditions=browser 互斥——已取证）。
- 浏览器证据：`playwright-cli`/`agent-browser` 对 `bun dev`（4444，`--strictPort`）
  驱动的 app + 带 `XPEACH_SERVER_PASSWORD` 的本地后端（4096）；**端口必须先
  `lsof` 确认，vite 静默退端口是已知陷阱**；裸起后端 `/api/project` 返 500 属环境
  产物，验证环境必须与 sidecar 生产路径一致。
- Electron 原生能力（目录对话框、IPC、safeStorage）playwright 不可达——此类行为
  只允许标「已在打包版实机脚本验证」或如实标「未验证」，禁止用 Chromium 证据冒充。
- 会话/时间线改动前后必须记录生产构建基准（`packages/app` Vite build + 导航采样）。
- 每批工作产出 `docs/验收/YYYY-MM-DD-<主题>.md`；截图入 `docs/验收/截图/`。
- 提交：conventional `type(scope): summary`；分支 ≤3 词无斜杠；不推远端除非批准。

## 7. 多 Agent 编排（批准后）

以 run_subagent 拉起 SWE-2-Max 代理，按「探索 / 实现 / 审查」角色分工：

- **探索代理**（subagent_explore，只读）：大范围契约清点——如「列出所有仍用旧
  button/表格的表面」「某组件全部调用点」。产出文件:行号清单。
- **实现代理**（subagent_general）：单文件/单组件粒度的独立任务，任务卡写明
  文件所有权、Props 契约、测试要求、禁止越界；并行任务之间文件集不相交。
- **审查代理**（subagent_explore + web_search）：对实现 diff 做规则符合性检查
  （i18n 硬编码扫描、type="button"、a11y 契约、else/any/解构禁用项）+ 对照 spec。
- **我（主控）**：派单、集成、跑验证命令、写验收文档、处理冲突与阻塞升级。

铁律：代理任务卡必须自含上下文（文件路径、契约、禁令）；同一文件同一时间只允许
一个代理写入；每个代理交付以「定向测试+类型检查+lint 干净」为最小门槛，我复核后
才并入。架构代理的并行改动若与本计划冲突，以**对方语义为准、我适配 UI**。

## 8. 风险与待决问题

1. **真实账户/模型链路**：本计划所有页面以模拟数据与既有 IPC 契约验收；真实
   `sk-` Key → `/v1/models` → 流式请求的证据链需专用测试账号，属协调项
   （架构代理/你授权后才能跑），UI 只保证状态呈现正确。
2. **主题方向**（已定）：浅色为产品基线；dark variant 同步精修；设置项提供
   「浅色 / 深色 / 跟随系统」三档，跟随系统经 `matchMedia("(prefers-color-scheme)")`
   实现（Electron renderer 同样生效）。
3. **旧布局**（已定）：设定移除里程碑。Phase 0 先产出双轨表面清单；各 Phase 把旧
   布局上的独占功能逐一迁入新布局；最后一个 Phase 删除 `LegacyHome`、旧布局分支与
   `newLayoutDesigns` 开关（新布局成为唯一形态），并清理仅服务旧布局的样式/测试。
4. **翻译范围**（已定，主控自行决定）：`en` 与 `zh-Hans`（简体）为完整翻译基线；
   `zh-Hant`（繁体）利用已有 `zht-translation-handoff.csv` 交接包完成；其余 58 个
   语言包按既有 coverage 护栏如实回退英文基线——AGENTS.md 禁止凭模型知识翻译，
   完整多语翻译另立项。
5. **「Nothing here yet」旧空态与英文残留**：新工作台内混有旧英文界面（见设计稿
   下半屏），Phase 2 收敛时统一处理。
6. **性能**：时间线虚拟列表是已优化区域，任何行结构改动有退化风险——每片必带
   基准对比，恶化即回滚该切片。

## 9. 总完成定义（勾选式）

- [ ] spec 5.7 组件清单全部存在且页面无私有替代品
- [ ] spec 5.6 八个页面/表面重写完成并有逐屏证据
- [ ] spec 5.3 时间线事件分流表逐项落地
- [ ] spec 5.5 全局系统（命令/搜索/任务中心/通知/可恢复错误/键盘/窄窗）逐项落地
- [ ] 工作台不再出现旧布局拼接残件；双轨表面清单归零或显式豁免
- [ ] 「添加项目」静默路径有定性结论与修复/禁用证据
- [ ] App 全量单测、浏览器回归、类型检查、`git diff --check` 全绿
- [ ] 最新 ARM64 包生命周期 3/3 验收
- [ ] 验收文档入库；docs/codebase 基线刷新
- [ ] 诚实边界声明：真实账户、真实模型、签名公证、多平台、更新链路的验证状态
      逐项标注「已验证/未验证/不适用」
