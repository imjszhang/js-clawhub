# From User to Creator: The Breakthrough Moment of Releasing Three Plugins in One Day

> Day 26 · 2026-02-25

Today felt like someone hit the fast-forward button. I originally planned to just organize some notes, but instead, I powered through the entire workflow: pluginizing "Knowledge Prism," integrating "JS-Eyes" for browser control, and finally publishing these skills to the ClawHub public registry. This day marks my official transition from a mere OpenClaw user to a creator within the ecosystem.

## Turning Tedious Manual Workflows into an Agent's Mantra

A few days ago, while manually running the "Knowledge Prism" decomposition process, I was nearly driven away by the repetitive labor: extracting atoms, grouping them, and converging the synthesis. Every time I added a new journal entry, I had to type a bunch of commands in the terminal and closely monitor the LLM's output for review. This fragmentation was terrible—if AI can help me write code, why do I still have to switch back to the terminal to act as a "human dispatcher" when managing my knowledge base?

So today, I decided to transform the `js-knowledge-prism` CLI tool into an OpenClaw plugin. While studying the source code, I discovered the plugin system is stricter than I imagined: it must rely on `openclaw/plugin-sdk` rather than internal modules, be driven by the `openclaw.plugin.json` manifest, and pass a series of security loading validations. The biggest pitfall was marking tools as `optional: true` during registration, which caused them to vanish completely from the Agent's tool list. After digging through the source code for ages, I realized it was because the `tools.allow` whitelist wasn't configured with `group:plugins`, causing optional tools to be silently filtered out.

Once I solved this "invisibility" issue, the experience became instantly smooth. Now, after writing a journal entry, I can simply tell the Agent "execute incremental processing," and it automatically calls the `knowledge_prism_process` tool to complete the three-stage decomposition. Even the `git diff` review happens right within the conversation flow. This shift from "switching to the terminal to type commands" to "conversation as execution" is the core value of pluginization—shortening the feedback loop and truly integrating tools into the workflow.

## Letting the Agent Control My Real Browser, Not a Sandbox

Another major move was integrating JS-Eyes. Although OpenClaw's built-in `browser` tool can launch Chromium, it runs as an independent sandbox instance, unable to reuse the GitHub or Gmail sessions already logged in on my daily browser. For scenarios requiring actual logged-in states, the built-in tool was essentially useless.

JS-Eyes fills this gap with a WebSocket + browser extension architecture. It's quite clever: the browser extension connects to the local port 18080, the OpenClaw plugin embeds a Server that starts automatically, and the Agent directly controls the Chrome or Firefox instance I'm currently using via 7 registered tools (such as `js_eyes_get_tabs` and `js_eyes_execute_script`). I hit a small snag during configuration: the plugin loaded successfully and the service started, but the Agent couldn't invoke the tools, instead calling the built-in `browser` and returning an empty array. Investigation revealed it was the `optional: true` trap again, combined with the Agent's mechanism of prioritizing built-in tools. I had to explicitly guide it in the workspace's `TOOLS.md` to "must use js_eyes_* series tools" and allow the plugin group in the configuration to finally get everything working.

Now, when I ask the Agent to "check my GitHub login status," it can directly read cookies from my real browser. When I tell it to "batch extract prices from these 5 product pages," it injects scripts directly into my active tabs. This ability to perform "lossless control" over the user's real environment transforms automation from a toy into a productivity powerhouse.

## Publishing to ClawHub: From Local Code to Public Skills

After finishing the first two plugins, the natural next thought was: these tools are so good, how can others install them with one click? This led to today's third task—publishing to ClawHub.

ClawHub is like the npm of the AI Agent world, but it only accepts text files (.md, .js, .json, etc.) and rejects binary packages. The core of the publishing process is writing `SKILL.md`. The YAML frontmatter at the top must declare metadata such as `name`, `version`, and required environment variables. ClawHub uses these declarations to perform safety comparisons against the code's actual behavior. I used the `npx clawhub publish` command to push the JS-Eyes plugin directory, specifying the slug as `js-eyes` and version `1.4.0`. Midway through, I encountered an issue where the browser OAuth login callback was blocked by a firewall; switching to manual login with `--token` resolved it.

After successful publication, the skill entered the security scanning queue and became visible automatically a few minutes later. Now, anyone can run `clawhub install js-eyes` to automatically download and configure it, without needing to manually clone code or edit JSON files. This mechanism of "text metadata-driven + semantic search + automated distribution" makes skill sharing as simple as posting a tweet.

## Today's Takeaways

- The core value of pluginization isn't technical flashiness, but shortening the feedback loop by eliminating context-switching costs.
- OpenClaw has a silent filtering mechanism for tools marked `optional: true`; they only take effect if the `tools.allow` whitelist is explicitly configured.
- JS-Eyes fills the capability gap of the built-in sandbox browser in "logged-in interaction" scenarios by reusing the user's real browser sessions.
- ClawHub skill publishing follows strict text metadata-driven specifications, where security reviews compare frontmatter declarations against actual code behavior.
- True Agent-First distribution requires building autonomous installation scripts and multi-source fallback chains to decouple from third-party marketplace review policies.
