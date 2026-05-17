
# 从可记录到可教学：ClawHub 插件化升级与全链路自动化闭环

> Day 37 · 2026-03-08

今日的核心任务是将 JS ClawHub 导航站从独立的静态站点升级为 OpenClaw 插件，并打通从内容导入到 GitHub Pages 推送的全自动 Cron 闭环，同时完成 Gateway 从 `2026.3.3` 到 `2026.3.7` 的关键版本跨越与安全加固。

## 网关升级需严格遵循"版本验证 - 强制重装 - 配置加固"的标准作业程序

升级过程远非简单的版本迭代，而是一次消除潜在攻击面的关键窗口。在合并了上游 714 个提交后，我首先通过 `pnpm openclaw --version` 和 `pnpm openclaw status` 确认 CLI 与全局状态已更新至 `2026.3.7`。重启 Gateway 时遇到了典型的"假死"状态：首次 `gateway status` 探测返回 RPC probe failed (1006 abnormal closure)，等待数秒后再次探测才显示 `Listening: 127.0.0.1:18789`。

更深层的隐患在于服务配置。`gateway status` 报告了"Service config looks out of date"及"Gateway service embeds OPENCLAW_GATEWAY_TOKEN"的告警。这是因为 2026.3.7 引入了 Breaking Change，不再允许将 Token 硬编码在 Windows Scheduled Task 的环境变量中，改为从 `openclaw.json` 读取。我严格执行了修复流程：首先在配置文件中显式添加 `"gateway.auth": { "mode": "token" }`，随后以管理员权限运行 `openclaw gateway install --force` 重装服务。重启时又遭遇了端口 18789 被残留进程占用的问题，不得不手动终止 PID 39060 并等待 TCP TimeWait 释放后才成功启动。这一系列操作确保了网关基石的稳固，消除了旧版本遗留的权限漏洞。

## 安全防御需基于"场景化风险评估"实施精准配置

升级完成后，`openclaw status` 抛出了 6 条安全审计告警，其中包括 3 条 CRITICAL 级别的风险提示，如"Elevated exec allowlist contains wildcard"和"Open groupPolicy with elevated tools enabled"。乍看之下，配置 `tools.elevated.allowFrom: { "*": ["*"] }` 和 `groupPolicy: "open"` 似乎意味着任何用户都能触发提权工具或在群聊中执行任意命令。

然而，基于我的实际使用场景——仅限设备管理员个人单聊（DM），不使用群聊功能——这些告警并不构成实际风险。群聊攻击面在我的环境中根本不存在，反向代理信任问题也因 Gateway 仅绑定本地 loopback 而无影响。尽管如此，为了防止未来意外将 Bot 拉入群聊导致非预期响应，我决定采纳建议，将 `groupPolicy` 从 `"open"` 调整为 `"allowlist"`（空列表）。这种基于场景的差异化配置，既避免了过度防御带来的可用性下降，又确保了在开放环境下的纵深安全防线。

## JS ClawHub 导航站通过"纯静态架构 + 人工策展定位"实现零后端依赖的高效聚合

区别于官方 ClawHub 解决"技能怎么发布和安装"的功能，JS ClawHub 专注于解决"有什么值得关注"的策展需求。今日我将该项目正式升级为 OpenClaw 插件，保留了其纯前端技术栈与原生 HTML 模块化设计的核心优势。项目严格分离 `src/`（源码）与 `docs/`（部署产物），通过六大模块（项目导航、技能市场、博客、指南、Pulse 动态）与双语支持，打造了轻量级且高可用的生态导航入口。

在插件化过程中，我坚持"加一层壳，不改内核"的原则。插件入口 `openclaw-plugin/index.mjs` 直接复用现有的 `cli/lib/` 模块，仅新增了两个数据读取函数。通过 `applyEnv()` 函数将 OpenClaw 的 `pluginConfig`（如 Cloudflare Token、GitHub Token）注入 `process.env`，使得原有业务代码无需任何改动即可在插件模式下运行。这种设计不仅降低了构建复杂度，还实现了配置的统一管理，让 Agent 能够直接调用 8 个新注册的 Tools 来搜索项目、查阅指南或获取社区动态。

## 全链路自动化闭环依托"数据展示分离"架构与一键同步脚本

为了解决手动执行 `clawhub blog-import` 的痛点，我构建了基于 OpenClaw Cron 的全自动流水线。参考 `js-knowledge-prism` 的实现模式，我注册了 `clawhub_blog_auto_sync` 工具和 `setup-cron` CLI 命令。当 Cron 每 120 分钟触发时，隔离会话中的 Agent 会自动执行以下闭环：遍历 `sources.json` 中的源进行增量导入（基于 SHA256 哈希去重），调用 LLM 翻译未翻译的文章，执行站点构建，最后通过 `gitAddAll`、`gitCommit` 和 `gitPush` 将产物推送到 GitHub Pages。

这一流程的关键在于高效的"空跑优化"。工具内部以 `totalImported > 0` 作为门控条件：若无新文章，翻译、构建和提交步骤将全部跳过，避免了不必要的 LLM 调用和空 commit。此外，我还修复了一个关键的环境变量桥接 Bug：原 `applyEnv()` 仅设置 `LLM_API_*` 变量，而翻译模块读取的是 `CLAWHUB_API_*`，导致配置无法传递。修复后，无论是 Cron 自动触发还是手动 CLI 调用，翻译功能均能正常获取 API 配置。

## 大规模上游合并采取"采纳架构方向 + 文档化功能损失"策略

面对从 `2026.3.3` 到 `2026.3.7` 的 714 个上游提交，我继续践行"小步快走"的合并策略。本次合并间隔仅 4 天，成功实现了零冲突自动合并，验证了高频合并对降低冲突率的显著效果。核心策略依然是优先保持架构一致性而采纳上游版本，例如在 Context Engine 插件化和 Telegram 大规模重构等关键架构变更上完全跟随上游。

对于 Fork 独有的功能，如 PowerShell 7 优先探测和特定的 Shell 配置覆盖，Git 自动保留了这些改动。值得注意的是，部分之前的定制（如 Telegram HTML 渲染修复）已被上游吸收，进一步收窄了代码差异。针对本轮唯一的 Breaking Change——`gateway.auth.mode` 的强制要求，我在合并总结中明确记录了这一变更及迁移路径，确保后续升级的平滑过渡。这种策略不仅维持了系统的长期可维护性，也确保了知识资产的持续演进。

## 今天的收获

- **网关升级标准化**：升级不仅是版本更新，必须包含"显式配置 auth.mode"、"管理员权限重装服务"及"端口冲突清理"的标准作业程序，以消除隐蔽的安全隐患。
- **场景化安全审计**：安全告警需结合具体使用场景（如纯单聊 vs 群聊）进行风险评估，避免过度防御，但需通过收紧 `groupPolicy` 预防未来的意外暴露。
- **插件化"壳核分离"**：通过 `applyEnv()` 桥接配置，可以在不修改核心业务逻辑的前提下，将独立 CLI 工具无缝升级为具备 Agent Tools 和 HTTP 路由能力的 OpenClaw 插件。
- **自动化空跑优化**：在 Cron 驱动的长链路中，必须以数据变更（如 `totalImported > 0`）为门控条件跳过后续步骤，将定时任务的空跑开销降至忽略不计。
- **高频合并红利**：将上游合并频率提升至 4 天一次，能有效将冲突数从个位数降为零，并促使 Fork 定制功能更快被上游吸收或明确重构路径。

- [G47-gateway-upgrade-verification.md](./G47-gateway-upgrade-verification.md)
- [G51-js-clawhub-curation-nav.md](./G51-js-clawhub-curation-nav.md)
- [G08-upstream-merge-strategy.md](./G08-upstream-merge-strategy.md)
