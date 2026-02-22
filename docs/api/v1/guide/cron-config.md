# OpenClaw 定时任务 Cron 配置指南

本文档详细解释 OpenClaw 的 cron 定时任务系统的各种配置选项。

---

## 1. 什么是 Cron

OpenClaw 的 Cron 是 Gateway 内置的定时任务调度器。它可以：

- 定时执行任务（每 5 分钟、每天早上 8 点等）
- 设置一次性提醒（20 分钟后提醒我）
- 让 Agent 执行特定命令并将结果发送到聊天渠道

**重要**：OpenClaw 的 cron 运行在 Gateway 进程内部，与系统的 `crontab` 是完全独立的。

---

## 2. 核心概念一览

| 配置项            | 可选值                      | 作用                             |
| ----------------- | --------------------------- | -------------------------------- |
| **sessionTarget** | `main` / `isolated`         | 任务在哪个会话中运行             |
| **payload.kind**  | `systemEvent` / `agentTurn` | 任务做什么（发消息 vs 执行命令） |
| **wakeMode**      | `now` / `next-heartbeat`    | 何时触发任务                     |
| **schedule**      | `at` / `every` / `cron`     | 何时运行                         |
| **delivery**      | `announce` / `none`         | 是否投递结果到聊天               |

---

## 3. Session Target（会话目标）

### 3.1 `main`（主会话）

- 任务在 Agent 的**主会话**中运行
- 与你日常对话的会话共享上下文
- 适合需要访问对话历史的任务
- **必须**搭配 `payload.kind: "systemEvent"`

**典型用途**：提醒你做某事、需要基于之前对话内容的任务。

### 3.2 `isolated`（隔离会话）

- 任务在**独立的临时会话**中运行，会话 ID 为 `cron:<jobId>`
- 每次运行都是全新会话，不继承历史
- **必须**搭配 `payload.kind: "agentTurn"`
- 可以配置 `delivery` 将结果发送到指定渠道

**典型用途**：后台任务、定时报告、需要实际执行命令的自动化任务。

### 3.3 选择哪个？

| 场景                 | 推荐 Session Target |
| -------------------- | ------------------- |
| 简单提醒/备忘        | `main`              |
| 需要执行 shell 命令  | `isolated`          |
| 定时发送报告         | `isolated`          |
| 需要读取主会话上下文 | `main`              |
| 后台自动化任务       | `isolated`          |

---

## 4. Payload Kind（负载类型）

### 4.1 `systemEvent`（系统事件）

- 向 Agent 发送一条**系统消息**
- Agent 会在下次心跳时**看到**这条消息
- Agent 可能只是文本回复，**不一定执行实际操作**
- **必须**搭配 `sessionTarget: "main"`

### 4.2 `agentTurn`（Agent 回合）

- 让 Agent 执行一个**完整的回合**（可以使用工具、执行命令）
- Agent 会在独立会话中运行，可以调用 shell、读写文件等
- **必须**搭配 `sessionTarget: "isolated"`
- 可以指定模型、思考级别、超时时间等

### 4.3 核心区别对比

| 特性               | systemEvent              | agentTurn                |
| ------------------ | ------------------------ | ------------------------ |
| 执行环境           | 主会话                   | 隔离会话                 |
| Agent 行为         | 看到消息，可能只文本回复 | 完整执行回合，可使用工具 |
| 适合场景           | 提醒、通知               | 自动化任务、脚本执行     |
| 可否执行 shell     | ❌ 不可靠                | ✅ 可以                  |
| 配套 sessionTarget | `main`                   | `isolated`               |

---

## 5. Wake Mode（唤醒模式）

- **`now`**：任务到期后**立即**运行
- **`next-heartbeat`**：任务到期后**等待下次心跳**时运行（默认，省资源）

---

## 6. Schedule（调度计划）

### 6.1 `at`（一次性）

```bash
--at "20m"                    # 20 分钟后
--at "2026-02-05T16:00:00Z"   # 指定时间（UTC）
--at "2026-02-05T16:00:00+08:00"  # 带时区
```

### 6.2 `every`（固定间隔）

```bash
--every "10m"   # 每 10 分钟
--every "2h"    # 每 2 小时
```

### 6.3 `cron`（Cron 表达式）

```bash
--cron "*/5 * * * *" --tz "Asia/Shanghai"   # 每 5 分钟
--cron "0 8 * * *" --tz "Asia/Shanghai"     # 每天早上 8 点
--cron "0 9 * * 1" --tz "Asia/Shanghai"     # 每周一早上 9 点
```

**Cron 表达式格式**：`分 时 日 月 周`。强烈建议指定 `--tz`，否则使用 Gateway 主机的本地时区。

---

## 7. Delivery（消息投递）

仅 `isolated` 任务支持将结果发送到聊天渠道。

### 7.1 `announce`（投递）

```bash
--announce --channel feishu --to "user_id"
```

### 7.2 `none`（不投递）

```bash
--no-deliver
```

### 7.3 `--to` 目标格式

| 渠道     | 格式示例                                  |
| -------- | ----------------------------------------- |
| WhatsApp | `+8613812345678`                          |
| Telegram | `123456789` 或 `-1001234567890:topic:123` |
| Discord  | `channel:123456789` 或 `user:123456789`   |
| Slack    | `channel:C1234567890`                     |
| Feishu   | `user_id`                                 |

---

## 8. 常见配置组合

### 8.1 简单提醒（主会话）

```bash
openclaw cron add \
  --name "日程提醒" \
  --at "20m" \
  --session main \
  --system-event "提醒：检查今天的日程" \
  --wake now \
  --delete-after-run
```

### 8.2 定时执行脚本（隔离会话）

```bash
openclaw cron add \
  --name "执行发帖任务" \
  --cron "*/5 * * * *" \
  --tz "Asia/Shanghai" \
  --session isolated \
  --message "执行命令：cd /path/to/project && python workflow.py" \
  --wake now \
  --no-deliver
```

### 8.3 定时报告到飞书

```bash
openclaw cron add \
  --name "每日报告" \
  --cron "30 23 * * *" \
  --tz "Asia/Shanghai" \
  --session isolated \
  --message "生成今日工作报告摘要" \
  --announce \
  --channel feishu \
  --to "user_id_here"
```

---

## 9. 故障排查

### 任务显示 "ok" 但没有实际执行

**原因**：可能配置了 `systemEvent` + `main`，Agent 只是"看到"了消息。

**解决**：改为 `agentTurn` + `isolated`。

### 任务没有发送通知

检查是否配置了 `--no-deliver`，或 `--to` 目标格式是否正确。

### 任务完全不运行

1. Gateway 是否在运行？
2. Cron 是否启用？（`cron.enabled: true`）
3. 时区是否正确？

```bash
openclaw cron status
openclaw cron run <job-id> --force  # 手动触发测试
```

### PATH 问题

Cron 运行环境的 `PATH` 可能很有限。在脚本中显式设置 PATH，或使用完整路径。

---

## 10. CLI 命令速查

```bash
# 查看
openclaw cron list
openclaw cron status
openclaw cron runs --id <job-id> --limit 20

# 创建
openclaw cron add --name "提醒" --at "20m" --session main --system-event "内容" --wake now

# 修改
openclaw cron edit <job-id> --session isolated --message "新命令"

# 启用/禁用
openclaw cron enable <job-id>
openclaw cron disable <job-id>

# 手动运行/删除
openclaw cron run <job-id> --force
openclaw cron rm <job-id>
```

---

## 11. Cron vs Heartbeat 如何选择

| 维度         | Heartbeat（心跳）         | Cron（定时任务）         |
| ------------ | ------------------------- | ------------------------ |
| **时间精度** | 大约（会随队列负载漂移）  | 精确（cron 表达式）      |
| **会话**     | 主会话，共享上下文        | 可隔离会话，独立运行     |
| **用途**     | 批量周期性检查            | 特定时间点的独立任务     |
| **成本**     | 一次调用覆盖多项检查      | 每个任务单独调用         |
| **响应契约** | `HEARTBEAT_OK` = 无事发生 | 总是有输出               |

**推荐**：日常监控用 Heartbeat（收件箱、日历），精确调度用 Cron（每日报告、一次性提醒）。
