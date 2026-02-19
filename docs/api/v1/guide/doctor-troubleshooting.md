# OpenClaw Doctor 诊断与故障排除

## 概述

`openclaw doctor` 是 OpenClaw 的诊断与修复工具，用于检测配置问题、执行状态迁移、检查系统健康状况，并提供可操作的修复步骤。它是排查和解决 OpenClaw 问题的首选工具。

## 快速开始

```bash
# 基础用法（交互模式）
openclaw doctor

# 自动接受默认选项
openclaw doctor --yes

# 应用推荐修复（无需确认）
openclaw doctor --repair

# 强制修复（包括覆盖自定义配置）
openclaw doctor --repair --force

# 非交互模式（仅安全迁移）
openclaw doctor --non-interactive

# 深度扫描（检测额外的网关安装）
openclaw doctor --deep
```

## 命令选项

| 选项 | 说明 |
|------|------|
| `--yes` | 自动接受默认选项，无需交互确认 |
| `--repair` | 应用推荐的修复操作，无需提示确认 |
| `--force` | 与 `--repair` 一起使用，执行激进修复（如覆盖自定义 supervisor 配置） |
| `--non-interactive` | 无提示运行，仅执行安全的配置规范化和磁盘状态迁移 |
| `--deep` | 深度扫描系统服务，检测额外的网关安装（launchd/systemd/schtasks） |
| `--generate-gateway-token` | 强制生成网关认证 token |

---

## 功能模块详解

### 1. 可选更新检查（Git 安装）

如果是 Git checkout 安装，doctor 会在交互模式下提供更新选项（fetch/rebase/build）。

### 2. UI 协议新鲜度检查

检查 Control UI 资源是否过时，提示是否需要重新构建 UI 资源。

### 3. 配置规范化

将旧版配置值格式转换为当前 schema：
- 自动检测 legacy 配置格式
- 提示或自动迁移到新格式
- 保留备份文件 `~/.openclaw/openclaw.json.bak`

### 4. 旧版配置键迁移

支持的迁移路径：

| 旧路径 | 新路径 |
|--------|--------|
| `routing.allowFrom` | `channels.whatsapp.allowFrom` |
| `routing.groupChat.requireMention` | `channels.whatsapp/telegram/imessage.groups."*".requireMention` |
| `routing.groupChat.historyLimit` | `messages.groupChat.historyLimit` |
| `routing.queue` | `messages.queue` |
| `routing.bindings` | 顶层 `bindings` |
| `routing.agents`/`routing.defaultAgentId` | `agents.list` + `agents.list[].default` |
| `routing.agentToAgent` | `tools.agentToAgent` |
| `routing.transcribeAudio` | `tools.media.audio.models` |
| `identity` | `agents.list[].identity` |
| `agent.*` | `agents.defaults` + `tools.*` |

### 5. OpenCode Zen Provider 覆盖警告

检测并警告手动设置的 `models.providers.opencode` 或 `models.providers.opencode-zen`，建议移除以恢复默认行为。

### 6. 旧版状态迁移（磁盘布局）

自动迁移旧的磁盘布局：

| 迁移内容 | 来源 | 目标 |
|----------|------|------|
| Sessions 存储 | `~/.openclaw/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` |
| Agent 目录 | `~/.openclaw/agent/` | `~/.openclaw/agents/<agentId>/agent/` |
| WhatsApp 认证 | `~/.openclaw/credentials/*.json` | `~/.openclaw/credentials/whatsapp/<accountId>/` |

### 7. 状态完整性检查

- **状态目录缺失**: 警告并提示创建 `~/.openclaw/`
- **状态目录权限**: 验证可写性，提供修复建议
- **Sessions 目录缺失**: 检查必需的 sessions 和 store 目录
- **Transcript 不匹配**: 警告最近 session 条目缺少对应的 transcript 文件
- **多状态目录**: 警告存在多个 `~/.openclaw` 目录
- **远程模式提醒**: 如果 `gateway.mode=remote`，提醒在远程主机运行 doctor
- **配置文件权限**: 警告 `openclaw.json` 权限过于开放（建议 chmod 600）

### 8. 模型认证健康检查

- 检测过期/即将过期的 tokens
- 提供刷新选项（交互模式）
- 针对 Anthropic Claude Code profile，建议运行 `claude setup-token`

### 9. 沙箱镜像修复

当启用 sandboxing 时，检查 Docker 是否可用，验证配置的镜像是否存在。

### 10. 网关服务迁移和清理

检测旧版网关服务（launchd/systemd/schtasks），提供移除和重新安装选项。

### 11. 安全警告

- **网关网络暴露**: 检测危险的绑定配置（非 loopback 且无认证）
- **DM 策略**: 警告开放的 DM 策略（policy="open"）
- **Allowlist**: 检查是否配置了发送者白名单
- **Session 范围**: 建议为多用户场景设置 `session.dmScope="per-channel-peer"`

```bash
openclaw security audit --deep
```

### 12. 网关认证检查

当本地网关缺少 `gateway.auth` 时，发出警告并提供生成 token 的选项。

### 13. 网关健康检查与重启

运行健康检查，当网关不健康时提供重启选项。

### 14. 频道状态警告

如果网关健康，运行频道状态探测并报告连接问题、配置问题及建议的修复方案。

---

## 使用场景

### 场景 1: 首次安装后检查

```bash
openclaw doctor
```

检查配置完整性，确保所有必需目录存在。

### 场景 2: 升级后修复

```bash
openclaw doctor --repair
```

自动应用配置迁移和修复。

### 场景 3: CI/CD 环境

```bash
openclaw doctor --non-interactive
```

仅执行安全迁移，不进行交互提示。

### 场景 4: 深度诊断

```bash
openclaw doctor --deep
```

扫描系统服务，检测额外的网关安装。

### 场景 5: 强制重新配置

```bash
openclaw doctor --repair --force
```

覆盖自定义配置，强制应用默认设置。

---

## 输出解读

### Doctor changes

显示已应用的变更：

```
╭─ Doctor changes ─────────────────────────────────────────────╮
│ - routing.allowFrom → channels.whatsapp.allowFrom            │
│ - Created ~/.openclaw/agents/default/sessions/               │
╰──────────────────────────────────────────────────────────────╯
```

### Doctor warnings

显示需要关注的警告：

```
╭─ Doctor warnings ────────────────────────────────────────────╮
│ - Legacy folder left behind: ~/.openclaw/sessions.bak        │
│ - Config file is group/world readable                         │
╰──────────────────────────────────────────────────────────────╯
```

### Security

显示安全相关的警告：

```
╭─ Security ───────────────────────────────────────────────────╮
│ - WARNING: Gateway bound to "lan" (192.168.1.100)            │
│ - WhatsApp DMs: OPEN (policy="open"). Anyone can DM it.      │
╰──────────────────────────────────────────────────────────────╯
```

---

## 相关命令

| 命令 | 说明 |
|------|------|
| `openclaw configure` | 交互式配置向导 |
| `openclaw config set <key> <value>` | 直接设置配置值 |
| `openclaw gateway install` | 安装网关服务 |
| `openclaw gateway install --force` | 强制重写服务文件 |
| `openclaw channels status --probe` | 检查频道状态 |
| `openclaw security audit --deep` | 深度安全审计 |
| `openclaw models auth setup-token` | 设置模型认证 token |

---

## 最佳实践

1. **定期运行**: 建议在升级后或遇到问题时运行 `openclaw doctor`
2. **查看配置**: 修复前可先查看当前配置 `cat ~/.openclaw/openclaw.json`
3. **备份意识**: doctor 会创建 `.bak` 备份文件
4. **权限管理**: 确保状态目录权限为 700，配置文件权限为 600
5. **远程模式**: 如使用远程网关，需在远程主机运行 doctor

---

## 故障排除

### 问题: doctor 报告旧版配置

```bash
openclaw doctor --repair
```

### 问题: 网关服务未运行

```bash
# 检查服务状态
launchctl print gui/$UID | grep openclaw  # macOS
systemctl --user status openclaw-gateway   # Linux

# 重新安装服务
openclaw gateway install
```

### 问题: 权限错误

```bash
chmod 700 ~/.openclaw
chmod 600 ~/.openclaw/openclaw.json
```

### 问题: 多个状态目录

检查 `OPENCLAW_STATE_DIR` 环境变量设置，确保只有一个活动的状态目录。
