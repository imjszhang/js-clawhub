# Equipping the Knowledge Base with "Auto-Cruise": Multi-Repo Registration and Cron in Action

> Day 36 · 2026-03-07

Yesterday, I was still manually typing commands to process a single knowledge base. Today, I decided to completely free my hands. I'm upgrading `js-knowledge-prism` from "on-demand triggering" to "auto-cruise," enabling it to monitor multiple knowledge bases simultaneously and perform batch processing on a schedule.

## Rejecting "Clumsy" Polling: Reusing Idempotency

Drawing from my previous experience with `js-knowledge-collector`, my instinct was to copy its `inbox/batch/archive` file rotation mechanism. After all, that's the standard paradigm for handling link queues—safe and reliable. But halfway through writing it, I stopped: Prism's processing logic differs from Collector's.

Collector needs to move new links in and out to prevent duplicate consumption. However, Prism's `runPipeline` is inherently idempotent and incremental—it automatically discovers unprocessed files by comparing the `journal` directory with the `atoms` directory. This means even if I set Cron to run every minute, it will automatically skip execution if there's no new content, producing no side effects.

This realization saved me about 30% of the architecture design workload. I didn't need to design a complex file state machine; I just needed a simple registry file, `registry.json`, to record the `lastProcessedAt` timestamp for each repository. The final solution became exceptionally clean: Cron triggers → read registry → iterate through enabled repos → run pipeline if updates exist → write back timestamps. This feeling of "going with the flow" was far more satisfying than forcing a pattern fit.

## One Tool vs. Five Conversations: The Token Efficiency Trade-off

When designing the execution flow for Cron's isolated sessions, I faced a choice: should the Agent loop-call the `process_single` tool for each repository, or should I encapsulate a `process_all` tool to handle everything in one go?

At first glance, loop calling aligns better with "single responsibility" and results in cleaner code. But doing the math reveals the problem: if there are 5 knowledge bases, loop calling means the Agent performs 5 tool invocations.加上 (plus) the context understanding before and after, this generates at least 11+ LLM round-trips. For a scheduled task running every minute, this isn't just a latency issue; it's a bottomless pit of token burning.

So, I毫不犹豫地 (without hesitation) chose the "ugly but efficient" solution: implementing a `knowledge_prism_process_all` tool. Inside the plugin, it reads the registry, iterates through all enabled repositories, executes the processing logic serially, and finally returns only a single summary to the Agent. This way, no matter how many repositories are managed, each Cron trigger consumes only 1 tool invocation quota. In automated operations scenarios, reducing LLM interaction counts is far more important than code structure elegance.

## The Workspace Path Playing "Hide and Seek" with Config Options

The biggest pitfall during implementation surprisingly came from a seemingly simple path resolution. I needed to locate the OpenClaw workspace root directory to store `registry.json`.

Following intuition, I directly tried reading `api.config.agents.defaults.workspace`, only to get `undefined` in the Cron isolated session. After debugging for half a day, I discovered that OpenClaw's configuration structure is a bit "cunning": the workspace path is sometimes in `defaults`, but other times hidden in `agents.list[0].workspace`, depending on the startup scenario (CLI, Gateway AI tool, or Cron session).

To solve this game of "hide and seek," I wrote a three-level fallback parser: prioritize `defaults.workspace`; if that fails, try `list[0].workspace`; finally, fallback to `process.cwd()`. Testing revealed that in the Cron scenario, it always hits the second level, steadily pointing to `D:/.openclaw/workspace`. This detail serves as another reminder: never assume config options will be where you expect them; multi-level fault tolerance is the survival rule for plugin development.

## Today's Takeaways

- Prioritize reusing the natural idempotency of business logic to avoid over-designing complex state rotation mechanisms.
- In high-frequency automation scenarios like Cron, reducing LLM round-trip counts is more important than code modularity.
- Config option parsing must establish a multi-level fallback mechanism; strictly prohibit hardcoding or single-path assumptions.
- The plugin layer handles scheduling and registration, while the core library maintains single responsibility; this is the clear boundary for extending functionality.
