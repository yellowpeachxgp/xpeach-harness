# 编码约定基线

## 1. 命名

- 文件和目录主要使用 kebab-case，测试使用 *.test.ts(x)。
- 函数/变量使用 camelCase；类型、类、服务使用 PascalCase。
- 常量通常使用全大写或领域命名空间；环境变量使用 XPEACH_ 前缀。
- 跨包使用 @xpeachcodes/*；主应用包内使用 @/ alias。

## 2. 格式和检查

Prettier 配置在根 package.json：semi=false、printWidth=120。Oxlint 配置在 .oxlintrc.json，根命令为 bun run lint。TypeScript 检查由各包的 tsgo 脚本执行，根命令由 Turbo 编排。

本轮根 lint 失败，报告 1 个 error 和约 4895 个 warning。唯一明确 error 位于 packages/session-ui/src/v2/components/prompt-input/index.tsx:163，字符串中的 200B 八进制 escape 被工具判定为废弃写法。XPeach 新增范围单独 lint 为 0 error、17 warnings。

## 3. 模块和错误处理

Effect 服务通过 Context.Service + LayerNode 注册。核心域使用 typed/tagged error 和 Schema error，HTTP handler 将其映射为协议错误；CLI 使用 FormatError/UI.error。XPeachClient 对非 2xx 或 success=false 抛出 XPeachApiError。Server Basic Auth 使用 XPEACH_SERVER_PASSWORD，并在内部使用 Redacted。

Electron Token 优先使用 safeStorage；当前 safeStorage 不可用时会退化为 Base64，这是编码而非加密，不能视为满足严格的 Token 加密要求。

## 4. 测试约定

测试位于包内 test/ 或源码旁；App E2E 在 packages/app/e2e。HTTP API 测试倾向于挂真实 route layer，通过 fetch 或 Effect HttpClient 访问。临时 SQLite、临时 Git repo、fake Layer、mock HTTP、HttpRecorder cassette 用于隔离。快照用于 CLI help、配置兼容和 UI 行为。[TODO] 未发现统一 coverage threshold。

## 5. 证据

- package.json、.oxlintrc.json、bunfig.toml
- packages/xpeach/src/client.ts、storage.ts
- packages/xpeachcodes/src/cli/error.ts、src/server/auth.ts
- packages/xpeachcodes/test/server/、packages/app/e2e/
- 本轮 lint、typecheck、git diff --check 输出
