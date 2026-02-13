# OpenClaw 自定义 Channel 开发指南

本文档介绍如何为 OpenClaw 开发自定义消息渠道（Channel）插件。这是 [扩展开发](/guide/#extension-development) 的进阶专题。

---

## 1. 概述

### 1.1 什么是 Channel

Channel（渠道）是 OpenClaw 中消息来源和目标的抽象。每个 Channel 代表一种消息平台，例如 Telegram、WhatsApp、Discord、Signal、Matrix。

### 1.2 Channel 的职责

| 职责 | 说明 |
|------|------|
| **消息接收** | 监听来自平台的消息，转发给 OpenClaw 处理 |
| **消息发送** | 将 OpenClaw 的回复发送到目标平台 |
| **配置管理** | 解析和验证 Channel 配置 |
| **状态检查** | 提供健康检查和诊断信息 |
| **访问控制** | 实现 DM 策略、群组策略等安全机制 |

### 1.3 架构概览

```
OpenClaw Gateway
    ├── Channel Manager
    │   ├── Telegram Plugin
    │   ├── WhatsApp Plugin
    │   ├── Discord Plugin
    │   └── MyChannel Plugin
    └── 各平台 API
```

---

## 2. 实现方式选择

### 方式 A：核心 Channel（Core Channel）

- **位置**：`src/telegram/`, `src/discord/` 等
- **适用**：官方支持的渠道
- **缺点**：需要修改核心代码，合并到主仓库

### 方式 B：插件 Channel（Extension Plugin）⭐ 推荐

- **位置**：`extensions/` 或 `~/.openclaw/extensions/`
- **适用**：自定义渠道、第三方渠道、实验性渠道
- **优点**：独立开发、易于分发、无需修改核心代码

---

## 3. 插件目录结构

```
extensions/my-channel/
├── index.ts                    # 插件入口
├── openclaw.plugin.json        # 插件清单（必需）
├── package.json
├── README.md
└── src/
    ├── channel.ts              # Channel 插件实现
    ├── runtime.ts              # 运行时依赖注入
    ├── config.ts               # 配置逻辑
    ├── monitor.ts              # 消息监听器
    └── types.ts                # 类型定义
```

### openclaw.plugin.json

```json
{
  "id": "mychannel",
  "channels": ["mychannel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

### package.json

```json
{
  "name": "@openclaw/my-channel",
  "version": "2026.2.1",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"]
  },
  "peerDependencies": {
    "openclaw": "*"
  }
}
```

---

## 4. ChannelPlugin 核心类型

Channel 插件需要实现 `ChannelPlugin` 类型，包含以下适配器：

| 适配器 | 必需 | 说明 |
|--------|------|------|
| `config` | ✓ | 配置解析和验证 |
| `configAdapter` | ✓ | 配置适配 |
| `authAdapter` | ✓ | 认证适配 |
| `messagingAdapter` | ✓ | 消息发送 |
| `statusAdapter` | ✓ | 状态检查 |
| `gatewayAdapter` | ✓ | 网关处理 |
| `onboarding` | 否 | 引导流程 |
| `pairing` | 否 | 配对流程 |
| `groups` | 否 | 群组策略 |
| `mentions` | 否 | @提及处理 |

---

## 5. 注册 Channel

```typescript
import type { ChannelPlugin } from "openclaw/plugin-sdk";

const myChannelPlugin: ChannelPlugin = {
  id: "my-channel",
  meta: {
    label: "My Channel",
    shortLabel: "MC",
    defaultEnabled: false,
    features: {
      polls: false,
      reactions: true,
      media: { audio: true, images: true },
    },
  },
  configAdapter: { /* ... */ },
  authAdapter: { /* ... */ },
  messagingAdapter: { /* ... */ },
  statusAdapter: { /* ... */ },
  gatewayAdapter: { /* ... */ },
};

api.registerChannel({ plugin: myChannelPlugin });
```

---

## 6. 参考实现

- **Telegram** - `extensions/telegram/`：简单 Bot API 渠道
- **Twitch** - `extensions/twitch/`：复杂渠道，含 IRC、EventSub
- **Matrix** - `extensions/matrix/`：Matrix 协议

建议从 `extensions/telegram/` 或 `extensions/twitch/` 的源码开始，理解各适配器的实现方式。

---

## 7. 测试与调试

```bash
openclaw plugins list
openclaw plugins validate
openclaw channels status --probe
openclaw logs --follow
```

将插件放在 `~/.openclaw/extensions/` 或通过 `plugins.loadPaths` 配置加载路径。
