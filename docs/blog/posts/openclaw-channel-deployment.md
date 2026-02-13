# OpenClaw 消息渠道部署指南

想把 OpenClaw 接到 Telegram、WhatsApp、飞书？我按难度和常用程度整理了各渠道的部署步骤。

## 前提条件

先完成基础部署：Gateway 配好、AI 模型配好。检查：

```bash
pnpm openclaw config get gateway.mode   # 应返回 local
pnpm openclaw models status             # 确认已配置
pnpm openclaw health                    # 确认运行中
```

## 渠道对比

| 渠道 | 类型 | 难度 | 说明 |
|------|------|------|------|
| **Telegram** | Bot API | ⭐ 最简单 | 只需 BotFather token |
| **WhatsApp** | Web (Baileys) | ⭐⭐ 中等 | 扫码 + 真实手机号 |
| **Discord** | Bot API | ⭐⭐ 中等 | 创建应用 + Bot |
| **飞书/Lark** | 开放平台 | ⭐⭐ 中等 | 自建应用，支持文档/知识库 |
| **Signal** | signal-cli | ⭐⭐⭐ 较复杂 | 需安装 signal-cli |
| **iMessage** | macOS 原生 | ⭐⭐⭐ 较复杂 | 仅限 macOS |

我推荐的顺序：**Telegram 入门** → **飞书企业** → **WhatsApp 日常**。多个渠道可同时启用，OpenClaw 会自动路由。

## Telegram 快速上手

1. 在 Telegram 找 @BotFather，发 `/newbot`，按提示创建，拿到 Token。
2. 配置：

```bash
pnpm openclaw config set channels.telegram.botToken "你的token"
pnpm openclaw config set channels.telegram.enabled true
pnpm openclaw config set channels.telegram.dmPolicy pairing
pnpm openclaw gateway restart
```

3. 在 Telegram 找到你的 Bot 发消息，会收到配对码。批准：

```bash
pnpm openclaw pairing list telegram
pnpm openclaw pairing approve telegram <CODE>
```

想跳过配对用 allowlist：`dmPolicy allowlist`，`allowFrom '["你的用户ID"]'`。用户 ID 可问 @userinfobot。

## WhatsApp 关键点

需要**真实手机号**，VoIP/虚拟号容易被封。推荐备用机 + eSIM 或 WhatsApp Business。

```bash
pnpm openclaw config set channels.whatsapp.dmPolicy allowlist
pnpm openclaw config set channels.whatsapp.allowFrom '["+8613800138000"]'
pnpm openclaw gateway restart
```

然后扫码登录：在 Gateway 机器上执行 `pnpm openclaw whatsapp login`，用手机扫二维码。

## 飞书 / Lark

创建自建应用，拿到 App ID、App Secret、Verification Token。配置到 `channels.lark`，设置 webhook URL。飞书支持文档、知识库、云盘工具集成，企业场景首选。

## 故障排查

```bash
pnpm openclaw channels status --probe
pnpm openclaw logs --follow
```

常见问题：Token 错误、配对未批准、allowlist 没加对用户 ID、Gateway 未重启。

---

*JS // 2026.01.31*
