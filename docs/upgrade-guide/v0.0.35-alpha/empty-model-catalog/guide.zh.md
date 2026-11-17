---
kind: upgrade-guide
description: "PI 的显式空 models 列表停用路由目录，不再继承内置模型。"
---

# 显式空模型目录

[English](guide.md) | 中文

## 变更

`llm-pi-ai` 提供方配置省略 `models` 时继承内置目录。显式 `models: []` 现在停用该路由的目录，模型查找返回 `UNKNOWN_MODEL`，不再恢复内置模型。路由的其他配置仍会校验。非空 `modelOverrides` 不能与显式模型列表同时出现，包括空列表。

XPeach 同步使用显式空列表移除账号模型，避免露出 profile 中的旧定义。无效目录响应会保留原配置，不被解释为空列表。

## 迁移

1. 检查 `cordis.patch.yml` 和已保存设置中的自定义 `llm-pi-ai.providers` 条目。如果原先用空 `models` 列表表示继承内置目录，请删除 `models` 键。
2. 需要停用路由时保留 `models: []`，并移除该条目的 `modelOverrides`。
3. 重启并查看模型选择器：省略目录的路由应显示内置模型，显式空目录的路由不显示模型。继续请求停用路由前，先选择其他可用模型。
