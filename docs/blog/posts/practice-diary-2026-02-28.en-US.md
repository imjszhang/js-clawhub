# When 666 Permissions Blocked My Plugin: A Heart-Stopping Leap for the Independent Distribution System

> Day 29 · 2026-02-28

Yesterday, I finally got the `js-eyes` distribution system up and running. Today, I planned to strike while the iron was hot and explore long-term memory for Agents. Instead, I was immediately "taught a lesson" by a seemingly trivial permission issue. It turns out the robustness required for an independent distribution script is far stricter than I anticipated.

## The "Missing Plugin" Case Caused by 666 Permissions

While testing the installation flow for the sub-skill `js-search-x` this morning, the script reported success, and the configuration was correctly written to `~/.openclaw/openclaw.json`. However, executing `openclaw daemon restart` caused an immediate crash. The error message was bizarre: `plugin not found: js-search-x`. The file was clearly there, so why did the system claim it couldn't find it?

Running `openclaw doctor` revealed the truth: `blocked plugin candidate: world-writable path`. It turned out I was too loose when packaging `js-search-x-skill.zip`; core files like `index.mjs` had permissions set to `0666` (writable by everyone). OpenClaw's security mechanism, `checkPathStatAndPermissions`, is extremely strict. Once it detects any file under the plugin path as "other-writable," it refuses to load the plugin. This also caused the plugin ID parsing in the configuration validation to fail, aborting the entire daemon startup.

This served as a wake-up call: in an automated distribution system, cleaning up permissions after extraction is a step that absolutely cannot be skipped. I urgently added two `find` commands to the extraction logic in `install.sh` to forcibly tighten file permissions to `644` and directory permissions to `755`:

```bash
find "$TARGET" -type f -exec chmod 644 {} + 2>/dev/null || true
find "$TARGET" -type d -exec chmod 755 {} + 2>/dev/null || true
```

With these two lines added, the restart succeeded instantly. It seems I'll need to add this "security checkpoint" to every extraction branch moving forward. Otherwise, given the myriad of user environments, who knows where the next landmine might be.

## Setting Rules for the Memory System: From "Auto-Write" to a "Governance Loop"

After removing the roadblock, I could finally focus on `memory-core` in the afternoon. I previously held a misconception that enabling the memory plugin would automatically record everything. However, research revealed that `memory-core` is essentially just an "index synchronization layer." It doesn't handle semantic storage, nor does it automatically convert session content into memory entries.

Without intervention, expecting it to work automatically would only result in a mess of chaotic indexes. Therefore, I decided to establish rules for the memory system: **writing and retrieval must be decoupled, and there must be a clear governance cycle.**

I made several modifications on the `~/.openclaw` runtime side:

1.  **Define Templates**: Added `memory/_TEMPLATE.md` and `MEMORY.md` specifications to clarify what is worth remembering versus what is merely a log.
2.  **Build Pipelines**: Wrote `scripts/memory_digest.py` to periodically extract high-value events from execution logs and generate formal `memory/YYYY-MM-DD.md` files, rather than letting the Agent write randomly.
3.  **Set Strategies**: Explicitly stated the "search before answer" principle in `HEARTBEAT.md` and added `memory/RETRIEVAL.md` to solidify high-frequency query templates.
4.  **Weekly Review**: Created `memory_weekly_review.py` to run automatically once a week, calculating hit rates, noise rates, and actionability rates, forcing myself to optimize memory quality.

With this combination of measures, the memory system finally evolved from "usable" to "maintainable." After all, the value of long-term memory lies not in how much is stored, but in whether it can be precisely retrieved when needed.

## Today's Takeaways

- Independent distribution scripts must include a permission cleanup step after extraction; otherwise, they will be directly blocked by the host system's security mechanisms.
- OpenClaw's plugin loader has zero tolerance for `world-writable` permissions. This is a baseline for preventing malicious tampering, not an optional feature.
- The core of a long-term memory system is not "automatic recording," but a closed loop of "high-quality input sources" and "regular governance."
- Decoupling heartbeat detection from memory writing prevents state logs from polluting the long-term knowledge base.
- A memory system without quantitative metrics (such as hit rate and noise rate) will eventually degrade into an unusable data dump.
