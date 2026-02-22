# OpenClaw Fork 管理与生产部署指南

官方更新快，我又想保留自己的定制，Fork 怎么同步、生产环境怎么部署，这篇是我实践后的总结。

## 我的场景

| 需求 | 挑战 |
|------|------|
| 官方更新频繁 | OpenClaw 处于 pre-1.0，迭代快 |
| 个人定制 | 修改不能被上游覆盖 |
| 生产稳定 | 不能频繁出问题 |

解决思路：**Fork + 分层定制**，定制内容分层管理，减少冲突，保持稳定。

## 分支策略

```
upstream/main → origin/main（同步上游，无定制）
                      ↓
              origin/production（含定制，用于部署）
```

| 分支 | 用途 | 更新方式 |
|------|------|----------|
| `main` | 与上游同步 | `git fetch upstream && git merge upstream/main` |
| `production` | 生产部署 | 从 main rebase + 定制提交 |
| `feature/*` | 定制开发 | 完成后合并到 production |

初始化：

```bash
git remote add upstream https://github.com/openclaw/openclaw.git
git checkout -b production
git push -u origin production
```

## 上游同步流程

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

不想全量合并时用 cherry-pick：`git cherry-pick <commit-hash>`。

## 生产部署

**推荐源码安装**（Fork 定制场景）。首次部署：

```bash
git checkout production && git pull
pnpm install && pnpm build && pnpm ui:build
pnpm openclaw doctor

# 必需配置
pnpm openclaw config set gateway.mode local
pnpm openclaw config set gateway.auth.token "$(openssl rand -hex 16)"
pnpm openclaw onboard   # 或直接 set env.ANTHROPIC_API_KEY

pnpm openclaw gateway install --force
pnpm openclaw health
```

后续更新：`git pull` → `pnpm install` → `pnpm build` → `pnpm openclaw gateway restart`。

## Windows 注意点

`pnpm build` 失败（bash 解析到 WSL）时，在 `.npmrc` 加：

```ini
script-shell=d:\\Program Files\\Git\\bin\\bash.exe
```

pnpm 未找到时：`corepack enable` 然后 `corepack prepare pnpm@latest --activate`。

## State 目录迁移

想把 `~/.openclaw` 迁到其他盘（如 D 盘）：

```powershell
# 复制数据
Copy-Item -Path "$env:USERPROFILE\.openclaw" -Destination "D:\.openclaw" -Recurse

# 设置环境变量（永久）
[System.Environment]::SetEnvironmentVariable("OPENCLAW_STATE_DIR", "D:\.openclaw", "User")
```

macOS/Linux：`export OPENCLAW_STATE_DIR="/mnt/data/.openclaw"` 写入 shell 配置。

## 定制建议

尽量用 skills 扩展，少改核心代码。冲突高发文件：`package.json`、`tsconfig.json`、核心源码。保留你的 `// CUSTOM` 标记，合并时仔细对比。

## 我的升级策略

大版本或 breaking change：先 main 同步，在 production 上测试，确认无问题再部署。小修复：cherry-pick 到 production 即可。

---

*JS // 2026.01.31*
