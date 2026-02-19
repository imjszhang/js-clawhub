# OpenClaw Fork 与生产部署指南

> 面向 Fork 用户：官方频繁更新 + 个人定制需求 + 生产环境部署

---

## 1. 场景分析

| 需求               | 挑战                                 |
| ------------------ | ------------------------------------ |
| **官方更新频繁**   | OpenClaw 处于 pre-1.0 阶段，迭代快速 |
| **个人定制需求**   | 需要保持自己的修改不被上游覆盖       |
| **生产环境稳定性** | 需要可靠运行，不能频繁出问题         |

**解决思路**：采用 **Fork + 分层定制架构**，将定制内容分层管理，最大化减少与上游的冲突。

---

## 2. Git 工作流策略

### 2.1 分支架构

```
upstream/main (官方) → origin/main (Fork 主分支) → origin/production (生产分支)
```

| 分支         | 用途           | 更新策略                                        |
| ------------ | -------------- | ----------------------------------------------- |
| `main`       | 与上游保持同步 | `git fetch upstream && git merge upstream/main` |
| `production` | 生产部署分支   | 从 main rebase/cherry-pick + 定制提交           |
| `feature/*`  | 定制功能开发   | 完成后合并到 production                         |

### 2.2 初始化设置

```bash
git remote add upstream https://github.com/openclaw/openclaw.git
git checkout -b production
git push -u origin production
```

### 2.3 标准同步流程

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main

git checkout production
git rebase main
# 解决冲突后
git push origin production --force-with-lease
```

---

## 3. 生产环境部署

### 3.1 首次部署流程

```bash
cd /path/to/openclaw
git checkout production
git pull origin production

pnpm install
pnpm build
pnpm ui:build

openclaw doctor
openclaw config set gateway.mode local
openclaw config set gateway.auth.token "$(openssl rand -hex 16)"
openclaw onboard

openclaw gateway install --force
openclaw health
openclaw channels status --probe
openclaw models status
```

### 3.2 后续更新流程

```bash
git checkout production
git pull origin production
pnpm install
pnpm build
openclaw gateway restart
```

---

## 4. Windows 环境注意事项

### 4.1 pnpm build 失败 — bash 解析到 WSL

**症状**：`pnpm build` 报错 `execvpe(/bin/bash) failed`。

**原因**：Windows 上 `bash` 默认解析到 WSL，若 WSL 未配置会失败。

**解决**：在项目根目录 `.npmrc` 中添加：

```ini
script-shell=d:\\Program Files\\Git\\bin\\bash.exe
```

路径替换为实际 Git 安装目录。使用 `git update-index --skip-worktree .npmrc` 避免提交此修改。

### 4.2 pnpm 命令未找到

使用 nvm-windows 时，需启用 corepack：

```powershell
corepack enable
corepack prepare pnpm@latest --activate
```

---

## 5. 自定义 State 目录位置

默认 state 目录：`~/.openclaw`（Windows：`C:\Users\<用户名>\.openclaw`）。

**迁移到其他盘**（如 `D:\.openclaw`）：

1. 复制数据：`Copy-Item -Path "$env:USERPROFILE\.openclaw" -Destination "D:\.openclaw" -Recurse`
2. 设置环境变量：`[System.Environment]::SetEnvironmentVariable("OPENCLAW_STATE_DIR", "D:\.openclaw", "User")`
3. 重启终端后验证：`openclaw doctor`

---

## 6. 开发模式命令别名

**macOS/Linux (Zsh)**：

```bash
echo 'alias openclaw="pnpm --dir /path/to/openclaw openclaw"' >> ~/.zshrc
source ~/.zshrc
```

**Windows PowerShell**：

```powershell
Add-Content -Path $PROFILE -Value @'
function openclaw {
    pnpm --dir "C:\path\to\openclaw" openclaw @args
}
'@
. $PROFILE
```

---

## 7. 定制化最佳实践

| 层级   | 定制方式                          | 同步难度   |
| ------ | --------------------------------- | ---------- |
| 配置   | `~/.openclaw/` 文件               | 无影响     |
| 工作区 | `~/.openclaw/workspace/`          | 无影响     |
| 技能   | `workspace/skills/` 或全局 skills | 无影响     |
| 插件   | `extensions/` 独立目录            | 低冲突     |
| 源码   | 核心代码修改                      | 高冲突     |

**建议**：优先使用配置、技能、插件，谨慎修改源码。

---

## 8. 稳定性保障

### 版本标签

```bash
git tag -a prod-$(date +%Y.%m.%d) -m "生产稳定版本"
git push origin prod-$(date +%Y.%m.%d)
```

### 回滚

```bash
git checkout prod-2026.01.30
pnpm install && pnpm build
openclaw gateway restart
```

### 配置备份

```bash
tar -czvf openclaw-config-backup-$(date +%Y%m%d).tar.gz \
  ~/.openclaw/openclaw.json ~/.openclaw/credentials/ ~/.openclaw/workspace/
```
