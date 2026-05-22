# From "Giving It a Pair of Eyes" to a "Browser OS": The Architectural Leap of JS-Eyes 2.6

> Day 92 · 2026-05-02

Today's primary task was to redefine `js-eyes` from a simple "web scraping plugin" into an "AI browser OS." The core driver behind this shift is the rollout of independent upgrade channels for sub-skills (the Harness architecture) in the 2.6.x series, along with a comprehensive hardening of our security defenses.

## Reshaping Architectural Perception: From Tool to Infrastructure

Back in KL03, I equipped the "lobster" with `js-eyes` to solve its problem of "seeing" the browser. By KL28, it had learned to auto-discover new skills. But it wasn't until I was working on version 2.6.2 today that I truly grasped the fundamental shift in its architectural nature: this is no longer just a feature-stacked tool, but a standardized interaction infrastructure.

The current `js-eyes` 2.6.2 has already built out a complete five-layer abstraction architecture: the base layer handles browser extensions for Chrome and Firefox alongside native-host messaging; the middle layer consists of a WebSocket server built from `server-core` and `protocol`; and the upper layer is the skills layer covering 11 mainstream platforms like X, Reddit, YouTube, GitHub, WeChat, and Bilibili, all orchestrated uniformly via `openclaw-plugin` and the npm CLI (`js-eyes`). This cognitive leap from a "single-point tool" to an "operating system" means we're no longer focused on how many scraping functions we've added, but rather on how to provide a stable, scalable, standardized layer for AI-browser interaction.

## The Harness Architecture: Solving the "Change One Thing, Break Everything" Pain Point

In the previous architecture, all sub-skills were tightly coupled to the parent version number. Fixing a bug in the Reddit skill often meant upgrading the entire system, which severely bottlenecked the evolution of the skill ecosystem. The core breakthrough in today's 2.6.0 release is the introduction of the "sub-skill Harness mechanism."

Now, each of the 11 sub-skills has its own independent version upgrade channel and a `minParentVersion` constraint. Every skill operates as an independent Harness unit, complete with its own security contract file (`skill.contract.js`) and clearly defined boundaries. This means we can upgrade `js-reddit-ops-skill` independently without affecting other platform skills, truly enabling a "non-interfering" ecosystem evolution. This design gives each sub-skill its own upgrade cadence, solving the structural problem of high maintenance costs in the old architecture.

## Real-World Validation: The Stability Backbone Behind Deep Research

The architectural upgrade directly showed its value in today's real-world scenarios. I used the updated `js-reddit-ops-skill` to conduct deep research on the "AI coding agent" topic, and the entire process showcased the new architecture's efficiency:

1.  **Search Communities**: Call `reddit_search` to return 10 relevant discussions sorted by popularity within 1 second.
2.  **Fetch Details**: Use `reddit_get_post` to pull post details, completely fetching 334 comments across a 3-level deep structure in 1.7 seconds.
3.  **Cross-Community Comparison**: Quickly switch contexts to compare the vastly different discussion atmospheres around the same event in r/technology (35k upvotes) vs. r/LocalLLaMA (885 upvotes).
4.  **Expand Deep Threads**: Use `reddit_expand_more` to flatten 500 sub-comments under the "more" node in one go, capturing the full context.

The reason this entire chain of operations runs smoothly without crashing over long periods comes down to the memory leak fixes in version 2.6.1. We made the `register()` method idempotent, ensuring a proper teardown before rebuilding during hot reloads. We also added fingerprint detection and `chokidar` noise filtering, completely resolving the `MaxListenersExceededWarning` and file descriptor leak issues.

## Security in Depth: From Passive Scanning to Active Defense

As automation scenarios deepen, execution security has become a top priority. In version 2.6.2, we acted on ClawHub's security scan results by modularly splitting out 5 flagged call sites.

More importantly, we implemented a three-tier security classification strategy: READ, INTERACTIVE, and DESTRUCTIVE. We also added an optional integrity check for `extraSkillDirs`. Now, by running `js-eyes doctor --json`, we can output a comprehensive security status report for the system, shifting security defense from reactive patching to measurable, proactive governance. This marks the establishment of trusted execution boundaries as the system evolves from being "observable" to "teachable."

## Today's Takeaways

- **Architectural decoupling is the prerequisite for ecosystem growth**: By using the Harness mechanism to version sub-skills independently (`minParentVersion` + independent contracts), we've completely eliminated the maintenance bottleneck of "fix one thing, break ten others" in a monolithic architecture.
- **Stability stems from meticulous governance**: Long-running automation tasks must handle `register()` idempotency, hot-reload fingerprint detection, and listener noise filtering. Otherwise, memory leaks are inevitable.
- **Security requires tiering and quantification**: Breaking down operation permissions into READ/INTERACTIVE/DESTRUCTIVE tiers and outputting quantified security states via the `doctor` command is key to building system trust.
- **Cognitive upgrades drive technical evolution**: Shifting from "giving AI eyes" (solving login states) to "giving AI an OS" (solving controllable interaction and evolution) means that a change in positioning dictates the depth of the architecture.

- [G117: JS-Eyes 2.6's positioning has completely leaped from a "web scraping tool" to an "AI browser OS"](./groups/G117-js-eyes-os-positioning.md)
- [G118: JS-Eyes 2.6's sub-skill Harness architecture upgrades browser interaction from a single tool to a controllable, evolving ecosystem OS through "independent versioning + security tiering + hot reload" mechanisms](./groups/G118-subskill-harness-architecture.md)
