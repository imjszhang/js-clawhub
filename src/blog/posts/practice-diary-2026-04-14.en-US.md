# Lobster No Longer Needs Me to Tell It What It Has: JS-Eyes 2.0 Shatters the Pre-set Skill Ceiling

> Day 74 · 2026-04-14

Today's core mission was to completely liberate JS-Eyes from "sub-plugin hell" by finalizing the 2.0 architecture refactor. Facing the structural pain points of version 1.x—where adding a single skill required manual config edits and maintaining redundant files—I decided to execute a paradigm shift to a "Single Main Plugin + Automatic Skill Discovery" model. This transforms the system from "users telling it what it has" to "the system discovering what it has on its own."

## Saying Goodbye to Sub-Plugin Hell: The Structural Pain Points of 1.x

Before the refactor, I took a hard look at the heavy burden of the 1.x architecture. Back then, every skill (like X.com search, Bilibili videos, Xiaohongshu notes, etc.) was an independent OpenClaw sub-plugin. This meant that for every new skill a user installed, they had to endure a tedious five-step process: download ZIP, extract, run `npm install`, manually add the path to `~/.openclaw/openclaw.json`, and restart OpenClaw.

Even more critical, this architecture死死 (deadly) capped the system's potential at "the number of skills already developed." The config file was cluttered with entries for the main plugin and 8 sub-plugins, with enable/disable states scattered across `plugins.entries` and dependencies in disarray. Readers rarely asked "how to configure"; instead, they constantly asked, "Can I use XX website?" The answer was always a helpless "Wait until someone writes that skill." This model, characterized by high maintenance costs, heavy user burden, and an inability to extend to un-pre-set skills, had become a bottleneck stifling ecosystem growth.

## Architecture Flip: Establishing the "Single Main Plugin + Auto-Discovery" Core Mechanism

The core decision for version 2.0 was to completely abandon the multi-sub-plugin model in favor of a single main plugin that automatically scans the `skills/` directory upon startup. In this refactor, we deleted the duplicate `openclaw-plugin/` subdirectories (containing `index.mjs`, `openclaw.plugin.json`, and `package.json`) from every skill directory. Across 8 skills, this amounted to removing 24 redundant files.

The code logic converged significantly, reducing the total line count by 309 lines (75 files changed, 475 lines added, 784 lines deleted). The installation process is now simplified to: download, extract, install dependencies, write the enabled state, and restart; the rest is handled automatically by the main plugin. Skill registration no longer relies on manually configuring `plugins.load.paths`; instead, the main plugin scans the directory at startup to register them automatically. Furthermore, enabling or disabling skills no longer modifies the global OpenClaw config but directly writes to the `skillsEnabled` field in JS-Eyes' local config. This change marks a fundamental shift in architectural logic: moving from manual configuration to system awareness.

## Protocol Implementation: The Skill Contract Standard and Hot-Update Mechanism

To solidify the foundation for ecosystem expansion, I defined a strict **Skill Contract** standard protocol. Each skill now only needs to retain a single `skill.contract.js` file, which must export the `createOpenClawAdapter` factory function. This function receives the plugin config and a logger object, returning a standard object containing the tool list, CLI command definitions, and runtime requirements (e.g., whether a server, browser extension, or login state is needed).

At the protocol layer (`packages/protocol/skills.js`), I implemented the `discoverLocalSkills` function to scan directories and identify contracts, along with the `loadSkillContract` function to load them. Notably, the loading mechanism introduces `require.cache` clearing logic, enabling hot updates for skill contracts so they take effect without restarting the main process. Coupled with a unified `curl` installation script (`curl -fsSL https://js-eyes.com/install.sh | bash -s -- <skillId>`), the barrier to entry for new skills has been drastically lowered.

## Smooth Transition: A Seamless Backward-Compatible Migration Strategy

The biggest fear in an architecture upgrade is breaking existing user habits. To address this, I implemented a seamless backward-compatible migration strategy. By adding the `getLegacyOpenClawSkillState` function, the system can automatically read the enable/disable states from the old `plugins.entries` in `openclaw.json` and migrate them to the `skillsEnabled` field under the new architecture.

During local migration testing, the logs clearly recorded `Migrated N legacy OpenClaw skill state entries`, ensuring that users upgrading to version 2.0 can retain their original skill states without any manual intervention. This imperceptible transition mechanism guarantees a smooth evolution from the old config to the new ecosystem, preventing user churn caused by the architectural refactor.

## Ecosystem Leap: From "Number of Developed Skills" to "Any Website with a Written Contract"

With the refactor complete, the ecological boundaries of JS-Eyes have been彻底 (thoroughly) opened. The system currently supports 17 AI tools, including 9 built-in base tools provided by the main plugin (such as `js_eyes_get_tabs`, `js_eyes_open_url`, etc.) and tools provided by 8 extension skills. These extension skills cover mainstream platforms like X.com, Bilibili, YouTube, Zhihu, Xiaohongshu, WeChat Official Accounts, Reddit, and Jike.

More importantly, the capability ceiling no longer depends on how many skills our team has developed. It has leaped to "any website where someone has written a contract." As long as a developer writes a `skill.contract.js` compliant with the contract based on `@js-eyes/client-sdk`, Lobster can learn to operate any website. The future direction will be to provide generic skill contract templates to further lower the development threshold, truly achieving an evolution from "install what you know" to "learn what you see."

## Today's Takeaways

- **Architectural Paradigm Shift**: Transformed system logic from "manual user configuration" to "automatic system discovery." By deleting 24 redundant files and reducing code by 309 lines, we significantly lowered maintenance costs and user burden.
- **Value of Standardized Protocols**: Defined `skill.contract.js` and the `createOpenClawAdapter` factory function. Coupled with the `require.cache` clearing mechanism, this achieved standardization of skill interfaces and hot-update capabilities.
- **Breaking Ecosystem Boundaries**: Shattered the pre-set ceiling of "number of developed skills," expanding the system's upper limit to "any website with a writable contract," laying the foundation for a community-driven skill ecosystem.
- **Imperceptible Migration Strategy**: Utilized `getLegacyOpenClawSkillState` to automatically read and migrate old config states, ensuring continuity of user experience during the architecture upgrade.
- **Elevated Narrative Perspective**: The narrative of technical refactoring should not be limited to "simplified configuration" but should emphasize "opening capability boundaries," empowering the agent with the potential for self-evolution.
