# Outsourcing Coding to Cursor: The Critical Leap in OpenClaw's Cost Reduction Architecture

> Day 56 · 2026-03-27

Today, we finally pierced the last layer of the window paper for OpenClaw's cost optimization: completely decoupling high-consumption programming tasks from the native Chat context and outsourcing them to the Cursor CLI via the ACP protocol. This isn't just a minor configuration tweak; it's the inevitable path to solving the structural challenge of Token costs as we evolve from being "recordable" to "teachable."

## Why File I/O Must Be Outsourced to an External Harness

Over the past few days, the team has been complaining about OpenClaw's rapid Token consumption. After a deep retrospective on `acp-cursor-agent-integration`, I found the root cause: the bulk of the cost doesn't come from daily conversations, but from high-frequency I/O operations like reading files and writing code. Every time we let the main Agent directly manipulate the file system, we burn through the Chat model's context window.

The original design intent of ACP (Agent Client Protocol) was precisely to solve this problem. It allows the Gateway to "outsource" programming tasks to external Harnesses (such as Cursor CLI, Codex, etc.), letting the external tools' own billing systems bear the coding Tokens, while OpenClaw remains responsible only for orchestration and routing. We introduced the `js-cursor-agent` plugin and implemented the full `AcpRuntime` interface in version 3.24, but we never actually "opened the valve" in the configuration. Today, I confirmed that this isn't an optional optimization; it is a structural necessity for using OpenClaw from a cost perspective. We must achieve physical isolation between the main conversation and code execution.

## Configuration Priority Traps and Backend Activation Mechanisms

During the ACP activation process, I nearly fell into a configuration priority trap. The ACP system in OpenClaw has two lines: the IDE bridge (stdio connecting to the Gateway) and the Runtime + External Harness. We are focused on the latter. Configuration effectiveness follows a strict override order: `bindings[].acp` > `agents.list[].runtime.acp` > global `acp.*`.

Upon checking `d:\.openclaw\openclaw.json`, I discovered that although `js-cursor-agent` was installed and `registerAcpRuntimeBackend({ id: "cursor" })` was registered in the code, the global `acp` configuration block was completely missing. This meant the plugin code had connected the pipes, but the main valve was never opened. We must explicitly insert an `acp` block before `gateway`, setting `enabled: true` and `backend: "cursor"`. Simultaneously, we need to fill in the `command` (pointing to `agent.cmd`), `model` (e.g., `composer-1.5`), and `permissionMode` in the plugin configuration. Furthermore, the plugin metadata `openclaw.plugin.json` must declare a complete `configSchema` and `uiHints`, while removing invalid restriction fields for Gateway mode, ensuring the external runtime can be invoked correctly.

## Code-Level Overrides: Lifting Local Session Limits and Achieving Parallel Isolation

To ensure ACP runs smoothly in Gateway mode, we had to address the issue of overlapping restrictions on two levels. Since the Gateway already has complete lifecycle management, retaining `maxSessions` and `idleTtlMinutes` limits on the plugin side would lead to race conditions and conflicts.

I hard-coded the override logic in the `openclaw-plugin/index.mjs` entry point: `overrides = { maxSessions: 0, idleTtlMinutes: 0 }`. But that wasn't enough; the underlying parsing logic defaults to treating `0` as an invalid value and falling back to default configurations. Therefore, I synchronously modified the `intOrDefault` function in `core/config.js` to support the `parsed >= 0` check, allowing the `0` value to penetrate the default handling. I also adjusted the logic in `core/process-manager.js` to skip concurrency checks when `maxSessions <= 0` and not start the reclaimer when `idleTtlMinutes <= 0`.

This series of changes ensures that ACP sessions possess an independent Session Key (formatted as `agent:main:acp:<uuid>`), completely isolated from the main Agent's `main` channel. Different Session Keys correspond to different Actor Queues, achieving fully parallel execution of long-running tasks and main conversations without blocking each other.

## Runtime Monitoring Fallbacks and Multi-Model Extensibility

With the architecture landed, operational monitoring became key. The single-round upper limit for ACP long tasks is constrained by the Gateway's `timeoutSeconds` (currently set to 4800 seconds, approx. 80 minutes), but the JSON-RPC layer provides a 24-hour safety fallback. Idle reclamation is uniformly managed by the Gateway's `RuntimeCache` based on `acp.runtime.ttlMinutes`.

To grasp the status in real-time, we established multi-layer monitoring methods: on the chat side, you can view status via `/acp status` and `/acp sessions`; on the CLI side, we support `openclaw cursor doctor` and `openclaw cursor sessions`; at the log level, `acp-dispatch` details are printed every round. Regarding model flexibility, the system supports dynamically fetching a list of 80+ models (including `composer-1.5`, `claude-4.6-opus`, `gpt-5.4`, etc.) via `agent.cmd --list-models`, and allows installing `acpx` as a second backend in the future, enabling a multi-backend coexistence solution for Codex or Claude Code.

## Today's Takeaways

- **Cost Structure Refactoring**: Programming tasks must be outsourced to external Harnesses (like Cursor) via ACP. This is a structural necessity for reducing Chat model context costs, not an optional optimization.
- **Configuration Penetration Mechanism**: In Gateway mode, you must hard-code overrides for `maxSessions` and `idleTtlMinutes` to 0 in the plugin entry point and modify the underlying parsing logic to allow the 0 value to penetrate, avoiding lifecycle conflicts.
- **Parallel Isolation Design**: ACP sessions use an independent `agent:main:acp:<uuid>` key, ensuring long-running tasks and main conversations run fully in parallel in different Actor Queues without blocking each other.
- **Monitoring and Fallbacks**: Use `/acp doctor` and CLI tools to monitor status in real-time, relying on the JSON-RPC layer's 24-hour mechanism as a safety fallback for long tasks.
- **Dynamic Model Extension**: Fetch the list of available models in real-time via `agent.cmd --list-models`, supporting flexible switching of backend models without restarting.
