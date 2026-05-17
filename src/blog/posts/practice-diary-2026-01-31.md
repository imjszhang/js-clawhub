
# 从陌生框架到可控智能体：OpenClaw 首日部署与架构摸底实录

> Day 1 · 2026-01-31

面对一个处于 pre-1.0 阶段且迭代频繁的 OpenClaw 框架，今日的核心任务是从零构建一套兼顾“分层分离 + 增长驱动”的落地架构，将散乱的部署文档转化为可执行、可进化的生产环境底座。

## 部署基石：标准化流程规避多渠道接入陷阱

在着手配置任何消息渠道前，我严格遵循了“先决条件确认 - 差异化配置 - 状态验证”的三步走策略，避免了以往直接配置 Token 导致网关启动失败的坑。首先，通过 `pnpm openclaw config get gateway.mode` 确认网关模式为 `local`，并执行 `pnpm openclaw models status` 确保 AI 模型（如 `anthropic/claude-sonnet-4-5`）已就绪。随后，针对 Telegram 和 WhatsApp 进行了差异化配置：Telegram 仅需通过 BotFather 获取 Token 并执行 `pnpm openclaw config set channels.telegram.botToken`；而 WhatsApp 则必须使用真实手机号（避免 VoIP 封禁），通过 `pnpm openclaw channels login` 扫码登录。最后，统一使用 `pnpm openclaw channels status --probe` 进行深度探测，确认所有渠道状态均为 `linked: true` 且路由正常，完成了消息接入的闭环验证。

## 代码演进：三层分支隔离平衡上游更新与定制稳定

鉴于 OpenClaw 频繁的官方更新与我的定制需求，我放弃了直接修改 `main` 分支的危险做法，转而实施"upstream/main（官方）- origin/main（同步）- origin/production（生产）”的三层分支隔离策略。初始化时，我添加了上游远程 `git remote add upstream` 并创建了 `production` 分支。在同步流程上，我采用了保守的 `cherry-pick` 选择性同步策略，仅将上游的安全修复和关键 Bug 修复应用到生产分支，而非全量合并，以此最小化定制冲突。特别是在 Windows 环境下，针对 `pnpm build` 因默认调用 WSL bash 而失败的问题，我在 `.npmrc` 中配置了 `script-shell` 指向 Git Bash，并使用 `git update-index --skip-worktree .npmrc` 防止该本地配置被提交，成功构建了稳定的生产环境底座。

## 智能调度：构建 Cron 精确执行与 Heartbeat 周期感知的双驱动体系

为了实现无人值守的知识产出，我区分了“精确执行”与“周期感知”的场景边界。对于需要特定时间点执行且上下文隔离的自动化脚本（如每日晨报生成），我配置了 Cron 任务，设置 `sessionTarget="isolated"` 配合 `payload.kind="agentTurn"`，确保任务在独立会话中运行且不污染主上下文。而对于低成本的日常状态巡检（如监控收件箱或日历空闲状态），则利用 Heartbeat 机制，设置每 30 分钟触发一次，通过 `HEARTBEAT.md` 检查清单让 Agent 主动感知环境。这种双驱动体系既保证了关键任务的准时交付，又避免了高频轮询带来的资源浪费。

## 自我进化：OADA 闭环与预算约束防止 Agent 失控

在赋予 Agent 自我优化能力时，我构建了"OADA（观察 - 分析 - 决策 - 执行 - 验证）”全自动进化闭环，使其从被动响应转向目标导向。为了防止自动化迭代导致资源耗尽，我严格执行了单任务并发控制原则，同一时间仅允许一个进化任务处于 `in_progress` 状态。同时，设置了双重预算约束：时间预算限制在 48 小时内，Token 预算限制在 5-10 万之间，一旦超限立即触发预警或降级。更重要的是，我保留了人类在关键决策点的干预权，所有代码或配置修改前自动备份带时间戳的副本，确保具备一键回滚能力，防止逻辑偏离。

## 安全防御：本地中继隔离与全栈可观测筑牢防线

针对浏览器控制这一高风险场景，我部署了 Browser Relay 架构，通过本地中继服务器（端口 18792）与 Chrome 扩展徽章状态机配合，实现了 AI 对浏览器标签页的安全可控共享，杜绝了直接暴露 CDP 端口的风险。只有当扩展徽章显示红色 `ON` 时，Agent 才能操作特定标签页。此外，结合 `openclaw doctor --deep` 进行深度安全审计，检查网关是否仅绑定 loopback 地址以及 DM 策略是否过于开放。在可观测性方面，启用了 OpenTelemetry 指标导出，实时监控 `openclaw.tokens` 消耗趋势与 `openclaw.run.duration_ms`，确保系统在透明可控的状态下运行。

## 今天的收获

- **部署前置检查至关重要**：在配置渠道前必须确认 `gateway.mode=local` 及模型状态，否则会导致网关启动失败或路由异常。
- **分支隔离是稳定性的基石**：采用 upstream/main、origin/main、origin/production 三层架构配合 cherry-pick 同步，能有效平衡框架快速迭代与生产环境稳定。
- **调度需区分场景精度**：精确任务用 Cron (`isolated` + `agentTurn`)，日常巡检用 Heartbeat，两者互补可构建高效的自动化闭环。
- **进化必须带刹车**：实施 OADA 闭环时，必须配套单任务并发锁、Token/时间双重预算及自动备份回滚机制，防止 Agent 失控。
- **浏览器控制需中继隔离**：利用 Browser Relay 本地中继与扩展徽章机制，是解决 AI 安全控制已登录浏览器会话的最佳实践。
