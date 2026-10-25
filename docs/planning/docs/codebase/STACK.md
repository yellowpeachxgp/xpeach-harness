# 技术栈基线

测试写入定位
# 技术栈基线

证据采集于 2026-08-30，文档整理于 2026-08-31。目标仓库是 /Volumes/SN 770/Developer/XPeachCodes/opencode；Git 基线为 dev 分支、HEAD dc4449df0d52199704ea4989a5a993ebbc605612。

## 1. 运行时摘要

| 范围 | 已确认值 | 证据 |
|---|---|---|
| 语言 | TypeScript/TSX 为主；扫描到 2712 个 TypeScript、611 个 TSX 文件 | docs/codebase/.codebase-scan.txt |
| 运行时 | 仓库要求 Bun 1.3.14；当前环境 Bun 1.3.11 | package.json；bun --version |
| 包管理 | Bun workspaces、bun.lock | package.json |
| 编排 | Turborepo | turbo.json |
| UI | SolidJS、Vite、Astro、Tailwind、Kobalte | packages/app、packages/web、package.json |
| 桌面 | Electron 42、electron-vite、electron-builder | packages/desktop/package.json |
| 服务 | Effect HTTP/HttpApi、Node HTTP、WebSocket、OpenAPI | packages/xpeachcodes/src/server、packages/protocol |
| 数据 | SQLite、Drizzle ORM；Bun/Node 两套 adapter | packages/core/src/database |
| LLM | Vercel AI SDK 与多家 Provider adapter | packages/xpeachcodes/package.json、packages/llm |

## 2. 高影响依赖和工具

Effect 负责 Layer、Scope、Stream、服务依赖和错误；Drizzle/SQLite 负责 Session、Event、Project、Credential 持久化；ai 与 @ai-sdk/* 负责模型协议和流式输出；SolidJS/Vite/Playwright 负责 Web UI、构建和浏览器测试；Electron 负责 Main、Preload、Renderer、sidecar 和 OS 集成；MCP SDK 负责外部工具；OpenTelemetry/Sentry 负责 trace 和错误观测。

开发命令来自根和包级 package.json：

- 类型检查：bun run typecheck
- lint：bun run lint
- XPeachCodes 测试：bun run --cwd packages/xpeachcodes test
- HTTP API：bun run --cwd packages/xpeachcodes test:httpapi
- Desktop 构建：bun run --cwd packages/desktop build
- Desktop 打包：bun run --cwd packages/desktop package:mac

根 test 脚本主动拒绝执行。当前 Bun 版本低于仓库要求，因此 packages/xpeachcodes 的 build/version 脚本会被版本门槛阻断。

## 3. 配置和环境

配置来自 manifests、turbo.json、bunfig.toml、tsconfig.json、xpeachcodes.json/jsonc、.xpeachcodes/ 和 Electron builder 配置。主要环境变量包括 XPEACH_DB、XPEACH_SERVER_PASSWORD、XPEACH_SERVER_USERNAME、XPEACH_PORT、XPEACH_CHANNEL、XPEACH_SIDECAR_V2、XPEACH_SKIP_CLI_DOWNLOAD、XPEACH_API_KEY、XDG_* 和 XPEACH_DISABLE_* 系列。[TODO] 仓库没有提交 .env.example，完整变量清单需按运行场景维护。

扫描基线为 6607 个文件、约 894286 行代码；大型媒体和 fixture 显著增加仓库体积。

## 4. 证据

- package.json、turbo.json、bunfig.toml、tsconfig.json
- packages/xpeachcodes/package.json、packages/app/package.json、packages/desktop/package.json
- packages/core/src/database/、packages/llm/src/、packages/protocol/src/
- /Volumes/SN 770/Developer/XPeachCodes/docs/codebase/.codebase-scan.txt
