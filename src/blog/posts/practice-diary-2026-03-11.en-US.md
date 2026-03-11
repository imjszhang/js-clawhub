# Let the Diary Grow on Its Own: Leaping from Manual Triggers to Unattended Automation

> Day 40 · 2026-03-11

Yesterday, I was still buzzing about the 3D graph upgrade, but today I had to face a more realistic pain point: my knowledge processing pipeline is still only "semi-automated." While the transformation from Journal to Synthesis runs automatically, the steps from Synthesis to Structure and Structure to Output still require me to manually type commands or beg an AI for help. Today's goal is clear:打通 (connect) the latter two stages of the pipeline to achieve a truly "write-and-publish" unattended closed loop.

## Cutting Three Cron Jobs Down to Two: Solving the "Biting Off More Than You Can Chew" Timing Sync Issue

My initial intuition was "separation of duties": since the pipeline has three stages (Journal→Synthesis→Structure→Output), why not configure three separate Cron tasks, with each stage running independently? However, after walking through the logic with the Cursor Agent, I immediately spotted the pitfall: if the Structure refresh and Output generation are split into two independent scheduled tasks, and the former hasn't finished when the latter starts (or their timing gets out of sync), the generated articles will either be empty or contain stale data. To solve this timing synchronization, I would need to introduce complex locking mechanisms or state checks, resulting in a heavy configuration burden prone to errors.

I decisively abandoned the "independent systems" approach in favor of an **integration strategy**. I merged the last two stages into a single `prism-auto-output` task (running every 120 minutes by default), internally divided into two phases: Phase 1 is dedicated to detecting changes in Synthesis and Groups, refreshing the Structure (SCQA + Key Lines) only if changes exist; Phase 2 immediately follows by detecting the mtime of the Structure directory, generating Output only if changes are found.

This "series" design not only eliminates timing races but also naturally achieves deduplication—when the same Perspective is referenced by multiple Bindings, Phase 1 uses a Set to ensure the Structure is refreshed only once. To accommodate the differentiated needs of various perspectives, I also refactored the previously brute-force `refreshStructure: boolean` switch into a `klStrategy` policy: the P23 diary perspective uses `date-driven` to append only new date-based KLs, protecting the existing 19 records from being overwritten; the P01 methodology perspective uses `synthesis` for a full regeneration. With this change, the system finally understands the wisdom of "varying by perspective."

## Borrowing the Collector Pattern: Putting a Bulletproof Vest on Fragile Cron Jobs

Automation is working, but new anxieties arise: What if the process crashes halfway? What if a single Key Line generation fails and blocks the entire queue? Version 1.3.0's `output_all` was like a glass object: no crash recovery, no retry mechanism, and no communication between upstream and downstream. Once an error occurred, manual intervention was required to start over from scratch.

Today's highlight was introducing the **inbox/batch rotation mechanism**, directly copying the producer-consumer pattern from `js-knowledge-collector`. The flow now looks like this: `process_all` appends only a lightweight signal line to `output-inbox.jsonl` when changes are detected; when `output_all` starts, it atomically renames the inbox to `output-batch-<ts>.json`, then processes items one by one like an assembly line.

The most critical improvements are **incremental Checkpoints** and **failure isolation**. Previously, status was written only after everything finished; now, the checkpoint in the batch file is updated after every single Key Line is processed. Even if the process hangs midway, a restart allows it to skip completed items and resume from the breakpoint. For a single failed KL, the system no longer makes "everyone take medicine when one person gets sick"; instead, it marks the item as `retry` and places it in a retry queue, automatically retrying no more than 3 times. If it still fails, it's marked `permanently_failed` and an alert is triggered, without affecting the execution of other KLs in the same batch.

Incidentally, I fixed a hidden trap: originally, when configuring a 120-minute interval, the Cron expression was directly generated as `*/120`, which is illegal in standard Cron (the minute field上限 is 59). I added a `minutesToCronExpr` utility function to automatically convert `*/120` to `0 */2 * * *`. Without handling details like this, the scheduled task simply wouldn't start.

## Today's Takeaways

- In architectural layering, integrating strongly dependent upstream and downstream stages into internal phases of a single task avoids timing synchronization issues better than splitting them into independent tasks.
- Implementing differentiated refresh strategies (`klStrategy`) for different business perspectives (e.g., Diary vs. Methodology) is key to protecting existing data assets.
- Introducing the inbox/batch producer-consumer separation pattern can upgrade fragile scheduled scripts into highly available asynchronous pipelines with resume-from-breakpoint capabilities.
- Although incremental Checkpoints increase file I/O operations, they improve crash recovery reliability by an order of magnitude.
- Failure isolation combined with limited retries (≤3 times) is the best practice for balancing system self-healing capabilities with avoiding infinite loops.
