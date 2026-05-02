# From "Installing Eyes" to "Browser Operating System": The Architectural Leap of JS-Eyes 2.6

> Day 92 · 2026-05-02

Today's main quest was to redefine `js-eyes` from a simple "web scraping plugin" into an "AI Browser Operating System." The core driver behind this shift is the independent architecture of the Sub-skill Harness and the deepening of security defenses introduced in the 2.6.x series. Facing maintenance bottlenecks caused by the exponential growth of our asset library, we stopped chasing feature bloat. Instead, we decoupled upgrade channels and standardized interaction protocols, empowering the system with the ecological capability to evolve itself.

## Reshaping Architectural Perception: From Tool to Infrastructure

In the KL03 phase, I equipped the "Lobster" with `js-eyes` to solve the fundamental problem of "seeing the browser." By KL28, we achieved automatic skill discovery. But it wasn't until today's release of version 2.6.2 that I truly realized `js-eyes` is no longer a single-function tool; it has evolved into a complete "Browser Operating System."

This cognitive shift stems from a review of the current architectural landscape: the system now comprises the browser side (Chrome/Firefox extensions), the server side (`server-core` + `protocol`), the CLI management tool (npm `js-eyes`), the OpenClaw plugin layer, and a skill layer covering 11 major platforms including X, Reddit, YouTube, GitHub, WeChat, and Bilibili. Crucially, native browser messaging implemented via `native-host` allows us to handle all AI-browser interactions on a standardized level. This isn't just a simple increase in feature count; it's an essential leap from an "external addon" to "infrastructure."

## Sub-skill Harness: Solving the "Change One, Move All" Pain Point

In the early architecture, all skills were tightly bound to the parent version number. Fixing a bug in the Reddit skill often required upgrading the entire `js-eyes` core. This "change one, move all" model became a massive maintenance bottleneck as the skill ecosystem expanded. Today's core breakthrough lies in the "independent sub-skill upgrade channel" introduced in version 2.6.0.

We refactored the 11 sub-skills into independent Harness units, each possessing its own `skill.contract.js` security contract and `minParentVersion` definition. This means the Reddit skill can independently iterate its comment expansion logic without waiting for the release window of YouTube or GitHub skills. This design grants each sub-skill independent boundaries, contracts, and upgrade rhythms. As verified in practice, leveraging `reddit_search` can return heat-sorted results within 1 second, while `reddit_get_post` fetches three levels of comment details in 1.7 seconds. Even `reddit_expand_more` can flatten 500 "more" node sub-comments in one go. The rapid iteration of these deep research capabilities is a direct dividend of the decoupling brought by the Harness architecture.

## Security Depth and Stability: The Cornerstone of Unattended Operations

As automation scenarios deepen, execution safety and long-chain stability have become unavoidable concerns. In version 2.6.2, responding to ClawHub's security scans, we modularized 5 flagged call points and implemented a three-tier security classification: READ, INTERACTIVE, and DESTRUCTIVE. Simultaneously, we added integrity validation for `extraSkillDirs` (optional) and enabled the `js-eyes doctor --json` command to output a complete security status report, making system risks visible and controllable.

Regarding stability, version 2.6.1 focused on conquering memory leaks caused by long-running processes. We identified `MaxListenersExceededWarning` and `process.on('exit')` listener leaks as the primary culprits. Consequently, we refactored the `register()` method to be idempotent, ensuring that `teardown` is executed before reconstruction during hot reloading or re-entry. Furthermore, we added fingerprint detection to the skill hot-reload mechanism and configured noise filtering for `chokidar`, effectively avoiding invalid triggers and resource waste caused by file change jitter. These polished details ensure the system remains rock-solid during deep research tasks lasting several days.

## Today's Takeaways

- **Architectural decoupling is the prerequisite for ecosystemization**: By upgrading sub-skills into independent Harness units (independent versions, independent contracts), we completely resolved the "fix one, patch all" maintenance pain point of the old architecture, achieving true skill ecosystem evolution.
- **Security classification must land on call points**: It cannot remain at the conceptual level. Like in 2.6.2, the three-tier READ/INTERACTIVE/DESTRUCTIVE classification must be implemented through the modular splitting of specific flagged call points.
- **Long-chain automation relies on idempotent design**: For long-running Agent tasks, making core methods like `register()` idempotent and implementing fingerprint detection for hot reloading are key to preventing memory leaks and state inconsistencies.
- **Cognitive upgrades drive technical evolution**: Shifting from "giving AI eyes" to solve login state issues, to "giving AI a Harness" to solve controllability for all browser interactions, this change in positioning directly guided the direction of architectural refactoring.

- [G117: JS-Eyes 2.6's positioning has completely leaped from a "web scraping tool" to an "AI Browser Operating System"](./G117-js-eyes-2-6-browser-os.md)
- [G118: JS-Eyes 2.6's Sub-skill Harness architecture upgrades browser interaction from a single tool to a controllable, evolving ecological OS via "independent versioning + security classification + hot reloading" mechanisms](./G118-js-eyes-subskill-harness.md)
