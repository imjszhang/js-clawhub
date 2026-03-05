# Giving Agents a "Biological Clock": The Trade-off Between Cron and Heartbeat

> Day 6 · 2026-02-05

Yesterday, we taught the Agent to "react passively." Today, it's time to give it a "biological clock" so it can take initiative even when no one is calling. I originally thought this would be as simple as configuring a scheduled task, but during setup, I discovered that OpenClaw actually hides two completely different automation mechanisms. Choosing the wrong one doesn't just prevent tasks from running; it can also turn your main session into a complete mess.

## The Session Target That Almost Turned the Main Session into a "Dumpster"

This morning, I wanted to add a task for the Agent to execute a script every 5 minutes, so I casually typed a command to periodically run `python workflow.py`. Naturally, I assumed the task would just run in the main session since it's the same Agent anyway.

However, after running it a few times, I noticed the main session was flooded with script execution logs and intermediate states from tool calls. The originally clean conversation context was so polluted it became unreadable. Even worse, when I tried to chat with the Agent about something else later, it was still stuck in the context of the previous script execution, giving me completely irrelevant answers.

Digging into the documentation, I found the culprit: I had configured `sessionTarget` as `main`. It turns out OpenClaw's Cron tasks have two execution spaces: `main` shares the context with our daily conversations (suitable for reminders), while `isolated` is designed for background automation tasks. Each run in `isolated` creates a brand-new temporary session with an ID format like `cron:<jobId>`, which is discarded immediately after execution, ensuring zero pollution to the main dialogue.

I quickly used `openclaw cron edit` to change the task to `--session isolated`, and the world instantly became quiet again. This taught me a hard rule: If you want the Agent to execute shell commands, run scripts, or perform background syncs, you must blindly choose `isolated`. Only simple notifications like "Remind me to drink water in 20 minutes" deserve to use `main`.

## Cron's "Precision Strike" vs. Heartbeat's "Fuzzy Perception"

After solving the session pollution issue, I wrestled with another question: Should certain tasks use Cron or Heartbeat?

I previously thought Heartbeat was just a simplified version of Cron since both involve running on a schedule. But after diving deeper today, I realized they represent two completely different mindsets.

Heartbeat acts like a manager with "fuzzy perception." It wakes up by default every 30 minutes (or every hour in OAuth mode), glances at the `HEARTBEAT.md` checklist asking, "Any urgent matters in the inbox?" or "Any meetings in the next two hours?". If there's nothing, it replies with `HEARTBEAT_OK` and silently discards the rest, causing no disturbance. It only delivers messages if there's actual business. Its advantage is resource efficiency; a single call can cover multiple checks without making the session appear "falsely active" due to heartbeats.

Cron, on the other hand, is a special forces unit for "precision strikes." You can use cron expressions to pinpoint "every Monday at 9 AM" or use `--at` to set a one-time reminder for "20 minutes from now." More importantly, Cron tasks (especially in `isolated` mode) can specify stronger models (like `opus`), higher thinking levels, and even execute full `agentTurn` sequences to invoke tools.

I originally tried using Heartbeat to generate a daily report, but I found it couldn't guarantee delivery exactly at 23:30 every day, nor could it force a high thinking level for deep analysis. In the end, I had to老老实实 (humbly) configure a Cron job with `--cron "30 23 * * *" --tz "Asia/Shanghai"` to get the job done.

The strategy is now clear: Leave "hitchhiking" tasks like daily monitoring and inbox scanning to Heartbeat. For tasks requiring precise timing, independent execution environments, or deep analysis, you must use Cron. Combining both is the optimal solution.

## Today's Takeaways

- Choosing the wrong `sessionTarget` will directly pollute the main session context; background automation tasks must strictly use `isolated` mode.
- Heartbeat is a "fuzzy perception" batch checking mechanism suitable for low-cost monitoring; Cron is an "precision strike" independent task system suitable for scheduled execution and deep analysis.
- If a Cron task is configured as `systemEvent` + `main`, the Agent might only "see" the message without performing actual operations; it needs to be changed to `agentTurn` + `isolated`.
- The `--tz` timezone configuration in Cron is critical; otherwise, the scheduled time will drift based on the Gateway host's local timezone.
- The best practice is to let Heartbeat handle daily perception and Cron handle precise scheduling and independent tasks; they are complementary, not mutually exclusive.
