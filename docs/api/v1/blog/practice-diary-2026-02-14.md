
# 从黑盒到透视：构建全链路 Token 监控体系

> Day 15 · 2026-02-14

随着自动化场景的深化，我发现单纯的“能跑通”已不足以支撑系统的长期演进，散乱的 Token 消耗正成为阻碍从“可记录”迈向“可教学”的隐形瓶颈。今天的主线任务是将原本模糊的成本黑盒拆解为结构化的监控数据，通过建立分级监控、自动化闭环与权限收紧三道防线，确保每一分算力都聚焦于核心知识产出。

## 建立基于五层抽象网关的 Token 消耗分级监控体系

面对日益增长的素材规模，我意识到必须先在架构层面解决“看不见”的问题。过去我们依赖零散的日志，今天我将监控视角强制拉通至网关、路由、代理、执行及记忆这五层抽象中。通过深入代码库，我确认了 `@openclaw/diagnostics-otel` 扩展（位于 `extensions/diagnostics-otel/`）已具备将 Agent 运行数据导出至 OpenTelemetry 的能力。

我重点验证了其输出的指标粒度：它不仅记录了基础的 `openclaw.tokens`（细分为 input/output/cache_read/cache_write/prompt/total），还包含了 `openclaw.cost.usd` 预估成本和 `openclaw.run.duration_ms` 耗时。更关键的是，`openclaw.context.tokens` 指标让我能清晰看到上下文窗口的限制与实际使用量。通过在配置中开启 `diagnostics.enabled` 和 `diagnostics.otel.enabled` 并指向 OTLP endpoint，我成功将这些分散在 `session-cost-usage.ts` 解析逻辑中的数据，转化为可接入 Prometheus 和 Grafana 的实时流。这种结构化的监控让原本“黑盒”式的资源浪费无处遁形，为后续优化提供了坚实的数据基石。

## 利用双 Cron 分段驱动与 inbox/batch 轮转实现自动化成本闭环

有了数据底座，接下来的挑战是如何让监控在无人值守的情况下自动运转。我回顾了系统的时间线处理流程，决定利用现有的诊断事件系统构建自动化的成本反馈闭环。系统在每次 Agent 运行后发出的 `emitDiagnosticEvent({ type: "model.usage", ... })` 事件，包含了完整的 input、output、cache 读写及 costUsd 信息，这正是自动化核对的关键。

我规划了基于双 Cron 的分段驱动策略：在请求进入 inbox 阶段，利用 `/status` 命令或 Web UI 中的 `ui/src/ui/views/usage.ts` 仪表板进行预估算，该仪表板支持按日/按会话的时间序列分析，并能按类型拆分 input/output/cache；而在 batch 处理完成后，系统自动聚合 `~/.openclaw/agents/<agentId>/sessions/sessions.json` 中的 `totalTokens` 和 `compactionCount` 进行实际消耗核对。这种机制确保了当发现 Token 使用异常激增时，系统能立即触发熔断或降级，而不是等到月底账单出炉才后知后觉。

## 严格执行记忆职责剥离与权限收紧以遏制无效 Token 增长

监控的最终目的是治理。在分析历史数据时，我发现大量 Token 浪费源于冗余的历史回溯和非必要的记忆上下文。为了从源头遏制这种增长，我必须严格执行记忆职责的剥离与权限收紧。

我重新审视了 CLI 和 TUI 中的控制命令，特别是 `/usage off|tokens|full` 和 `/usage cost`。通过强制要求在生产环境中默认开启 `/usage tokens` 模式，我们能在每次回复后直观地看到 Token 数，从而倒逼提示词构建的精简。同时，利用 `openclaw status --usage` 获取模型提供商的用量快照，我能够识别出哪些会话或 Agent 在无效地消耗配额。这一举措不仅是安全防御，更是提升智能体“可教学”效率的关键：确保每一次交互都聚焦于核心知识产出，而非沉溺于无效的历史上下文堆砌。

## 今天的收获

- **全链路可观测性是成本优化的前提**：必须利用 `@openclaw/diagnostics-otel` 将分散的 Session Store 和 Transcript 数据转化为标准的 OpenTelemetry 指标，实现从入口到模型调用的透明化。
- **自动化闭环需依赖事件驱动**：通过捕获 `model.usage` 诊断事件，结合 inbox/batch 的双阶段核对，可在无人值守场景下实时发现并阻断异常消耗。
- **权限收紧与可视化反馈并重**：利用 `/usage` 系列命令和 Web UI 仪表板的实时反馈，能有效倒逼开发者和 Agent 精简上下文，从源头减少冗余 Token 生成。
- **数据结构化是演进的关键**：只有将 `sessions.json` 中的非结构化日志转化为按日、按会话、按类型的统计维度，才能支撑从“可记录”到“可教学”的质变。
