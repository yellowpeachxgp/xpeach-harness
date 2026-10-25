# 架构基线

## 1. 架构风格

已确认：这是多包单体、Effect 服务图、typed HTTP API、事件/流驱动的组合架构。它不是纯 Clean Architecture：同一个主应用包仍同时承载 legacy V1 与 V2，独立 packages/server 则更接近纯 V2。核心约束是 Protocol 声明契约，Server 提供路由/授权适配，Core 持有领域行为，Desktop 复用本地引擎。

## 2. 主要执行流

桌面启动：Electron Main 初始化 userData、日志、代理、证书和 IPC，随后启动 sidecar 或后台 CLI；本地 XPeachCodes Server 监听 HTTP/WebSocket；Renderer 取得地址和 Basic Auth；Solid App 通过 SDK 连接。

Session 执行：HTTP/TUI/SDK prompt → Server handler 或 SessionPrompt → durable SessionInput admission → SessionRunner/SessionProcessor → Provider/LLM stream → ToolRegistry、Permission、filesystem、shell、MCP → EventV2 与 SQLite projection → SSE/WebSocket/SDK/UI timeline。

V2 Session 服务在 packages/core/src/session.ts 负责 create/list/message/context/history/prompt/interrupt/revert 等；Database、Event 和 projector 提供持久化。V2 prompt 是 admission、wake、local execution、LLM stream 和 durable event 的链路。

当前 CLI run 和混合 Web/TUI 仍大量调用 legacy client 命名空间；真正的 V2 调用使用 client.v2。连接混合 Server 时，UI 通过 /global/health 会优先判定 V1；纯 V2 Server 才会走 /api/session、/api/event。此事实来自 app 的协议探测和兼容层代码。

## 3. XPeach 两条链路

Provider 链路：XPeachCodesPlugin → /api/config → catalog provider/model transform → Provider resolve → AI SDK/native route → XPeach 模型端点。该插件已加入 packages/core/src/plugin/provider.ts，支持 Console device OAuth 或 service API key。

账户中心链路：/xpeach/login → window.xpeach.login → Electron IPC → XPeachClient /api/user/self → safeStorage → /xpeach/account → profile/token/groups/models/usage。它和 Provider Integration 是两套凭据语义；当前没有证据证明账户中心选择的 New API Key 会自动写入核心 Auth/Integration/Config。

## 4. 复用模式

- Context.Service + LayerNode 组合 Effect 服务。
- SQLite + Drizzle schema/migration。
- durable Event + projector + SSE replay。
- Provider plugin catalog transform。
- Protocol → Server → generated Client。
- Electron sidecar + local HTTP。
- Preload contextBridge 受控 IPC。

## 5. 架构风险

- V1/V2 双轨造成 schema、fixture、SDK 和 OpenAPI 漂移。
- sidecar 有 v1/v2 两条路径，构建资源和环境变量共同决定实际行为。
- Access Token、New API sk-Key、Console credential 的生命周期尚未统一。
- legacy /doc 可用，但 V2 自动 /openapi.json 实测返回 500。
- 大规模未提交重命名使失败归因、回滚和上游同步困难。

## 6. 证据

- packages/desktop/src/main/index.ts、server.ts、sidecar.ts
- packages/xpeachcodes/src/server/routes/instance/httpapi/server.ts
- packages/core/src/session.ts、src/session/runner、src/database/database.ts
- packages/core/src/plugin/provider/xpeachcodes.ts、src/plugin/internal.ts
- packages/app/src/xpeach/、packages/desktop/src/main/xpeach/、packages/xpeach/src/
