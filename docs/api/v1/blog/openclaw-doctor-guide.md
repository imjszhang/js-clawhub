# OpenClaw Doctor 命令指引

配置出问题、升级后异常，我第一个想到的就是 `openclaw doctor`。这篇是我整理的常用用法和踩坑记录。

## 为什么用 doctor

`openclaw doctor` 把诊断和修复合在一起：检测配置问题、执行状态迁移、检查系统健康，还能给出可操作的修复步骤。排查 OpenClaw 问题，我习惯先跑它。

## 我常用的几条命令

```bash
# 基础用法（交互模式）
pnpm openclaw doctor

# 自动接受默认选项，省去交互
pnpm openclaw doctor --yes

# 直接应用推荐修复，不问我
pnpm openclaw doctor --repair

# 强制修复（包括覆盖自定义配置）
pnpm openclaw doctor --repair --force

# 非交互模式，只做安全迁移（适合 CI）
pnpm openclaw doctor --non-interactive

# 深度扫描，检测额外的网关安装
pnpm openclaw doctor --deep
```

## 选项速查

| 选项 | 说明 |
|------|------|
| `--yes` | 自动接受默认选项 |
| `--repair` | 应用推荐修复，无需确认 |
| `--force` | 与 `--repair` 一起用，激进修复（会覆盖自定义） |
| `--non-interactive` | 无提示运行，仅安全迁移 |
| `--deep` | 深度扫描 launchd/systemd/schtasks |
| `--generate-gateway-token` | 强制生成网关 token |

## 我遇到过的场景

**配置迁移**：升级后旧配置键要迁移到新 schema。doctor 会自动检测并迁移，备份在 `~/.openclaw/openclaw.json.bak`。常见迁移比如 `routing.allowFrom` → `channels.whatsapp.allowFrom`，`routing.agents` → `agents.list`。

**状态目录**：Sessions、Agent 目录、WhatsApp 认证的磁盘布局变了，doctor 会帮你从旧路径迁到新路径。

**OAuth 过期**：模型认证的 token 过期了，doctor 会提示刷新，Claude Code 会建议跑 `claude setup-token`。

**网关不健康**：doctor 会做健康检查，不健康时提供重启选项。

## 建议

出问题先跑 `pnpm openclaw doctor`，再看具体报错。修复前可以 `cat ~/.openclaw/openclaw.json` 看一眼当前配置。doctor 会创建 `.bak` 备份，权限建议：状态目录 700，配置文件 600。

远程模式（`gateway.mode=remote`）时，记得在远程主机上跑 doctor。

---

*JS // 2026.01.31*
