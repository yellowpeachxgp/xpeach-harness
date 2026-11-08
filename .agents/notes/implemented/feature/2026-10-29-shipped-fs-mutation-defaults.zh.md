# Agent Note: 随发行版交付的文件系统变更默认值

Status: implemented

[English](2026-10-29-shipped-fs-mutation-defaults.md) | 中文

## 问题

上游交付时挂载了 `dsh-fs-observation-policy`，因此所有叠加 base 的 profile 中，`write` 与 `edit` 会拒绝模型未读过或读后发生变化的文件。上游比较了启用与禁用该策略下随发行版组合的基准运行，并据此决定默认值；同一上游变更还启用了其新增的 `apply_patch` 工具，本次移植不包含该工具。

## 决定

- `dsh-base` 的 `fs-observation-policy` 行以 `disabled: true` 交付。叠加 base 的 profile 中，所有修改工具直接作用于裸提供方：`write` 直接覆盖，`edit` 直接替换唯一字面量匹配。需要防护的部署把该行改为 `disabled: false` 即可为所有修改工具恢复防护。`sdk-minimal` 不叠加 `dsh-base`，不受影响。
- `write` 与 `edit` 的提示语仍要求先读，但不再点名该策略。
- 策略包按可选产品包归类，因为默认组合都不挂载它。录制策略拒绝场景的 `fs-policy-reject` 通过该场景的 `runtime.cordis.yml` 重新启用该行。

## 曾考虑的替代方案

**在新工具默认值旁继续挂载策略。** 挂载策略会让 `write` 与 `edit` 留在随发行版组合不再需要的防护之下；禁用该行能在一处决定所有修改工具，并为需要防护的部署完整保留策略包。

## 影响

模型可以覆盖或编辑未读过的文件；[升级指南](../../../../docs/upgrade-guide/v0.2.2-alpha.2/fs-observation-policy-default-off/guide.zh.md)给出恢复防护的一行补丁。沙箱围栏、Review 采集与 `fs/observed` 事件不变。

## 测试

`tool-fs` 单测覆盖无防护路径。无密钥 SDK 冒烟通过随发行版交付的 `sdk` profile 编辑模型从未读过的已有文件，并检查磁盘字节。`fs-policy-reject` 在重新启用策略的情况下回放。
