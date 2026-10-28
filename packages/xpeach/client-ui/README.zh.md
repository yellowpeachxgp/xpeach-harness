---
description: "面向 Web 客户端的 XPeach 账号设置分区、额度胶囊与品牌界面。"
kind: "package-reference"
---

# @xpeach/xph-client-ui

[English](README.md) | 中文

## 概述

浏览器端插件，挂载生成的 `xpeach` Remote 贡献，并在 Web 客户端中注册 XPeach 设置分区、额度胶囊、额度提示与品牌界面。

## 目录

- [使用此包](#use-this-package)
- [已知限制与后续工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

<a id="use-this-package"></a>
## 使用此包

在 Web 组合中与 `@xpeach/xph-account` 一起挂载 `@xpeach/xph-client-ui`，即可渲染已登录资料、令牌管理、模型市场、调用日志与角落额度胶囊。

## 已知限制与后续工作

<a id="known-limitations-and-deferred-work"></a>

- 创建或删除令牌以及管理端资料视图需要在 `@xpeach/xph-account` 中绑定站点访问令牌；仅绑定中转密钥的会话以只读模式展示用量与调用日志。

<a id="dev-note"></a>
### 开发备注

所有客户端界面文案均通过中英文语言字典路由，且仅通过 `xpeach` Remote 命名空间读取 Host 状态。
