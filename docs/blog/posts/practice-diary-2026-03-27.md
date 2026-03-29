# 把编码外包给 Cursor：OpenClaw 架构降本的关键一跃

> Day 56 · 2026-03-27

今天终于捅破了 OpenClaw 成本优化的最后一层窗户纸：将高消耗的编程任务从原生 Chat 上下文中彻底剥离，通过 ACP 协议外包给 Cursor CLI。这不仅是配置上的微调，更是从“可记录”向“可教学”演进中，解决 Token 成本结构性难题的必经之路。

## 为什么必须把文件读写外包给外部 Harness

过去几天团队一直在抱怨 OpenClaw 的 Token 消耗过快，经过对 `acp-cursor-agent-integration` 的深度复盘，我找到了根源：成本大头不在日常对话，而在读文件、写代码这些高频 IO 操作。每次让主 Agent 直接操作文件系统，都在大量消耗 Chat 模型的上下文窗口。

ACP（Agent Client Protocol）的设计初衷正是为了解决这个问题。它允许 Gateway 将编程任务「外包」给外部 Harness（如 Cursor CLI、Codex 等），由外部工具自己的计费体系承担编码 Token，OpenClaw 仅负责编排和路由。我们在 3.24 版本就引入了 `js-cursor-agent` 插件并实现了完整的 `AcpRuntime` 接口，但一直未在配置中「开阀门」。今天确认，这不是可选优化，而是从成本角度使用 OpenClaw 的结构性必要措施，必须实现主对话与编码执行的物理隔离。

## 配置优先级陷阱与后端激活机制

在激活 ACP 的过程中，我差点掉进配置优先级的坑里。ACP 体系在 OpenClaw 中有两条线：一是 IDE 桥（stdio 接 Gateway），二是运行时 + 外挂 Harness。我们关注的是后者。配置生效遵循严格的覆盖顺序：`bindings[].acp` > `agents.list[].runtime.acp` > 全局 `acp.*`。

检查 `d:\.openclaw\openclaw.json` 时发现，虽然 `js-cursor-agent` 已安装且代码中注册了 `registerAcpRuntimeBackend({ id: "cursor" })`，但全局 `acp` 配置块完全缺失。这意味着插件代码接好了水管，但总阀门没开。必须在 `gateway` 之前显式插入 `acp` 块，设置 `enabled: true` 和 `backend: "cursor"`，同时在插件配置中补齐 `command`（指向 `agent.cmd`）、`model`（如 `composer-1.5`）及 `permissionMode`。此外，插件元数据 `openclaw.plugin.json` 需声明完整的 `configSchema` 和 `uiHints`，并移除 Gateway 模式下无效的限制字段，确保外部运行时能被正确调用。

## 代码级覆写：解除本地会话限制与实现并行隔离

为了让 ACP 在 Gateway 模式下顺畅运行，必须处理两层限制重叠的问题。Gateway 已有完整的生命周期管理，插件侧若保留 `maxSessions` 和 `idleTtlMinutes` 限制，会导致竞态和冲突。

我在 `openclaw-plugin/index.mjs` 入口硬编码了覆写逻辑：`overrides = { maxSessions: 0, idleTtlMinutes: 0 }`。但这还不够，底层解析逻辑默认会将 `0` 视为无效值并回退到默认配置。因此，我同步修改了 `core/config.js` 中的 `intOrDefault` 函数，使其支持 `parsed >= 0` 的判断，让 `0` 值能穿透默认处理；并在 `core/process-manager.js` 中调整逻辑，当 `maxSessions <= 0` 时跳过并发检查，`idleTtlMinutes <= 0` 时不启动回收器。

这一系列改动确保了 ACP 会话拥有独立的 Session Key（格式为 `agent:main:acp:<uuid>`），与主 Agent 的 `main` 通道完全隔离。不同 Session Key 对应不同的 Actor Queue，实现了长任务与主对话的完全并行执行，互不阻塞。

## 运行时监控兜底与多模型扩展能力

架构落地后，运维监控成为关键。ACP 长任务的单轮上限受 Gateway `timeoutSeconds`（当前设为 4800 秒，约 80 分钟）限制，但 JSON-RPC 层提供了 24 小时的安全兜底。空闲回收则由 Gateway 的 `RuntimeCache` 依据 `acp.runtime.ttlMinutes` 统一管理。

为了实时掌握状态，我们建立了多层监控手段：聊天侧可通过 `/acp status`、`/acp sessions` 查看；CLI 侧支持 `openclaw cursor doctor` 和 `openclaw cursor sessions`；日志层则每轮打印 `acp-dispatch` 详情。在模型灵活性上，系统支持通过 `agent.cmd --list-models` 动态获取 80+ 个模型列表（包括 `composer-1.5`、`claude-4.6-opus`、`gpt-5.4` 等），并允许未来安装 `acpx` 作为第二后端，实现 Codex 或 Claude Code 的多后端并存方案。

## 今天的收获

- **成本结构重构**：编程任务必须通过 ACP 外包给外部 Harness（如 Cursor），这是降低 Chat 模型上下文成本的结构性必要措施，而非可选优化。
- **配置穿透机制**：在 Gateway 模式下，需在插件入口硬编码覆写 `maxSessions` 和 `idleTtlMinutes` 为 0，并修改底层解析逻辑使 0 值穿透，避免生命周期冲突。
- **并行隔离设计**：ACP 会话使用独立的 `agent:main:acp:<uuid>` 键值，确保长任务与主对话在不同 Actor Queue 中完全并行，互不阻塞。
- **监控与兜底**：利用 `/acp doctor` 和 CLI 工具实时监控状态，依赖 JSON-RPC 层的 24 小时机制作为长任务的安全兜底。
- **动态模型扩展**：通过 `agent.cmd --list-models` 实时获取可用模型列表，支持在不重启的情况下灵活切换后端模型。
