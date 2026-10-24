# 上游吸收状态

记录从 `dsh-v0.2.1-rc.3` 到上游 HEAD 的吸收进度。每项都要求：调研 → coding → e2e 实测。

## 已完成

| 项 | 提交 | 验证 |
|---|---|---|
| Tooltip 定位引擎 | `d26c41f4f7` | `ui-primitives` 1384 passed |
| 模型列表缓存 | `7af55268ad` | `packages/llm` 1558 passed |
| 侧栏固定（panel-pins） | `813b7db6f4` | 2494 passed，实机截图 |
| 主题图标 sprite | `38497b347c` | 截图确认图标全渲染 |
| 模型重排序（自研） | `afcb6709cd` | 3 单测；**DOM 未实测** |

## 产品侧修复（非上游）

| 项 | 提交 |
|---|---|
| 会话追踪头（`X-Session-ID` 等） | `1ff4a4f856` |
| Anthropic baseURL 去掉 `/v1` | `880c1016d6` |
| 协议偏好默认 `compatible` | `7df5e491f7` |
| 清理残留 provider | `f561b6a08f` |
| 渠道故障重试 5→2 | `46fc479055` |

## 富文本引用 + 草稿恢复（`0e49f443dd`）拆解

原始统计是 139 文件 / +4869 行，但按性质拆开后小得多：

| 类别 | 文件数 | 说明 |
|---|---|---|
| 快照与测试 | 46 | 吸收时直接取上游版本 |
| 源码 | 49 | 集中在 4 个包 |
| README / i18n | 其余 | 纯文档 |

源码分布：

| 包 | 变化 | 本地是否已改 |
|---|---|---|
| `session/message-quotes` | **新增包**（4 文件） | 无冲突 |
| `ui-primitives` | `QuotePreview`、`HoverCard`、`index` | 未改 |
| `ui-chat` | 12 文件，含新增 `text-interaction.ts` / `text-selection.ts` | `ChatView.tsx` 与 `apply.ts` **有本地改动** |
| `bundle/web-app` | patch + package.json | 有本地改动 |

**结论**：真正的冲突面只有 2 个文件（`ChatView.tsx`、`apply.ts`），都是「编辑重发」功能改过的。吸收策略是先整包移植无冲突部分，再对这两个文件做三路合并。

## 多语言：是翻译任务，不是编码任务

上游为日语新增 **288 个 `ja.json`**（每个插件包一份），西/法/德/俄/葡同量级。

建议范围收敛到核心界面约 20 个包（设置、会话、输入、模型选择），覆盖绝大多数使用场景。

## 未开始

| 项 | 规模 | 难点 |
|---|---|---|
| 富文本引用 + 草稿恢复 | 139 文件 / +4869 行 | 涉及 `api/session-controller`、`ui-chat`、`ui-conversation`、`ui-primitives`，四者均有本地改动，需外科式拆解 |
| 多语言 | 6 种语言 × 多命名空间 | 建议先只做日语，风险最低 |

## dsh-tui 结论

`ccch1mneyyy/dsh-TUI` 的「三接口调度」是**三个 agent 运行时并存**（dsh / claude / codex 各一套后端孤岛），不是多模型并发调度。`modelRoute.ts` 只做单个 `(provider, model)` 的优先级解析。

可借鉴的是它的能力协商设计（`backend-manifest.ts` + `capabilities.ts`），已体现在 `packages/xpeach/account` 的 `modelProtocol` / `modelInputs`。

## 已知未验证

- 模型拖拽的 DOM 渲染（代码与单测在，页面未实测）
- Claude 走 `anthropic-messages` 的端到端（站点分组无渠道）
- `elevation-styles.client.spec.ts` 2 个既有失败
- `welcome-notice.client.spec.tsx` 2 个既有失败
