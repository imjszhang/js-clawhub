# Installing a "Fuel Gauge" on AI: Building a Full-Stack Token Observability System

> Day 15 · 2026-02-14

Yesterday, I was still wrestling with context compression strategies for the Agent. Today, I decided to pause and install a complete "fuel gauge" for this "gold-swallowing beast." After all, blindly optimizing without knowing how much each run costs is like driving blindfolded. Today's mission is clear: review and validate OpenClaw's existing token monitoring capabilities, ranging from the command line to the Web UI, and finally to enterprise-grade OpenTelemetry, to build a full-stack observability loop.

## From "Black Box" to "Transparent": Instant Feedback in the CLI

Initially, my biggest concern was the inability to perceive the cost of a single call during development. Previously, I could only guess or check bills on the cloud provider's console after the fact, which was far too laggy.

Fortunately, the project already includes a very intuitive TUI command. By simply typing `/status` within a session, I can instantly see the current model, context usage, and even the **estimated cost** based on the input/output tokens of the most recent reply. This detail was a pleasant surprise; it directly translates abstract token counts into "dollars," the metric developers care about most.

To control information density more precisely, I also tried `/usage off|tokens|full`. When `full` mode is enabled by default, a cost footer is appended to the bottom of every reply. If you prefer seeing pure numbers without interrupting your train of thought, switching to `tokens` mode does the trick. Embedding monitoring data naturally into the chat flow is far more user-friendly than staring at a separate window. For heavy CLI users, `openclaw status --usage` can also directly fetch quota snapshots from the model provider, allowing you to check if today's "fuel" is sufficient to finish the test cases without switching contexts.

## Breaking Data Silos: Connecting to Grafana with OpenTelemetry

While the CLI is great, it only shows real-time or single-run data. For long-term trend analysis or integration into company-wide monitoring dashboards, we need the `@openclaw/diagnostics-otel` extension.

This part took some tinkering. At first, I thought simply installing the extension would suffice, but I found that token data wasn't flowing out automatically. After digging into the code, I discovered that after the Agent runs, it emits a `model.usage` diagnostic event containing detailed fields like `input`, `output`, `cacheRead`, `cacheWrite`, and even `context.limit`. However, this event is "dumb" by default. You must explicitly configure `diagnostics.enabled` and `diagnostics.otel.enabled`, and specify the OTLP endpoint, for the `diagnostics-otel` extension to consume these events and export metrics.

Once the pipeline was established, the results were immediate. Prometheus instantly gained metrics like `openclaw.tokens` (split by type), `openclaw.cost.usd`, and `openclaw.run.duration_ms`. This means we can not only see how much money was spent but also analyze whether a surge in input tokens was caused by low cache hit rates or if a specific Agent's execution time was anomalous. Unifying business metrics (Token costs) with infrastructure metrics (latency, error rates) under the OpenTelemetry standard makes subsequent alerting and automated rate limiting a logical next step.

## Visualizing the Big Picture: Multi-Dimensional Perspective in the Web UI

Beyond low-level data export, the Web dashboard provided by `ui/src/ui/views/usage.ts` serves as the "cockpit" for the team.

It supports time-series displays by day or by session, with the ability to toggle between cumulative or per-turn modes. The most practical feature is sorting: I can sort sessions by "cost" or "error count" to quickly identify those that are both expensive and unstable. The data source is solid, directly parsing aggregated JSONL transcript logs from `session-cost-usage.ts`, ensuring consistency between the UI display and underlying storage.

## Today's Takeaways

- **Monitoring must be layered:** Rely on TUI commands for instant feedback, Web UI for historical analysis, and OpenTelemetry for system integration.
- **Cost visualization is the first step:** Real-time conversion of token counts into estimated USD prices significantly boosts developer cost awareness.
- **Diagnostic events are the central hub:** The standardized `model.usage` event decouples data collection from export, making it easy to extend monitoring dimensions.
- **Cache metrics cannot be ignored:** Monitoring `cacheRead/Write` tokens separately is key evidence for optimizing context strategies.
- **Data sources determine credibility:** Parsing directly from Session Transcripts (JSONL) avoids errors introduced by secondary statistical aggregation.
