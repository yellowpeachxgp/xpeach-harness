# 测试基线

## 1. 测试栈

主 runner 是 Bun test，当前环境版本为 1.3.11；App E2E 使用 Playwright。断言和隔离主要使用 Bun expect、Effect Test Layer、临时 SQLite、临时 Git repo、mock HTTP/fetch 和 HttpRecorder cassette。根 test 命令主动拒绝执行，必须进入目标包。

## 2. 测试布局

- packages/xpeach/test：XPeach Client、Session、文件加密存储、branding。
- packages/xpeachcodes/test：配置、Provider、Session、Tool、MCP、HTTP API、CLI、VCS、存储。
- packages/core/test、packages/llm/test：底层服务和协议。
- packages/app/src：UI unit；packages/app/e2e：smoke、regression、user-story、performance、reproduction。
- packages/desktop/src：初始化、Renderer、WSL 和 Desktop 边界。

## 3. 范围矩阵

| 范围 | 状态 | 本轮证据 |
|---|---|---|
| XPeach 单元 | 通过 | 18 pass，0 fail |
| xpeachcodes 核心全测 | 非全绿 | 3389 pass、22 skip、1 todo、6 fail |
| HTTP API exerciser | 通过 | coverage/auth/effect 各 208 pass |
| SDK 集成 | 有失败 | 17 pass、1 fail |
| UI unit/browser | 未完整执行 | 脚本和测试文件存在 |
| Playwright E2E | 未执行 | 配置和测试存在 |
| Desktop GUI | 未验收 | 类型检查和产物静态检查完成 |
| 真实 XPeach API | 未执行 | 未使用真实凭据 |

## 4. 本轮新鲜验证

通过项：packages/xpeach 18/18；xpeach、xpeachcodes、app、desktop、core、client、server 类型检查；HTTP API coverage/auth/effect 三模式均 pass=208、fail=0、skip=0、missing=0、extra=0；git diff --check；本地服务未认证 health=401、Basic Auth health=200、V2 health=200、legacy /doc=200。

失败/风险：核心全测的失败包括 model-object 配置 fixture、CORS unauthorized/custom origin、SDK configured directory/workspace、Server.listen concurrent stop、in-process handler；根 lint 为 1 error 和约 4895 warnings；V2 /openapi.json 实测 500；xpeachcodes fresh build 被 Bun 版本门槛阻断。

## 5. 未执行

[TODO] App unit/browser 全量、Playwright E2E、Electron 打包 App 的真实 GUI/Preload/sidecar/账户页、真实 XPeach 登录/Key 管理/Provider/模型调用、多平台运行、签名、公证、更新、发布、Docker build、Nix eval/build、SST diff/deploy 和远程 Actions。

## 6. 证据

- packages/xpeach/test/、packages/xpeachcodes/test/、packages/app/e2e/
- packages/xpeachcodes/package.json、packages/app/package.json、.github/workflows/test.yml、typecheck.yml
- 本轮 Bun test、typecheck、HTTP exerciser、lint、curl health/doc 探针
