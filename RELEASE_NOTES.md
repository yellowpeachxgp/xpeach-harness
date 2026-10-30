### 主要变更

- **SSO 登录**：统一使用 `sso.xpeach.xyz` 授权登录，登录后自动绑定令牌并持久化保存本地配置。
- **初始化引导**：首次启动提供历史对话迁移、全局规则与 Skill 导入引导。
- **模型与计费同步**：自动拉取账户分组、模型价格与分组倍率，实时显示额度与消耗。
- **更新通道**：设置中新增 `least`（正式版）、`beta`（测试版）、`alpha`（内测版）更新通道切换，支持向下兼容接收更新。

### 安装说明

- **macOS (Apple Silicon)**：下载 `macos-xpeach-harness-*-arm64-unsigned.dmg` 或 `.pkg`。
- **Windows (x64)**：下载 `windows-xpeach-harness-*-x64-unsigned.exe`。
- **Linux (x86_64)**：下载 `linux-xpeach-harness-*-x86_64-unsigned.AppImage`。
