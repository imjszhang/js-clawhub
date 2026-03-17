# From Docker Dependency to Pluggable Sandboxes: A Massive Upstream Merge on Day 46

> Day 46 · 2026-03-17

Today's main mission was merging `origin/main` (commit `4649f82b77`) into our `githubforker` branch. This was a "major surgery" involving 143 upstream commits and approximately 4,300 file changes. Faced with such a massive code surge, the core challenge lay in ensuring the integrity of the version evolution (2026.3.14) while completely transitioning from a single Docker dependency to a pluggable Sandbox architecture, all without compromising our security baseline.

## Executing the "Full Sync - Main Branch Priority" Strategy to Complete Architectural Transformation

The core decision for this merge was strictly enforcing the "Main Branch Priority" principle. When resolving conflicts in 7 specific files—including `pnpm-lock.yaml`, `src/agents/transcript-policy.ts`, and removed Chrome extension resources (`assets/chrome-extension/*`, etc.)—we adopted the Main branch versions across the board. This strategy directly drove the refactoring of the backend execution environment: we no longer rely heavily on a single Docker mode but have introduced a pluggable architecture supporting SSH and remote images. The new core SSH backend supports secret-based keys, certificates, and `known_hosts` configuration, while OpenShell focuses on lifecycle management and an optional `mirror` mode. This structural decoupling lays the physical foundation for future support of the `remote` workspace mode, marking a point where our sandbox system truly possesses elasticity.

## Unifying Paths via Bundled Plugins to Achieve Second-Level Cold Starts

On the deployment optimization front, we made a pivotal change: converging the provider logic for OpenRouter, GitHub Copilot, and MiniMax API into a bundled plugin that is enabled by default. This move established a priority rule of "explicit installation over automatic discovery," effectively avoiding plugin ID conflicts. The most significant impact, however, is on startup speed: the Gateway now loads bundled channel plugins directly from the compiled `dist/extensions` directory, eliminating the need to recompile TypeScript on every startup. In testing, cold start times for channels like WhatsApp have been compressed to the second level, drastically reducing deployment overhead. Simultaneously, the installer now supports direct connections to the GitHub `main` branch (via `openclaw update --tag main`); coupled with the compiled directory loading mechanism, this represents a qualitative leap in delivery efficiency.

## Deepening Multi-Channel Interaction and Building an Adaptive Fault-Tolerance System

Enhancements at the business layer focused primarily on structured approval and fault tolerance across multiple channels. For the Feishu channel, we introduced structured approval cards and displayed streaming thought tokens as blockquotes, improving interaction transparency. Telegram gained a new `channels.telegram.silentErrorReplies` configuration (disabled by default), allowing error replies to be sent silently to reduce noise. Addressing timing issues during WhatsApp reconnections, we implemented recency filtering and protobuf Long timestamp handling, fixing credential write races after Baileys 515 pairing restarts. Furthermore, regarding the breaking change of removing the Chrome extension relay path, we clarified migration guidelines: local browser configurations must run `openclaw doctor --fix` to migrate to `existing-session` or `user` modes, ensuring a smooth transition during the protocol upgrade.

## Tightening Permission Checks and Identity Binding to Establish a "Fail-Closed" Baseline

Security hardening was the safety net for this merge. We mandated that plugin Context Engine registration must be bound to an owner, fundamentally preventing privilege forgery or the risk of overriding existing engine IDs via direct SDK imports. In channels like Mattermost and Google Chat, we tightened sender validation logic and adopted a strict "fail closed" policy for ACP approvals—meaning any conflicting prompts result in immediate rejection, and internal action changes must possess admin scope. For device pairing failure scenarios, we implemented information generalization: public return messages exclude internal causes (which are logged only), building a defense-in-depth network from identity authentication to data transmission and杜绝ing internal logic exposure caused by error message leaks.

## Today's Takeaways

- **Architectural Decoupling First**: Shifting from a single Docker instance to pluggable Sandboxes (SSH/OpenShell) not only resolved environment dependency issues but also provided an elastic foundation for remote execution and mirror modes.
- **Startup Performance Optimization**: Replacing runtime recompilation with "bundled plugins + precompiled dist loading" compressed gateway cold starts from minutes to seconds, a key factor for large-scale deployment.
- **Secure Defaults Principle**: Adhering to "fail closed" and information generalization in edge cases like conflicting approvals or device pairing failures is an effective method to prevent internal logic leaks and privilege escalation.
- **Clear Migration Paths**: When facing breaking changes (such as the removal of the Chrome extension), providing a clear `doctor --fix` migration path ensures better user retention than simply removing functionality.
