# 代码库结构基线

## 1. 顶层地图

| 路径 | 实际职责 | 证据 |
|---|---|---|
| packages/xpeachcodes/ | 厚应用包：CLI、本地 Server、V1/V2 路由、配置、Provider、Session 编排 | src/index.ts、src/server、src/session |
| packages/core/ | Session V2、Event、Database、Project、Provider、Tool、Permission | src/session.ts、src/event.ts、src/database |
| packages/protocol/ | 公共 HttpApi、路径、Schema、错误和 middleware 契约 | src/api.ts、src/groups |
| packages/server/ | V2 handlers、授权、Location 和纯 V2 route hosting | src/routes.ts、src/handlers |
| packages/client/、packages/sdk/ | 生成客户端、Promise/Effect client、SDK | 各包 src/ |
| packages/llm/ | LLM 协议、transport、流事件 | src/protocols、src/route |
| packages/app/ | Solid Web UI，Desktop Renderer 复用它 | src/entry.tsx、src/app.tsx |
| packages/desktop/ | Electron Main、Preload、Renderer、sidecar、WSL、更新 | src/main、src/preload |
| packages/tui/、packages/ui/、packages/session-ui/ | TUI、通用 UI、Session Timeline/Markdown/Diff | 各包 src/ |
| packages/xpeach/ | XPeach 管理 API、会话和文件加密存储 | src/client.ts、src/session.ts、src/storage.ts |
| packages/console/、stats/、enterprise/ | Console、统计和企业部署模块 | 各目录 manifests、infra/ |
| specs/、.xpeachcodes/ | 契约/规划；agents、commands、themes、plugins 配置 | specs/**、.xpeachcodes/** |

## 2. 入口

- CLI 主入口：packages/xpeachcodes/src/index.ts；yargs 注册 run、serve、TUI、Provider、Session、MCP、GitHub、DB 等命令。
- Headless Server：cli/cmd/serve.ts → src/server/server.ts。
- 混合路由树：src/server/routes/instance/httpapi/server.ts，同时提供 legacy、V2、UI fallback 和 /doc。
- Web：packages/app/src/entry.tsx → app.tsx。
- Electron：packages/desktop/src/main/index.ts；Preload 为 src/preload/index.ts；Renderer 为 src/renderer/index.tsx。
- V2 sidecar：packages/desktop/src/main/sidecar.ts 或 background-cli.ts。
- 核心数据库：packages/core/src/database/database.ts。

## 3. 边界

| 边界 | 应包含 | 不应包含 |
|---|---|---|
| xpeachcodes 应用层 | CLI、实例生命周期、兼容路由、配置 | DOM/Electron 细节 |
| core | Session、Event、Project、Provider、Tool、Database | Window、DOM、桌面 API |
| protocol | Schema、HTTP group、路径、codec、错误 | DB、Drizzle、执行器 |
| server | V2 handlers、授权、Location、route hosting | UI 状态、账户页面 |
| app | 页面、交互、UI 状态 | 直接持有桌面敏感 Token |
| desktop | IPC、safeStorage、sidecar、OS 能力 | 第二套 Session/Provider 引擎 |
| xpeach | XPeach 管理 API 和凭据抽象 | 当前没有完整写回核心模型配置的职责 |

## 4. 组织约定

源码目录主要按领域/运行边界组织，文件多为 kebab-case，类型和类为 PascalCase，函数变量为 camelCase。跨包使用 @xpeachcodes/*，主应用包大量使用 @/ alias。生成客户端在 packages/client/src/generated*；out/dist 是产物，不是源码基线。当前 XPeach 重命名已进入工作树，但 HEAD 仍是 OpenCode 目录。

## 5. 证据

- 根 package.json、turbo.json
- packages/xpeachcodes/src/index.ts、src/server/server.ts
- packages/app/src/entry.tsx、packages/desktop/src/main/index.ts
- packages/protocol/src/api.ts、packages/server/src/routes.ts
