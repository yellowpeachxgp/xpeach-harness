# 上游吸收状态

记录从 `dsh-v0.2.1-rc.3` 到上游 HEAD 的功能吸收与适配状态。

## 已完成

| 项 | 提交 | 验证状态 |
|---|---|---|
| Tooltip 定位引擎 | `d26c41f4f7` | `ui-primitives` 1384 项单测通过 |
| 模型列表缓存 | `7af55268ad` | `packages/llm` 1558 项单测通过 |
| 侧栏固定（panel-pins） | `813b7db6f4` | 2494 项单测通过，界面渲染已核对 |
| 主题图标 sprite | `38497b347c` | 图标渲染已核对 |
| 模型重排序 | `afcb6709cd` | 3 项单测通过 |
| sdk-minimal 检查点（#6369） | `7d656c0511` | sdk-minimal.spec 1/1 通过（port/sdk-parity） |
| SDK 审批 RPC（#6523） | `4fbe6e3f42` | approval.spec 21/21、sdk-client 52/52、transport 19/19；user-question 桥未移植（属 #6351） |
| 会话流快照（#7154） | `ca4c00de46` | session-controller 1060/1060、gateway 30/30、ui-plan 55/55；tsc 通过 |
| SDK 工具对齐（#7107） | `8f236fef35` | tool-parity.spec 3/3、sdk 快照回放 29/29；expected-e2e 依赖未移植项 |

## 产品侧修复（非上游）

| 项 | 提交 |
|---|---|
| 会话追踪头（`X-Session-ID` 等） | `1ff4a4f856` |
| Anthropic `baseURL` 规范化（去除末尾 `/v1`） | `880c1016d6` |
| 协议偏好默认设为 `compatible` | `7df5e491f7` |
| 清理残留 provider 配置 | `f561b6a08f` |
| 渠道故障重试次数收敛（5 → 2） | `46fc479055` |

## 待吸收项分析：富文本引用 + 草稿恢复（`0e49f443dd`）

上游变更共涉及 139 个文件（+4869 行），按模块拆分如下：

| 类别 | 文件数 | 处理策略 |
|---|---|---|
| 快照与测试 | 46 | 移植时同步上游测试与快照 |
| 源码 | 49 | 集中在 4 个工作区包 |
| README / i18n | 44 | 文档与多语言词条同步 |

核心源码变更分布：

| 包 | 变更内容 | 本地冲突情况 |
|---|---|---|
| `session/message-quotes` | 新增包（4 文件） | 无冲突 |
| `ui-primitives` | `QuotePreview`、`HoverCard`、`index` | 无本地改动 |
| `ui-chat` | 12 文件，含新增 `text-interaction.ts` / `text-selection.ts` | `ChatView.tsx` 与 `apply.ts` 存在本地编辑重发相关改动 |
| `bundle/web-app` | `cordis.patch.yml` + `package.json` | 存在本地改动 |

合并策略：先合入无冲突的新增包与基础组件，再对 `ChatView.tsx` 与 `apply.ts` 进行三路合并。

## 待吸收项分析：多语言词条

上游为日语、西班牙语、法语、德语、俄语、葡萄牙语各新增约 288 个语言包文件（每个插件包一份）。后续可优先覆盖核心界面（设置、会话、输入、模型选择等约 20 个包）。

## 阶段汇总

| 项 | 规模 | 备注 |
|---|---|---|
| 富文本引用 + 草稿恢复 | 139 文件 / +4869 行 | 涉及 `api/session-controller`、`ui-chat`、`ui-conversation`、`ui-primitives`，需按包分批合并 |
| 多语言扩展 | 6 种语言 × 多命名空间 | 优先覆盖核心 UI 包 |

## 外部参考：dsh-TUI 路由设计评估

`ccch1mneyyy/dsh-TUI` 的「三接口调度」实质为三个独立智能体运行时并存（`dsh` / `claude` / `codex` 各自独立后端），并非单会话多模型并发调度；其 `modelRoute.ts` 仅负责单个 `(provider, model)` 的优先级解析。

其中具备参考价值的能力协商模型（`backend-manifest.ts` + `capabilities.ts`）已体现在 `packages/xpeach/account` 的 `modelProtocol` 与 `modelInputs` 字段设计中。

## 待跟进验证项

- 模型拖拽排序在桌面端与 Web 端页面的交互回归验证
- Claude 模型经 `anthropic-messages` 协议的端到端连通性验证（待站点对应分组开放渠道）
