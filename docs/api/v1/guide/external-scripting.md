# OpenClaw 外部脚本与 API 调用指引

本文档梳理 OpenClaw 暴露给外部脚本/程序的所有接口，让你能像 cron 系统那样，从任意脚本触发 AI agent 运行、发送消息、调用工具。

---

## 1. 接口总览

| 接口                        | 类型 | 路径/命令    | 认证         | 适用场景               |
| --------------------------- | ---- | ------------ | ------------ | ---------------------- |
| `openclaw agent`            | CLI  | 命令行       | 无需（本地） | 脚本触发 AI agent 运行 |
| `openclaw message send`     | CLI  | 命令行       | 无需（本地） | 脚本发送消息到频道     |
| `openclaw cron`             | CLI  | 命令行       | 无需（本地） | 管理定时任务           |
| `POST /hooks/wake`          | HTTP | Gateway 端口 | Hook token   | 唤醒主会话心跳         |
| `POST /hooks/agent`         | HTTP | Gateway 端口 | Hook token   | 触发隔离 agent 运行    |
| `POST /v1/chat/completions` | HTTP | Gateway 端口 | Gateway auth | OpenAI 兼容调用        |
| `POST /v1/responses`        | HTTP | Gateway 端口 | Gateway auth | OpenResponses 标准调用 |
| `POST /tools/invoke`        | HTTP | Gateway 端口 | Gateway auth | 直接调用 agent 工具    |
| WebSocket RPC               | WS   | Gateway 端口 | Gateway auth | 实时双向通信           |

Gateway 默认监听 `127.0.0.1:18789`。

---

## 2. CLI 命令行接口

### 2.1 openclaw agent

从脚本运行一次 agent turn（AI 回合）：

```bash
openclaw agent \
  --message "你的提示词" \
  --agent main \
  --to <E.164>                # 或用手机号定位会话
  --session-id <id>            # 或用 session id
  --thinking off|minimal|low|medium|high \
  --deliver                    # 将 agent 回复发送到频道
  --channel whatsapp|telegram|discord|slack \
  --reply-to <target> \
  --local                      # 本地嵌入运行（不走 Gateway）
  --timeout 600 \
  --json                       # JSON 输出
```

**示例**：

```bash
# 基础调用
openclaw agent --agent main --message "总结今天的日志"

# 带投递：agent 回复发到 Slack
openclaw agent --agent ops --message "生成周报" \
  --deliver --reply-channel slack --reply-to "#reports"

# 本地运行 + JSON 输出（适合 CI/CD）
openclaw agent --local --agent main --message "检查系统状态" --json
```

### 2.2 openclaw message send

直接向消息频道发送消息（不经过 AI），适合通知、告警：

```bash
openclaw message send \
  --channel whatsapp|telegram|discord|slack|signal|imessage \
  --target <E.164|chat-id|channel-id> \
  --message "消息内容" \
  --media <path-or-url>        # 附件
  --json
  --dry-run                    # 模拟运行
```

**示例**：

```bash
openclaw message send --channel whatsapp --target +15551234567 --message "部署完成"
openclaw message send --channel telegram --target @mygroup --message "监控截图" --media /tmp/screenshot.png
openclaw message send --channel slack --target "channel:C1234567890" --message "构建失败告警"
```

### 2.3 openclaw cron

管理定时任务，详见 [定时任务 Cron](/guide/#cron-config)。

---

## 3. HTTP API 接口

### 3.1 前置配置

编辑 `~/.openclaw/openclaw.json`：

```json5
{
  hooks: {
    enabled: true,
    token: "your-shared-secret",
  },
}
```

### 3.2 POST /hooks/wake

唤醒主会话并注入系统事件：

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer your-shared-secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "收到新邮件：来自张三，主题：项目更新",
    "mode": "now"
  }'
```

| 字段   | 必填 | 说明                                                   |
| ------ | ---- | ------------------------------------------------------ |
| `text` | 是   | 系统事件描述                                           |
| `mode` | 否   | `now`（立即触发）或 `next-heartbeat`（等下次周期）      |

### 3.3 POST /hooks/agent（推荐）

运行一次隔离 agent turn，**最推荐的外部脚本接口**：

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer your-shared-secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "总结今天的 GitHub issue 列表",
    "name": "GitHub",
    "sessionKey": "hook:github:daily",
    "wakeMode": "now",
    "deliver": true,
    "channel": "slack",
    "to": "channel:C1234567890",
    "model": "anthropic/claude-sonnet-4-20250514",
    "thinking": "low",
    "timeoutSeconds": 120
  }'
```

| 字段             | 必填 | 说明                                                        |
| ---------------- | ---- | ----------------------------------------------------------- |
| `message`        | 是   | 发给 agent 的提示词                                         |
| `name`           | 否   | 人类可读名称                                                |
| `sessionKey`     | 否   | 会话标识，相同 key 可复用上下文                             |
| `wakeMode`       | 否   | `now` 或 `next-heartbeat`                                   |
| `deliver`        | 否   | 是否投递 agent 回复到频道（默认 `true`）                    |
| `channel`        | 否   | 投递频道：`last`/`whatsapp`/`telegram`/`discord`/`slack` 等 |
| `to`             | 否   | 投递目标                                                    |
| `model`          | 否   | 模型覆盖                                                    |
| `thinking`       | 否   | 思考级别：`low`/`medium`/`high`                             |
| `timeoutSeconds` | 否   | 超时秒数                                                    |

### 3.4 OpenAI 兼容接口

`POST /v1/chat/completions` 提供 OpenAI 兼容的 API，需 Gateway auth token。适合已有 OpenAI 客户端的集成。

### 3.5 Tools Invoke

`POST /tools/invoke` 可直接调用 agent 工具，需 Gateway auth。

---

## 4. 认证方式

### Hooks 认证

```bash
Authorization: Bearer your-shared-secret
```

Token 在 `hooks.token` 中配置。

### Gateway 认证

用于 `/v1/chat/completions`、`/v1/responses`、`/tools/invoke`、WebSocket：

```bash
Authorization: Bearer <gateway.auth.token>
```

Token 通过 `openclaw config set gateway.auth.token "xxx"` 设置。

---

## 5. 实战示例

### Shell 脚本触发 agent

```bash
#!/bin/bash
openclaw agent --agent main --message "检查服务器状态" --json | jq -r '.content'
```

### GitHub Actions

```yaml
- name: Trigger OpenClaw
  run: |
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H "Authorization: Bearer ${{ secrets.OPENCLAW_HOOK_TOKEN }}" \
      -H "Content-Type: application/json" \
      -d '{"message": "构建完成，请检查", "deliver": true}'
```

### n8n / Zapier

使用 HTTP Request 节点，配置 URL、Method、Headers、Body 即可调用 `/hooks/agent` 或 `/hooks/wake`。
