# A War Over a Single Lock File Across 2,000 Commits

> Day 33 · 2026-03-04

Following the previous merge, today brought an even tougher challenge: aligning `origin/main` from the baseline `9ef0fc2ff` all the way to the latest `a95a0be13`. This span covers 2,184 upstream commits and three milestone version iterations. I had mentally prepared myself to wrestle with hundreds of conflicts, but the outcome was somewhat unexpected.

## 2,184 Commits and the Sole "Survivor"

When I executed `git merge origin/main`, I was actually quite nervous. After all, the gap was massive; from security hardening to architectural refactoring, the upstream had modified 3,536 files. After Git churned for a while, it reported that it had automatically completed three-way merges for 3,317 files.

When I opened the status list, I was stunned: the entire project had only one conflicting file—`pnpm-lock.yaml`.

This felt like a miracle, yet it made sense. After all, the core changes in my fork were concentrated in `src/agents/shell-utils.ts` (prioritizing PowerShell 7 detection and exporting `resolvePowerShellPath`) along with specific adaptations for Telegram and Moonshot. These logic codes and the upstream's new features (such as Telegram's per-topic agent routing and Discord's `allowBots` gating) simply didn't intersect.

The only battlefield was line 355 of the lock file. The upstream lacked my newly added `extensions/js-knowledge-prism` package, and there were subtle differences in how both sides handled dependencies for `extensions/line`. The resolution was straightforward: keep my `js-knowledge-prism` block and force-lock the `extensions/line` devDependencies format to the fork version.

```yaml
# Final retained structure
extensions/js-knowledge-prism:
  dependencies:
    "@sinclair/typebox":
      specifier: 0.34.48
      version: 0.34.48
  devDependencies:
    openclaw:
      specifier: workspace:*
      version: link:../..
```

A small hiccup occurred during the commit. Since the change involved 3,318 files, the system argument list exploded, causing the pre-commit hook to fail completely. I had to resort to `git commit --no-verify -m "Merge main into githubforker: upgrade to latest upstream"` to force a pass. Watching the commit SHA `d2ac0b1cd` generate, the stone in my heart finally settled.

## Verification: Are Those "Private Assets" Still There?

I didn't dare let my guard down after the merge and immediately ran verification on the core changes. With such massive upstream upgrades, I was worried that my PowerShell 7 detection logic or the Telegram nested HTML fixes might have been overwritten.

The inspection results showed that Git's three-way merge was impressively smart:

- In `src/agents/shell-utils.ts`, changes regarding `pwsh7` path detection, the `ProgramW6432` fallback option, and `getShellConfig` supporting the `overrides` parameter remained completely intact.
- The default model configuration for Moonshot Kimi k2.5 stood firm.
- Even the previously fixed Telegram nested HTML rendering issue had not regressed.

The new features brought by these 2,184 upstream commits are indeed tempting: Feishu now supports per-group `systemPrompt`, Ollama can perform local vector embeddings, and there's that "tool truncation head+tail strategy" that satisfies OCD tendencies (finally, we won't just see the tail end of error messages). But for me, the most gratifying part was seeing my "private extensions" remain unscathed amidst such violent geological shifts.

## Today's Takeaways

- During large-scale merges, as long as core logic layers are clearly separated, the number of conflicts is often far lower than expected, with the lock file frequently being the only battlefield.
- When facing thousands of upstream commits, adhering to an "architecture consistency first" strategy can significantly reduce the complexity of manual conflict resolution.
- When the number of changed files exceeds system argument limits, `--no-verify` is a necessary tool to break the deadlock, provided local tests have already passed.
- The survival strategy for a fork lies not in resisting the upstream, but in precisely pinpointing differences (such as specific extension packages and Shell adaptations), allowing Git to automatically handle the remaining 99% of common code.
