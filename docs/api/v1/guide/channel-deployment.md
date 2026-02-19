# OpenClaw 消息渠道部署指南

适用场景：WhatsApp、Telegram、Discord、飞书/Lark 等消息渠道的配置与部署。

---

## 1. 前提条件

在配置消息渠道之前，需要先完成基础部署。参考 [安装与配置](/guide/#installation)。

### 1.1 确认 Gateway 已配置

```bash
openclaw config get gateway.mode
# 应返回: local

openclaw config get gateway.auth.token
```

### 1.2 确认 AI 模型已配置

```bash
openclaw models status
```

如果未配置，运行：

```bash
openclaw onboard
```

### 1.3 确认 Gateway 已启动

```bash
openclaw health
openclaw channels status
```

---

## 2. 渠道概览

### 2.1 支持的渠道

| 渠道          | 类型          | 难度          | 说明                                       |
| ------------- | ------------- | ------------- | ------------------------------------------ |
| **Telegram**  | Bot API       | ⭐ 最简单     | 只需 BotFather token                       |
| **WhatsApp**  | Web (Baileys) | ⭐⭐ 中等     | 需要扫码登录 + 真实手机号                  |
| **Discord**   | Bot API       | ⭐⭐ 中等     | 需要创建应用 + Bot                         |
| **Signal**    | signal-cli    | ⭐⭐⭐ 较复杂 | 需要安装 signal-cli                        |
| **飞书/Lark** | 开放平台 SDK  | ⭐⭐ 中等     | 需要创建自建应用，支持文档/知识库/云盘工具 |
| **Slack**     | Bolt SDK      | ⭐⭐ 中等     | 需要创建 Slack App                         |
| **iMessage**  | macOS 原生    | ⭐⭐⭐ 较复杂 | 仅限 macOS                                 |

### 2.2 推荐顺序

1. **Telegram** - 最快上手，功能完整
2. **飞书/Lark** - 企业场景首选
3. **WhatsApp** - 最常用，但配置稍复杂
4. **Discord** - 适合技术社区

### 2.3 渠道可以同时运行

多个渠道可以同时启用，OpenClaw 会根据消息来源自动路由回复。

---

## 3. Telegram 部署

Telegram 是最简单的渠道，只需要一个 Bot Token。

### 3.1 创建 Bot（BotFather）

1. 在 Telegram 搜索 **@BotFather** 并开始对话
2. 发送 `/newbot`
3. 按提示输入 Bot 显示名称和用户名（必须以 `bot` 结尾）
4. 复制返回的 **Token**

### 3.2 配置 Token

```bash
openclaw config set channels.telegram.botToken "你的token"
openclaw config set channels.telegram.enabled true
openclaw config set channels.telegram.dmPolicy pairing
```

或直接编辑 `~/.openclaw/openclaw.json`：

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
      dmPolicy: "pairing",
    },
  },
}
```

### 3.3 重启 Gateway

```bash
openclaw gateway restart
```

### 3.4 测试连接

1. 在 Telegram 找到你的 Bot 并发送消息
2. 首次会收到**配对码**（pairing 模式）
3. 批准配对：

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### 3.5 可选：allowlist 模式

```bash
openclaw config set channels.telegram.dmPolicy allowlist
openclaw config set channels.telegram.allowFrom '["123456789"]'
```

获取 Telegram 用户 ID：私聊 `@userinfobot` 或 `@getidsbot`。

### 3.6 群组配置

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: true },
        "-1001234567890": { requireMention: false },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["123456789"],
    },
  },
}
```

---

## 4. WhatsApp 部署

WhatsApp 使用 Web 协议（Baileys），需要扫码登录。

### 4.1 手机号要求

**重要**：WhatsApp 需要**真实手机号**，VoIP 和虚拟号码通常会被封禁。推荐备用手机 + eSIM 或 WhatsApp Business。

### 4.2 配置 WhatsApp

```bash
openclaw config set channels.whatsapp.dmPolicy allowlist
openclaw config set channels.whatsapp.allowFrom '["+8613800138000"]'
```

### 4.3 扫码登录

```bash
openclaw channels login
```

在手机上：WhatsApp → 设置 → 已关联的设备 → 关联设备 → 扫描终端显示的二维码。

### 4.4 验证连接

```bash
openclaw channels status
# 应显示 whatsapp: linked: true
```

### 4.5 个人号码模式（selfChatMode）

```json5
{
  channels: {
    whatsapp: {
      selfChatMode: true,
      dmPolicy: "allowlist",
      allowFrom: ["+8613800138000"],
    },
  },
}
```

### 4.6 群组配置

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groups: { "*": { requireMention: true } },
      groupAllowFrom: ["+8613800138000"],
    },
  },
}
```

---

## 5. Discord 部署

### 5.1 创建 Discord 应用

1. 访问 [Discord Developer Portal](https://discord.com/developers/applications)
2. 点击 **New Application**，输入名称
3. 左侧菜单选择 **Bot** → **Add Bot**
4. 复制 **Token**，启用 **Message Content Intent**

### 5.2 生成邀请链接

OAuth2 → URL Generator，Scopes 选 `bot`，Permissions 选 Send Messages、Read Message History、Add Reactions。

### 5.3 配置 OpenClaw

```bash
openclaw config set channels.discord.botToken "你的token"
openclaw config set channels.discord.enabled true
openclaw config set channels.discord.dmPolicy pairing
openclaw gateway restart
```

---

## 6. Signal 部署

### 6.1 安装 signal-cli

**macOS：** `brew install signal-cli`

**Linux：** 从 [GitHub Releases](https://github.com/AsamK/signal-cli/releases) 下载并安装。

### 6.2 注册/链接号码

```bash
signal-cli -u +8613800138000 register
signal-cli -u +8613800138000 verify <验证码>
```

或链接已有设备：`signal-cli link -n "OpenClaw"`

### 6.3 配置 OpenClaw

```json5
{
  channels: {
    signal: {
      enabled: true,
      number: "+8613800138000",
      dmPolicy: "allowlist",
      allowFrom: ["+8613900139000"],
    },
  },
}
```

---

## 7. 飞书/Lark 部署

飞书插件由社区维护（`@openclaw/feishu`），支持文档、知识库、云盘等工具集成。

### 7.1 创建飞书自建应用

1. 访问 [飞书开放平台](https://open.feishu.cn)（国际版 [Lark Developer](https://open.larksuite.com)）
2. 创建应用 → 自建应用
3. 复制 **App ID** 和 **App Secret**

### 7.2 配置应用权限

在权限管理中添加：`im:message`、`im:message:send_as_bot`、`im:message:readonly`、`im:message.p2p_msg:readonly`、`im:message.group_at_msg:readonly`、`im:chat`、`im:chat.members:bot_access`、`im:chat.access_event.bot_p2p_chat:read`、`im:resource`、`contact:user.employee_id:readonly`。

### 7.3 配置事件订阅

添加事件 `im.message.receive_v1`（必需），启用**机器人**能力。连接方式可选 WebSocket（推荐）或 Webhook。

### 7.4 安装插件并配置

```bash
openclaw install @openclaw/feishu
openclaw config set channels.feishu.appId "cli_xxxxxxxxxxxxxxxx"
openclaw config set channels.feishu.appSecret "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
openclaw config set channels.feishu.enabled true
openclaw config set channels.feishu.dmPolicy pairing
openclaw gateway restart
```

### 7.5 测试连接

1. 在飞书中找到机器人并发起私聊
2. 批准配对：`openclaw pairing approve feishu <CODE>`

### 7.6 域名选择

- 飞书（中国区）：`domain: "feishu"`
- Lark（国际版）：`domain: "lark"`

---

## 8. 其他渠道

### 8.1 Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      signingSecret: "...",
    },
  },
}
```

### 8.2 iMessage（仅 macOS）

```json5
{
  channels: {
    imessage: {
      enabled: true,
      dmPolicy: "allowlist",
      allowFrom: ["+8613800138000"],
    },
  },
}
```

---

## 9. DM 策略与访问控制

### 9.1 DM 策略选项

| 策略        | 说明                                | 适用场景   |
| ----------- | ----------------------------------- | ---------- |
| `pairing`   | 未知发送者收到配对码，需手动批准    | 默认，安全 |
| `allowlist` | 只允许 `allowFrom` 列表中的用户     | 已知用户群 |
| `open`      | 允许所有人（需 `allowFrom: ["*"]`） | 公开服务   |
| `disabled`  | 禁用 DM                             | 仅使用群组 |

### 9.2 配对流程

```bash
openclaw pairing list
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

配对码有效期：**1 小时**。

### 9.3 allowFrom 格式

| 渠道      | 格式               | 示例                                    |
| --------- | ------------------ | --------------------------------------- |
| Telegram  | 用户 ID 或 @用户名 | `"123456789"` 或 `"@username"`          |
| WhatsApp  | E.164 手机号       | `"+8613800138000"`                      |
| Discord   | 用户 ID            | `"123456789012345678"`                  |
| Signal    | E.164 手机号       | `"+8613800138000"`                      |
| 飞书/Lark | 用户 open_id       | `"ou_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"` |

---

## 10. 状态检查与故障排除

### 10.1 状态检查命令

```bash
openclaw channels status
openclaw channels status --probe
openclaw logs --follow
openclaw health
openclaw doctor
```

### 10.2 常见问题

**WhatsApp: "Not linked"**

```bash
openclaw channels login
```

**WhatsApp: "Linked but disconnected"**

```bash
openclaw doctor
openclaw gateway restart
```

**Telegram: Bot 没有响应**

1. 检查 token 是否正确
2. BotFather → `/setprivacy` → Disable（群组消息需要）

**Telegram: 群组消息收不到**

- 确认已禁用 Privacy Mode
- 或将 Bot 设为群组管理员

**飞书/Lark: 机器人没有响应**

1. 检查 App ID 和 App Secret
2. 确认已开启**机器人**能力
3. 确认已添加 `im.message.receive_v1` 事件订阅
4. WebSocket 模式下无需公网地址

```bash
openclaw channels status --probe
openclaw logs --follow
```

**飞书/Lark: 群组消息收不到**

- 确认机器人已添加到群组
- 确认 `groupPolicy` 不是 `disabled`
- 默认需要 @机器人（`requireMention: true`）

### 10.3 日志位置

- Gateway 日志：`~/.openclaw/logs/gateway.log`
- 临时日志：`/tmp/openclaw/openclaw-YYYY-MM-DD.log`
