# Breaking the Short-Command Model: Cursor Agent's Zero-Dependency Architecture and Long-Running Process Pool in Action

> Day 47 · 2026-03-18

Today's core mission was integrating Cursor IDE's `agent acp` capabilities into the OpenClaw system. However, while diving deep into the existing `acpx` plugin, I hit a fundamental architectural conflict: the original "spawn-exec-exit" short-command model is completely incompatible with Cursor's long-running, stateful sessions based on stdio JSON-RPC. This forced me to abandon simple configuration patches and instead build a standalone process management solution.

## The Fundamental Conflict Between Short-Command Models and Long-Running Sessions

When I first tried adding the Cursor agent as a standard harness agent in the `acpx` configuration dictionary, I quickly realized this path was a dead end. The design intent of OpenClaw's existing `acpx` plugin is to spawn a new process for every operation, which exits immediately after execution. This stateless mode clashes entirely with the behavior model of Cursor `agent acp`. 

Once started, Cursor runs as a long-lived process, maintaining continuous JSON-RPC 2.0 (NDJSON) communication via stdin/stdout. It not only supports creating and switching multiple sessions within the same process but also dynamically initiates specific method calls at runtime, such as `session/request_permission` for permission requests and `cursor/ask_question`. This "stateful" characteristic means that patching it directly into a short-command framework is not only unfeasible but would also lead to lost session context and deadlocks in permission interactions. Establishing the necessity of independent long-running process management became imperative.

## Zero-Dependency Core Layer and Multi-Entry Adaptation Architecture

To solve the binding issue and maximize reusability, I adopted an architecture strategy of "one core logic + three consumption entry points." I extracted the core business logic into pure JavaScript modules under the `core/` directory, strictly adhering to a zero OpenClaw dependency principle to ensure it isn't locked into any specific platform. 

On this foundation, I built three thin adapter entry points: a standalone CLI tool for debugging and direct interaction, an MCP Server for invocation by other IDEs (like Claude Desktop), and a plugin layer specifically designed for OpenClaw. This layered design concentrates all intelligence in the `core` layer, while the plugin layer is solely responsible for implementing the `AcpRuntime` interface for bridging. This maintains consistency with the style of the `js-knowledge-flomo` project while leaving ample room for future cross-scenario reuse.

## Automatic Recycling of Long-Running Process Pools and Permission Policies

The stability of the core layer relies on my custom-built `ProcessManager`, which completely overturns the previous one-off process model. This manager maintains a process pool mapped by `sessionKey`, defaulting to a limit of 4 concurrent instances; when exceeded, it automatically evicts the oldest process. 

More critically, it includes a scanning mechanism that runs every minute to automatically reclaim instances idle for over 30 minutes, freeing up resources. To address permission blocking in non-interactive environments, I automatically injected three permission policies (`approve-all`, `approve-reads`, `deny-all`) during the spawn phase. These can automatically handle tool usage requests issued by Cursor, ensuring smooth operation of automated workflows without human supervision.

## Custom JSON-RPC Transport Layer and Streaming Interaction

At the communication protocol level, I ditched the heavy official SDK and hand-wrote a lightweight JSON-RPC 2.0 transport layer using Node.js's native `readline` module. This `JsonRpcTransport` component not only handles standard outbound requests (auto-incrementing IDs + pending Promises) and matches inbound responses but also specifically deals with server-side requests with IDs sent by Cursor (such as permission approvals) and ID-less one-way notifications (like `session/update`). 

Based on this, I encapsulated the `acp-client`'s `prompt` method as an `AsyncGenerator`. While waiting for Cursor's response, it can real-time `yield` streaming events like `text_delta` and `tool_call`, perfectly adapting to Cursor's real-time interaction needs and avoiding the disjointed experience caused by traditional blocking calls.

## MCP Dual-Mode Entry Points and Runtime Bridging Implementation

Finally, I implemented these core capabilities in two concrete forms. The MCP Server provides both stdio and HTTP (`--http --port`) dual-mode entry points, exposing six management tools including `cursor_session_new` and `cursor_prompt`, achieving universal invocation across IDEs. 

On the OpenClaw plugin side, the `CursorRuntime` class exists strictly as a thin adapter. It delegates interface calls like `ensureSession` and `runTurn` directly to the core layer without containing any business logic. Currently, this plugin supports driving the IDE directly via `/acp spawn cursor` in OpenClaw chat and has reserved an evolution path for persistently binding sessions to channels/threads, laying the groundwork for future cross-restart recovery.

## Today's Takeaways

- **Architecture Decoupling Principle**: Core logic must be zero-dependency, bridging different runtimes via thin adapters to avoid locking the project into a specific platform (like OpenClaw).
- **Process Model Matching**: When integrating external AI tools, you must strictly match their process model (short-command vs. long-running stateful). Forced adaptation leads to severe stability issues.
- **Streaming Communication Encapsulation**: Using `AsyncGenerator` to encapsulate JSON-RPC long connections is the best practice for handling real-time streaming events (`text_delta`/`tool_call`).
- **Automated Permission Governance**: In non-interactive scenarios, automated permission approval policies (e.g., `approve-all`/`read`) must be preset; otherwise, the automation chain will break due to the need for manual confirmation.
- **Resource Lifecycle Management**: Long-running process pools must have built-in idle recycling mechanisms (like TTL scanning) and concurrency limits to prevent resource leaks and system overload.
