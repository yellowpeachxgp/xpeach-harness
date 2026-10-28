# NOTICE

## 派生关系

**XPeach Harness** 派生自 **DeepSeek Harness**：

| 项 | 值 |
|---|---|
| 上游仓库 | https://github.com/deepseek-ai/deepseek-harness |
| 基线提交 | `687f282e8625c6b8d11ff58211a90524be2e4317` |
| 基线上游版本 | `0.2.1-rc.2` |
| 上游版权 | Copyright (c) 2026 DeepSeek |
| 上游许可证 | MIT |

上游遵循 MIT 许可证，其完整文本见 [LICENSE](LICENSE)。本仓库按 MIT 的要求
保留上游版权声明，并在 [LICENSE](LICENSE) 顶部补充了本项目的版权。

## 我们改了什么

| 范围 | 说明 |
|---|---|
| 包命名空间 | 全部工作区包由 `@deepseek-ai/dsh-*` 迁移为 `@xpeach/xph-*` |
| 产品标识 | 🍑Code 品牌、图标、应用名、Bundle ID、自定义协议 |
| 数据目录 | `~/.dsh` → `~/.xph`，与上游安装完全隔离 |
| 账户体系 | 🍑Code 中转站的访问令牌、xpk 中转密钥与站点会话 |
| 界面 | XPeach 控制台、设置分区、引导流程 |
| 构建发布 | 三端打包、三分支发布契约、自动更新 |

更详细的改名映射见 [docs/upstream/BRAND-MAP.md](docs/upstream/BRAND-MAP.md)，
吸收上游更新的流程见 [docs/upstream/BASELINE.md](docs/upstream/BASELINE.md)。

## 第三方依赖

第三方依赖及其许可证列在 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
