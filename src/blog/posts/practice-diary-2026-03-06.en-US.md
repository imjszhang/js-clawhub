# Stuffing Standalone Tools into an Agent: A Practical Guide to Pluginizing the Knowledge Collector

> Day 35 · 2026-03-06

Today, I'm transforming the newly minted `js-knowledge-collector` from a standalone CLI tool into an OpenClaw plugin. This allows the AI Agent to directly invoke scraping and summarization capabilities, while seamlessly mounting the original Web UI (previously running on port 3000) onto the Gateway.

## The "Culture Shock" of Pure ESM Projects and Dynamic Imports

Following the `JS-Eyes` template, I quickly set up the `openclaw-plugin/` directory structure. However, I hit a classic pitfall in the `index.mjs` entry file. Out of habit, I copied an old pattern using `createRequire(import.meta.url)` to `require` the internal `collector.js` module, which immediately threw an `ERR_REQUIRE_ESM`.

It then dawned on me: my project is already a pure ESM environment with `"type": "module"`. All `.js` files are ES modules, so CommonJS's `require` simply cannot load them. The solution is straightforward: drop the `createRequire` wrapper and use dynamic `import()` directly.

```javascript
// Incorrect approach
const { collect } = require("../cli/lib/collector.js");

// Correct approach
const { collect } = await import("../cli/lib/collector.js");
```

This change not only fixed the error but also意外 (unexpectedly) brought a performance bonus: dynamic imports are lazy-loaded. The corresponding business logic is only loaded when the Agent actually calls the `knowledge_collect` tool, reducing memory usage during plugin startup.

## Letting the Web UI "Parasitize" Under Gateway Routes

Originally, the project had an independent HTTP server running on `localhost:3000`. The goal now is to serve it through the same port as the OpenClaw Gateway (default 18789). Checking the documentation, I found that the legacy `api.registerHttpHandler()` was removed in version 2026.3.2 and must be replaced with `api.registerHttpRoute()`.

What surprised me most was the frontend compatibility handling. The API requests in the original frontend `src/index.html` used relative paths without leading slashes (e.g., `fetch('api/v1/articles.json')`). This means that when the page is accessed via `http://localhost:18789/plugins/knowledge/`, the browser automatically resolves the relative path to `.../plugins/knowledge/api/v1/articles.json`, which hits exactly the route I registered in the plugin.

**No frontend code changes were required at all.** This "accidental" compatibility saved a massive amount of refactoring work.

However, when handling the wildcard route for static files `/plugins/knowledge/{filePath}`, I added a double safety net. First, I relied on the OpenClaw routing system's "specific path priority" principle. Second, I added an explicit check inside the handler: if the sub-path starts with `api/`, it immediately returns a 404 to prevent the wildcard from accidentally intercepting API requests. Additionally, for SQLite database connections, I switched from "long-lived connections" to "open/close per request" to avoid holding file handles during the Gateway's long runtime, which could lead to locking issues.

## Separating Skills from Data

To ensure the `link-collector` skill deploys automatically with the plugin, I declared `"skills": ["./skills"]` in `openclaw.plugin.json`. Here, I made a key design decision: **separating skill files from runtime data**.

Skill definition files (like `SKILL.md`) travel with the plugin as read-only resources, shared across all workspaces. In contrast, runtime-generated queue files (`inbox.jsonl`, `batch-*.jsonl`) must remain stored independently in each workspace's `.openclaw/link-collector/` directory. This ensures unified updates for skill logic while guaranteeing data isolation and concurrency safety for different workspaces.

## Today's Takeaways

- Internal module references in pure ESM projects must use dynamic `import()`; using `createRequire` will result in `ERR_REQUIRE_ESM`.
- Frontend API requests using relative paths without leading slashes naturally adapt to the Gateway's plugin route prefixes.
- When operating SQLite within Gateway routes, adopt an "open/close per request" mode to avoid holding file handles for extended periods.
- Plugin skill files should be read-only and shared, while runtime data must be isolated within the local workspace to ensure concurrency safety.
- Time-consuming tasks (such as LLM summarization) must be decoupled from the main session via an inbox/batch rotation mechanism to prevent blocking interactions.
