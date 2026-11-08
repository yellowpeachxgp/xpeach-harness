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
| 会话恢复修复簇（v0 subagent/descriptor v1/v2 迁移） | `dffda31215`, `e51cb3959f` (PR #7570) | session-format-v0-to-v1 + session-persistence-jsonl 873 项单测通过 |
| 隐藏 system-prompt 卡片经 chatNode 重建 | `19956a1da9`, `ab627b91ce`, `b45eee4fca` (PR #7527) | ui-chat 84 项单测通过 |
| Markdown 文件链接行号范围（`:24`/`:24-30`/`:24:5`） | `09d9f1152e`, `b1cb1f34e9`, `7ee39638b2`, `db2b8122f2`, `2e5ac1db66` (PR #7056) | ui-primitives 1739 项单测通过 |
| 中键关闭标签页 | `9c5958b07b`, `3d746bc794` (PR #6820) | ui-dockkit + ui-sidebar-right 518 项单测通过 |
| 会话搜索 id 匹配 + 标题 fallback 激活保留 | `cae21f2ab7`, `5e99b92884` (PR #6616), `ab7bd24b6` | session-title 86 项 + ui-workspace 552 项单测通过 |
| 多选题推荐项预选 | `bf8d8494ba`, `07c3c10d2c`, `185eb56a2b` (PR #7407) | ui-user-questions 126 项单测通过 |
| Web 预览 codemirror 懒加载提速 | `4b1d4c814e`, `39d973322b` (PR #6950) | webworker-runtime 987 项单测通过 |

## 运行时修复批次（port/fixes-runtime）

| 项 | 上游 | 验证状态 |
|---|---|---|
| ACP stdout 诊断泄漏（MCP 资源列表） | #7168 `cb7f0878e4`、#7179 `f425304f7b`、#7202 `10551d0e4e` | mcp 147 项单测通过；账号侧部分按 skip-list 丢弃 |
| pi-ai 图片数量上限自动卸载 | #7606 `f77e9a2757` | llm-pi-ai 422 项单测通过 |
| pi-ai system-reminder 保留 | #6606 `185a9d63dd` | 同上（与 #7606 同提交） |
| 模型切换前压缩 | #6345 `09b389cf55` | compaction 247 项单测通过 |
| persistent-bash 输入改写 | #6756 `cd9ee0ee4c` | tool-bash-persistent 27 项单测通过 |
| file-upload resolver dispose | #6567 `854043a205` | session-controller upload spec 22 项单测通过 |
| shiki Go 回溯 | #7004 `ce333bc5ea` | go-highlighting spec 2 项单测通过 |
| web-fetch charset 容错 | #7322 `cf38ed3205` | web 426 项单测通过 |
| glob 前缀快路径 | #7045 `faa2619933` | tool-fs-search 174 项单测通过 |
| agent-loop 系列起点前缀缓存 | #6986 `a677aca248` | system-prompt specs 37 项单测通过；持久化路径测试存在环境性失败（基线同样失败） |

### 插件管理器批次（B7, port/plugin-mgr）

| 项 | 提交 | 验证状态 |
|---|---|---|
| 插件版本更新 + 热更回滚 (#6174) | `82a5ae1744` | plugin-manager/ui-plugin-manager/plugin-detail 测试通过 |
| 插件详情 README 管线 + 新包 plugin-detail (#6279) | `b702109a8c` | `@xpeach/xph-plugin-detail` 13 项单测通过 |
| 详情页描述 (#7048) | `da3055de3e` | 10 个实验性 bundle locale 已更新 |
| 标准模式插件管理 (#6795) | `edde4a0667` | tool-schemas/组合期望已对齐 |
| 安装失败诊断 (#7463) | `6a994ee917` | 依赖未移植的 git-transport(#6943)已裁剪 |
| 设置导航图标 (#7624) | `516ca64acb` | settings.section.icon slot 已接入 |
| bundle 详情页预览 (#6605) | `c9eb8e9349` | BUNDLE_PREVIEWS 已迁移为 DETAIL.md |
| 全部 bundle 详情文档 (#6623) | `8114a96ae4` | 10 个 bundle 获得 DETAIL.md/zh |
| 启用不跳回已安装页 (#6594) | `8d00245b8e` | 组件测试通过 |
| 市场生成跳过私有包 (#6513) | `87a5f371` | 生成器测试通过 |
| 插件市场入主列表 (#6815) | `ce403d850c` | 期望输出已对齐 |
| git dep allowBuilds (#6838) | `644eb3158e` | build-approval 测试通过 |

跳过（成本/缺失前置）：#6564 sticky-header（依赖未移植的布局/工具提示改动）、#7012+#7018 unify lists（boot/official-bundles 包在本树不存在）。

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
