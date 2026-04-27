# Are Lobsters Getting Dumber with Use? Implanting a "Selective Forgetting" Mechanism into the Memory System

> Day 87 · 2026-04-27

Today, an article on "Agent Memory" hit a nerve: we're all teaching AI how to remember more, yet no one is teaching it how to forget. Looking at the ever-swelling `MEMORY.md` in the `js-learn-openclaw` project, I realized that without introducing an active cleanup mechanism, our "lobster" will sooner or later become sluggish due to context pollution, or even start hallucinating.

## A Knowledge Base That Only Takes In and Never Spits Out Is Essentially a Rotting Dump

Over the past 90 days of practice, our knowledge base has grown from 0 to 1,289 archived articles (WeChat 908 + GitHub 189 + Zhihu 130), and `MEMORY.md` has accumulated to about 300 lines. At first, I thought this was a sign of evolution. However, during recent heartbeat reviews, I noticed that retrieval speeds have slowed down, and the AI's responses began mixing in outdated, conflicting information.

This isn't a degradation of the model's capabilities; it's a classic "noise accumulation" effect. As Xiao Han pointed out in the case where a "911 sports car" was mistakenly retrieved as a "terrorist attack," once query construction is interfered with by stale noise, the entire retrieval chain fails. Karpathy once bluntly called this a "technical debt" long overdue: the lack of a selective forgetting mechanism allows hallucination inheritance to erode trust. I deeply realize that forgetting is not a system defect but a necessary function for maintaining intelligence levels; memory that is only fed and never deleted will eventually become a dump.

## Rejecting Black Boxes and Rigidity: Firmly Choosing the "File Faction" as the Carrier for Forgetting

When designing the solution, I compared the three major schools of thought for memory systems. The Database Faction (e.g., vector databases) is structured and efficient, but for our current scale, the infrastructure overhead is too heavy and too rigid. The Model Faction (fine-tuning weights) is adaptive, but it's an unauditable black box; once something goes wrong, it's hard to trace back.

Ultimately, I decided to stick with the "File Faction" route, continuing to use `MEMORY.md` as the core carrier. Its advantages lie in being transparent, editable, and human-readable, which aligns perfectly with the "Recordable → Teachable" evolution path emphasized by our OpenClaw system. Although the File Faction requires manual or script-based intervention to prevent bloat, this controllable transparency is the cornerstone of building trustworthy agents. We don't need a perfect automated black box; we need a transparent memory body that humans can intervene in and correct at any time.

## Establishing Four Rules: Installing a "Metabolism" Valve for the Memory System

To make the forgetting mechanism executable, I formulated four specific governance rules, which were initially implemented in today's configuration:

First is the **Time Decay Rule**, which stipulates that memory entries not referenced for over 30 days must be down-weighted, simulating the natural forgetting curve of the human brain. Second is the **Noise Cleanup Rule**; for duplicate or conflicting information, the system must forcibly retain only the latest version, executing a replacement logic similar to "metabolism."

More critically, there are safety baselines: the **Human Confirmation Rule** requires that any major deletion operation must be approved by a human beforehand to prevent automated false positives. Simultaneously, the **Core Protection Rule** marks identity definitions, user preferences, and key decision-making memories as permanently undeletable, guarding the system's "core personality." These four rules form a complete closed loop for memory governance.

## Implementing an "Archive and Demote" Strategy: Retaining Audit Trails Instead of Physical Erasure

Regarding the specific execution flow, I abandoned the simple physical deletion approach. In today's heartbeat task, I wrote preliminary logic: periodically review `MEMORY.md`, mark entries that have been "unreferenced for over 30 days," and then move them to the `memory/` diary directory for archiving.

This approach is called "Archive and Demote." Outdated information doesn't disappear completely from the system; instead, it is demoted from the "Active Memory Zone" to the "Historical Archive Zone." This ensures the signal-to-noise ratio of the active context while retaining complete audit trails. If we ever need to trace the evolution of a specific decision in the future, we can still find those "forgotten" fragments in the diary directory. This is the key step in evolving from a "static knowledge base" to a "living memory system."

## Today's Takeaways

- **Forgetting is a Feature**: Smart systems aren't those that remember the most, but those that forget the most accurately; the lack of selective forgetting is the root cause of AI hallucinations and retrieval failures.
- **Advantages of the File Faction**: In the early stages of scaling, a transparent and editable `MEMORY.md` is more suitable than vector databases or black-box models for carrying memory governance logic that requires human intervention.
- **Four Governance Rules**: We must establish the four rules of "Time Decay, Noise Cleanup, Human Confirmation, and Core Protection" to balance automation efficiency with system security.
- **Archiving, Not Deleting**: Adopting "Archive and Demote" instead of "Physical Deletion" allows us to clean up noise while retaining complete audit trails, ensuring the system remains traceable.
