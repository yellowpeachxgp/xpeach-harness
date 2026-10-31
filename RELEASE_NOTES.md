### 主要变更

- **内置离线字体包与字体选择器**：内置 16 个离线 `.woff2` 字体文件（含**苹方 PingFang SC**、**微软雅黑 Microsoft YaHei**、**Inter**、**Plus Jakarta Sans**、**Montserrat**、**Lora**、**JetBrains Mono**、**Fira Code**），并在「设置 → 通用 → 界面与代码字体包」提供 8 组界面字体预设卡片、4 组代码等宽字体胶囊、中英双语实时排版预览与自定义字体栈输入。
- **三端系统弹窗通知**：适配 macOS / Windows / Linux 桌面端与本地守护进程原生系统通知，覆盖任务完成、工具授权确认、等待选择与输入、方案待确认及异常中断场景，支持点击通知唤醒窗口直达对应会话，并提供应用内悬浮通知卡、柔和提示音与通用设置开关。
- **SSO 登录**：统一使用 `sso.xpeach.codes` 授权登录，登录后自动绑定令牌并持久化保存本地配置。
- **初始化引导**：首次启动提供历史对话迁移、全局规则与 Skill 导入引导。
- **模型与计费同步**：自动拉取账户分组、模型价格与分组倍率，实时显示额度与消耗。
- **更新通道**：设置中新增 `least`（正式版）、`beta`（测试版）、`alpha`（内测版）更新通道切换，支持向下兼容接收更新。

### 安装说明

- **macOS (Apple Silicon)**：下载 `macos-xpeach-harness-*-arm64-unsigned.dmg` 或 `.pkg`。
- **Windows (x64)**：下载 `windows-xpeach-harness-*-x64-unsigned.exe`。
- **Linux (x86_64)**：下载 `linux-xpeach-harness-*-x86_64-unsigned.AppImage`。
