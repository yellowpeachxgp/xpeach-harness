# 外部集成基线

## 1. 集成清单

| 系统 | 类型 | 用途 | 鉴权 | 证据 |
|---|---|---|---|---|
| xpeach.codes / api.xpeach.codes | HTTP API | 账户、Token、分组、模型、用量、分享/GitHub | Bearer 或 Provider key | packages/xpeach/src/client.ts、packages/xpeachcodes/src |
| XPeach Console | OAuth/config API | device flow、用户/组织、远程 Provider config | OAuth、refresh、service key | packages/core/src/plugin/provider/xpeachcodes.ts |
| LLM Providers | HTTP/SDK | OpenAI、Anthropic、Google、AWS、Groq、Mistral 等 | env、Auth DB、OAuth、远程 config | packages/core/src/plugin/provider、packages/llm |
| SQLite | 本地 DB | Session、Event、Project、Credential、Permission | 本地文件 | packages/core/src/database |
| MCP | stdio/HTTP/SSE | 外部工具、资源和 prompt | header/OAuth/进程 | packages/xpeachcodes/src/mcp |
| Git/GitHub/GitLab | CLI/API | VCS、PR/issue、GitHub agent | Git 和 token | packages/xpeachcodes/src/git、cli |
| Electron OS | native | safeStorage、窗口、PTY、更新、WSL | OS keychain、IPC | packages/desktop/src/main |
| AWS/SST/Cloudflare/S3 | 云部署 | Console、stats、enterprise、发布 | SSO/secrets/env | infra、sst.config.ts |
| Sentry/OpenTelemetry | 可观测性 | 错误、日志、trace | DSN/OTLP | core observability、desktop logging |

## 2. 数据存储

- SQLite 主库：V1/V2 Session、Event、Project 等权威本地状态；访问层是 packages/core/src/database；风险是 migration、并发和多宿主协调。
- XDG 文件存储：legacy storage、配置和全局状态；访问层是 packages/xpeachcodes/src/storage；风险是目录迁移和兼容。
- Electron userData JSON：桌面设置和 XPeach Token；访问层是 ElectronSecureStore；风险是 safeStorage fallback。
- XPeach API：云端账户和 Token 权威数据；真实 schema/权限/生产闭环未验收。

## 3. 凭据和可靠性

Server Basic Auth 来自 XPEACH_SERVER_PASSWORD/USERNAME。Provider credential 有环境变量、V1 Auth、V2 Credential/Integration 和远程 config 多个来源。账户 Token 在 Main 进程保存，Renderer 只走 window.xpeach。独立 xpeach 包另提供 AES-256-GCM 文件存储。

Server 端口为 0 时优先 4096，再回退随机端口；XPeach OAuth 支持 authorization_pending、slow_down 和 refresh；XPeach 管理 API 有 typed error 但没有统一 retry/backoff；MCP 和 Provider 层有各自超时/重试策略。

## 4. 可观测性

存在 Effect 日志、文件 logger、electron-log、Sentry、OpenTelemetry 和 Desktop debug log export。[TODO] XPeach 敏感操作审计、跨服务 correlation 和完整业务指标尚未形成证据。本轮没有读取、保存或打印真实密钥。

## 5. 证据

- packages/xpeach/src/
- packages/core/src/plugin/provider/xpeachcodes.ts、packages/core/src/database/
- packages/desktop/src/main/xpeach/、src/main/logging.ts
- packages/xpeachcodes/src/mcp/、src/provider/、src/server/auth.ts
- infra/、sst.config.ts、.github/workflows/
