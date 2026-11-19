---
kind: upgrade-guide
description: "XPeach profile 播种要求 CLI 资源，macOS 安装器辅助方法不再生成精简兜底配置。"
---

# 唯一的 XPeach 随包 profile 资源

[English](guide.md) | 中文

## 变更

CLI 和桌面从 CLI 包的 `resources/xpeach.profile.yml` 为新建或空的产品 profile 播种。`swe-2-max` 的初始输出上限为 32768。已有非空用户补丁会保留。macOS 安装器在安装副作用前以 `XPH_PROFILE_PATCH_INVALID` 拒绝无效的已有补丁，空 YAML 文档和数组则播种规范资源。每个 pkg 组件在安装载荷前检查目标补丁，profile postinstall 在播种前再次检查，且不求值 `!!js` 表达式。

产品资源缺失时停止播种，不再选择内嵌兜底配置。macOS 安装器辅助方法也要求规范资源或桌面随包副本；两者均不可用时，不再生成精简 profile。

## 迁移

1. 安装完整的 CLI 或桌面分发包。自定义打包必须包含 CLI 资源，并将同一文件复制到桌面资源；仅复制 `lib/` 不够。
2. 普通 Node 安装通过 Node 包导出，从启动入口解析 CLI 包。不携带该包的自定义启动器须将 `MacosInstallerOptions.productProfilePath` 指向规范资源或桌面随包副本。源码工具使用 `apps/cli/resources/xpeach.profile.yml`，替代已移除的桌面源码路径。
3. 确认首次播种成功且包含预期产品插件。修改已有自定义 profile 时，请明确编辑其 `cordis.patch.yml`；升级不会替换它。
