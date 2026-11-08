---
description: "XPeach 产品覆盖层的包地图：提供 SSO 登录、计费与模型操作的账号后端，以及挂载桃子品牌、配额表面与 XPeach 控制台的客户端面孔。"
kind: "package-group"
---

# xpeach/ — XPeach 产品覆盖层

[English](README.md) | 中文

## 摘要

`xpeach/` 组承载叠加在共享 Harness 之上的 XPeach 产品面孔：XPeach 平台的登录与账号操作、品牌呈现以及控制台面板。只有 XPeach 品牌化或由 XPeach 账号支撑的行为才应放入本组；共享机制属于拥有它们的子系统组。每个子包 README 拥有各自的配置与行为；下方相关文档说明这些包挂载的接缝。

## 目录

- [包](#packages)
- [相关文档](#related-documentation)
- [开发说明](#dev-note)

-----

<a id="packages"></a>
## 包

| 包 | 职责 | ctx key |
|---|---|---|
| [`account/`](account/README.zh.md) | XPeach 账号后端：SSO 绑定、密钥生命周期、计费、模型目录与 playground 聊天 remote | — |
| [`client-ui/`](client-ui/README.zh.md) | XPeach 浏览器面孔：品牌标识、配额表面、设置分区与控制台主面板 | — |

-----

<a id="related-documentation"></a>
## 相关文档

- [凭据子系统](../../docs/subsystems/credentials.zh.md)——账号后端所供给的凭据接缝，包括它在流式 playground 调用期间广播的 `xpeach/playground-chunk` 事件。
- [Web 客户端架构](../../docs/subsystems/web-client.zh.md)——客户端面孔挂载到的 slot 与服务表面。
- [Slots 参考](../../docs/subsystems/slots.zh.md)——品牌与配额条目注册进的扩展位。

<a id="dev-note"></a>
## 开发说明

组名在清单中为 `xpeach`，发布的包名为 `@xpeach/xph-*`。XPeach 专属行为放在这里，使共享包保持品牌无关。
