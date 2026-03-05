# Stop Building Agents Inside Chats: The "Epiphany" Moment of the OpenClaw Architecture

> Day 14 · 2026-02-13

For the past two weeks, I've been wrestling with various errors. Today, I finally slowed down to thoroughly understand the "skeleton" of OpenClaw. I originally thought I just needed to fill in a few configuration items, but I discovered that my understanding of the core concepts was completely fragmented. I even nearly made an irreversible architectural mistake in the code.

## Almost Mistook a "Sub-Agent" for a "New Brain"

The biggest pitfall today stemmed from my desire to have the main Agent dynamically "create" a new, independent Agent at runtime to handle specific tasks. I naturally assumed that since it could call tools, it should also be able to perform magic like `agents.create` to spawn a new entity.

After scouring the documentation and source code, I realized I was completely wrong. OpenClaw strictly distinguishes between **Independent Agents** and **Sub-agents**.

- **Independent Agents** are new entities at the configuration level. They must be created via CLI (`openclaw agents add`) or RPC (`agents.create`) before system startup or externally. They possess their own independent Workspace and `agentDir`.
- **Sub-agents** are merely "background threads" spawned by the main Agent at runtime using the `sessions_spawn` tool. They share the main Agent's Workspace and authentication configuration. Even their system prompts are a lite version (only AGENTS.md + TOOLS.md), and they are archived immediately after execution.

I tried to use `config.patch` to modify `agents.list` as a "workaround" to create an independent Agent. Although the configuration was written successfully, the corresponding Workspace directory and bootstrap files were never generated. This resulted in a "ghost Agent" that was completely non-functional. This design is actually quite brilliant: it forces you to separate "long-term role definitions" from "temporary task executions," preventing an Agent from mutating itself beyond recognition during runtime.

## Reconstructing the Cognitive Map with the Pyramid Principle

After solving the specific creation issue, I realized the previous confusion arose because I lacked a complete map in my head. I spent the afternoon using the Pyramid Principle to reorganize OpenClaw's core concepts, and everything instantly became clear.

I used to feel that Channel, Account, and Agent were all mixed up. Now I see they form a strict five-layer funnel:

1.  **Channel** (Platform): Where the message comes from (WhatsApp/Telegram).
2.  **Account** (Instance): Which number/account is used (Phone Number/Bot Token).
3.  **Agent** (Brain): Who handles the processing (the routing target).
4.  **Workspace** (Home): The Agent's file working area, storing personas (SOUL.md), memories (MEMORY.md), and skills.
5.  **Session** (Context): The bucket for a single conversation, storing history and Token counts.

What really blew my mind was the **isolation mechanism**. I used to worry that multi-user DMs would get crossed. Now I understand that by configuring `session.dmScope: "per-channel-peer"`, the system automatically buckets conversations by contact. Furthermore, long-term memory is stored at the Workspace layer, completely decoupled from the short-term context of the Session. This means that no matter how many different Sessions I have with the same Agent, it can retrieve long-term memory from the same "brain" (Workspace) without mixing A's chat history into B's context. This design of "shared state, isolated context" is the cornerstone of stable multi-Agent systems.

## The "Two Legs" of Creating Independent Agents

Once the concepts were clear, revisiting the operation of creating independent Agents became much smoother. Today I practiced two creation entry points, each with its own pros and cons:

- **CLI Interactive**: `openclaw agents add work`. It acts like a wizard, asking step-by-step for the name, Workspace path, and whether to copy the main Agent's auth. Suitable for manual debugging with a high fault-tolerance rate.
- **Non-interactive/Script**: `openclaw agents add work --workspace ~/.openclaw/workspace-work --non-interactive`. Requires explicitly specifying the path and does not automatically configure auth. Suitable for automated deployment, but you must remember to manually copy `auth-profiles.json` or configure the model separately afterwards.

There is a detail here that is a major trap: the `agentId` is automatically normalized from the name (e.g., "Work Agent" becomes `work-agent`). Also, `main` is a reserved keyword. Do not try to create an Agent named "main," or the system will throw an error immediately.

## Today's Takeaways

- OpenClaw strictly distinguishes between "Independent Agents" (configuration entities) and "Sub-agents" (runtime-derived tasks). The former requires external creation, while the latter is triggered by `sessions_spawn`.
- Long-term memory is stored at the Workspace layer (MEMORY.md), completely decoupled from the short-term conversation context at the Session layer, achieving shared state while isolating history.
- Message routing follows a five-layer funnel: Channel → Account → Agent → Workspace/Session, achieving precise isolation through `bindings` and `dmScope`.
- Never reuse `agentDir` across multiple Agents. Shared credentials should be handled by manually copying `auth-profiles.json`, not by sharing directories.
- Modifying global configurations (such as `agents.list`) does not automatically create file system resources (Workspace/Bootstrap). Full initialization must be performed via CLI or RPC.
