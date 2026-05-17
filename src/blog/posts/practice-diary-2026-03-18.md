# 破局短命令模型：构建 Cursor Agent 零依赖长驻进程池

> Day 47 · 2026-03-18

今天最大的挑战源于一个看似简单的集成需求：让 OpenClaw 驱动 Cursor IDE 的 `agent acp`。当我深入分析现有 `acpx` 插件的"spawn-exec-exit"短命令模式时，发现它与 Cursor 基于 stdio JSON-RPC 的长驻有状态会话模型存在根本性冲突，直接在配置字典中修补不仅不可行，更会破坏系统的稳定性。

## 架构决策：从“修补配置”转向“独立进程池”

在分析 OpenClaw 的 ACP 系统时，我确认了我们的需求属于"ACP Runtime"模式，即作为客户端驱动外部工具。然而，Cursor agent 的特殊性在于它是一个长驻进程，启动后需保持运行以维持有状态会话，并动态处理 `session/request_permission` 权限请求及 `cursor/ask_question` 等特有方法。这与 `acpx` 每次操作都生成新进程的机制完全背道而驰。经过权衡，我果断放弃了将 Cursor 强行塞入 `ACPX_BUILTIN_AGENT_COMMANDS` 的捷径，转而决定构建一个独立的长驻进程管理方案，这是解决短命令模型与有状态会话冲突的唯一路径。

## 核心层设计：零依赖模块与多入口适配

为了避免项目被绑死在 OpenClaw 生态中，我参考了 `js-knowledge-flomo` 的成功经验，确立了“一套核心逻辑 + 三种消费入口”的架构策略。我将核心业务逻辑完全剥离至 `core/` 目录，设计为纯 JavaScript 模块，确保其零 OpenClaw 依赖。在此基础上，构建了独立 CLI、MCP Server 和 OpenClaw 插件三种消费入口，其中 OpenClaw 插件层仅作为薄适配器，通过实现 `AcpRuntime` 接口桥接核心层，确保所有智能集中在 core 层，实现了业务逻辑与具体场景的彻底解耦。

## 进程池实现：自动回收与权限策略的平衡

在 `core/process-manager.js` 的实现中，我重点解决了高并发下的资源管理问题。该模块按 sessionKey 映射进程，设置了默认 4 个并发限制，当超出限制时自动驱逐最老的进程。为了防止资源泄漏，我引入了每分钟扫描机制，自动回收空闲超过 30 分钟的实例。针对非交互式环境下的权限阻塞问题，我在进程启动时自动注入了 approve-all、approve-reads、deny-all 三档权限策略处理器，确保 Cursor 的工具权限请求能被自动审批，从而支撑起稳定的会话复用。

## 传输层重构：自研 JSON-RPC 与流式交互

摒弃了对重型官方 SDK 的依赖，我利用 `readline` 和 `JSON.parse` 自实现了轻量级的 JSON-RPC 2.0 传输层。这一层不仅要处理常规的出站请求（自增 ID + Pending Map）和入站响应匹配，还需专门处理 Cursor 发来的带 ID 服务端请求（如权限询问）以及无 ID 的单向通知（如 `session/update`）。特别是在 `core/acp-client.js` 的 `prompt` 方法中，我将其设计为 AsyncGenerator，在等待 Cursor 响应期间，通过队列实时 yield `text_delta` 和 `tool_call` 事件，完美适配了 Cursor 的实时流式交互需求。

## 多场景落地：MCP 双模式与插件桥接

为了验证架构的通用性，我完成了 MCP Server 和 OpenClaw 插件的具体落地。MCP Server 提供了 stdio 和 HTTP 双模式入口，封装了 `cursor_session_new`、`cursor_prompt` 等 6 个管理工具，使得 Claude Desktop 等其他 IDE 也能调用。而在 OpenClaw 插件中，`CursorRuntime` 类严格遵循“薄适配器”原则，将 `ensureSession`、`runTurn` 等方法直接委托给 core 层，不包含任何业务逻辑。项目最终形成了包含 24 个文件的完整结构，从 `cli/cli.js` 的 8 个命令到 `src/index.html` 的暗色主题状态面板，实现了全链路的闭环。

## 今天的收获

- **模型冲突识别**：在集成外部 Agent 时，必须首先辨析其进程模型（短命令 vs 长驻有状态），切忌用旧架构强行适配新范式。
- **零依赖核心层**：通过将核心逻辑剥离为无外部依赖的纯 JS 模块，可轻松实现 CLI、MCP、Plugin 多入口复用，避免厂商锁定。
- **进程池自动化**：长驻服务必须内置并发限制（如默认 4）、老进程驱逐及空闲自动回收（如 30 分钟 TTL）机制，以防资源耗尽。
- **流式协议封装**：针对 JSON-RPC 长连接，利用 AsyncGenerator 封装流式事件（text_delta/tool_call）是提升用户体验的关键。
- **权限策略前置**：在非交互式自动化场景中，需在进程启动阶段注入自动审批策略（approve-all/reads），避免运行时阻塞。
