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
| 富文本引用 + 草稿恢复 | `0e49f443dd` + `c403ca4d7` | 新增 `@xpeach/xph-message-quotes` 包；ui-chat 890、ui-conversation 806、message-quotes 18、session-controller 48 项单测通过；typecheck 5/5 |
| 折叠保留回复 + 仅最终回答开关 | `76bc66b54c` (#6312) + `d5b432ac2c` (#6519) + `62338ac27` | ui-chat 890 项单测通过；typecheck 5/5 |

## 产品侧修复（非上游）

| 项 | 提交 |
|---|---|
| 会话追踪头（`X-Session-ID` 等） | `1ff4a4f856` |
| Anthropic `baseURL` 规范化（去除末尾 `/v1`） | `880c1016d6` |
| 协议偏好默认设为 `compatible` | `7df5e491f7` |
| 清理残留 provider 配置 | `f561b6a08f` |
| 渠道故障重试次数收敛（5 → 2） | `46fc479055` |

## 待吸收项分析：多语言词条

上游为日语、西班牙语、法语、德语、俄语、葡萄牙语各新增约 288 个语言包文件（每个插件包一份）。后续可优先覆盖核心界面（设置、会话、输入、模型选择等约 20 个包）。

## 阶段汇总

| 项 | 规模 | 备注 |
|---|---|---|
| 富文本引用 + 草稿恢复 | 139 文件 / +4869 行 | ✅ 已吸收（port/chat-ux） |
| 折叠保留回复 + 仅最终回答开关 | 46+2+2 文件 / ~+1.2k 行 | ✅ 已吸收（port/chat-ux）；`data-chat-tail-pinned` 视口标记已带上，其 CSS 消费方属未移植的 status-slide/steering-batch 子系统 |
| 多语言扩展 | 6 种语言 × 多命名空间 | 优先覆盖核心 UI 包 |

## 外部参考：dsh-TUI 路由设计评估

`ccch1mneyyy/dsh-TUI` 的「三接口调度」实质为三个独立智能体运行时并存（`dsh` / `claude` / `codex` 各自独立后端），并非单会话多模型并发调度；其 `modelRoute.ts` 仅负责单个 `(provider, model)` 的优先级解析。

其中具备参考价值的能力协商模型（`backend-manifest.ts` + `capabilities.ts`）已体现在 `packages/xpeach/account` 的 `modelProtocol` 与 `modelInputs` 字段设计中。

## 待跟进验证项

- 模型拖拽排序在桌面端与 Web 端页面的交互回归验证
- Claude 模型经 `anthropic-messages` 协议的端到端连通性验证（待站点对应分组开放渠道）
