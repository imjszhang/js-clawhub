# Rejecting the Black Box: Building a Three-Tier Collaborative Cognitive Exoskeleton

> Day 58 · 2026-03-29

Facing the common pain points of "uncontrollable black boxes" and "lack of layering" in current AI memory solutions, today I officially established a three-tier decoupled architecture consisting of Native Memory, Knowledge Prism, and Collector. The goal is to transform scattered timeline notes into structured digital assets that compound in value over time.

## Breaking the Black Box: From Single-Layer Cache to Three-Tier Decoupling

While reviewing the first 11 entries of my "Shrimp Farming Diary" series, I realized a core difference: Why can my "Lobster" remember context, while ChatGPT's Memory often gets things wrong and Claude's Projects require manual uploads? The root cause is that mainstream solutions are either complete black boxes or rely solely on temporary context or single-vector retrieval, lacking clear layering.

To solve this, I decided to stop relying on a single storage mechanism and instead build an organically collaborative three-tier architecture. 
- The first layer is **Native Memory**, based on `MEMORY.md` and `memory/*.md`. It handles high-precision short-term decisions, personal preferences, and daily logs, acting like human working memory. 
- The second layer is **Knowledge Prism**, located at `D:/github/my/js-learn-openclaw/pyramid/`. It automates the refinement of Journals into Atoms and Groups, converging them into Synthesis. This represents deeply processed long-term memory. 
- The third layer is **Collector**, relying on the `js-knowledge-collector` database. It automatically scrapes and summarizes external articles from eight major platforms, forming a scaled external intelligence library. This decoupled design lays the foundation for the system to appreciate in value over time.

## Defining Roles: Instant Recording, Knowledge Refinement, and Automated Intelligence Gathering

The three-tier architecture isn't just a simple stack; each layer has exclusive responsibilities, operating independently yet complementing one another.

The core of the **Native Memory** layer lies in "immediacy" and "precision." It loads guide files like `AGENTS.md` and `SOUL.md` immediately at the start of a session. All content is manually filtered to retain only the most critical personalized information, ensuring that only what "I" and "Lobster" know is recorded accurately.

The **Prism** layer focuses on "deep processing." It executes a strict `Journal → Atoms → Groups → Synthesis → Perspectives → Outputs` workflow. This isn't simple storage; it's the "digestion" and "refinement" of knowledge, ultimately forming a distinct pyramid structure where any conclusion can be traced back to the original diary entry.

The **Collector** layer solves the "breadth" problem. Using dedicated scrapers, it automatically grabs articles from WeChat, Zhihu, GitHub, and six other platforms. The library currently holds 1,289+ external articles (908 from WeChat, 189 from GitHub, 130 from Zhihu). Every article is automatically summarized by AI to generate an overview, abstract, and recommendation reason, allowing for unified retrieval without manual sorting.

## Collaborative Practice: Full Material Coverage via Locate-Acquire-Fuse

In today's actual development, I validated the deep collaborative workflow of the three-tier system in specific scenarios: "Locate - Acquire - Fuse."

When handling technical questions like "I previously mentioned building the Prism memory bridge; what's the progress now?", the system first queries **Native Memory**, using `memory_search` to quickly locate relevant discussion records from `2026-03-10`. Next, it calls the **Prism layer** to retrieve structured Groups like G57 (Prism Memory Bridge) and KL24 (Day 39 Diary). Finally, it determines if external intelligence is needed; confirming this is an internal project, it ignores the Collector layer, outputting a comprehensive answer based on the three-tier information.

Conversely, when writing a new article on "OpenClaw Security Architecture," the collaborative logic shifts to fusion: extracting security configuration details and the "Five-Lock Architecture" from `MEMORY.md` in **Native Memory**; calling relevant Groups from KL02 and KL13 in the **Prism layer** as the logical skeleton; and simultaneously introducing external security articles from the **Collector layer** as comparative material. This model ensures the output possesses precise personal configuration details, a rigorous logical structure, and a broad external perspective.

## Core Value: Controllability, Traceability, and Time Compounding

After a day of architectural refinement, I am more convinced that this system's moat lies in its controllability, traceability, and the philosophy of "digesting rather than storing."

Compared to ChatGPT's black box or Claude's manual uploads, our three-tier system allows for human intervention at every level, achieving high **controllability**. Any conclusion generated by Prism can be reverse-traced through the pyramid structure to specific Journal entries, ensuring strong **traceability**.

More importantly, there is **time compounding**. Ordinary AIs start almost from zero with every conversation, whereas our system accumulates personal decision history in Native Memory, builds a complete knowledge system in Prism, and aggregates thousands of external intelligence pieces in Collector as time passes. Day 1 might have only a few notes, but by Day 300, the system stands on the accumulation of the past 300 days. This is not just a Second Brain; it's a knowledge digester and intelligence network with self-growth capabilities, forming exclusive digital assets that ordinary AIs cannot replicate.

## Technical Implementation: Hybrid Search, Incremental Sync, and Automated Loops

To ensure engineering efficiency and low maintenance costs for this architecture, I implemented key technical details today.

In the **Native Memory layer**, I configured the `hybrid` mode for `memorySearch` in `openclaw.json`. This adopts a mixed strategy of 70% vector search and 30% BM25 keyword search, introducing MMR (lambda=0.7) re-ranking combined with a time-decay algorithm (30-day half-life) to guarantee retrieval precision.

The optimization focus for the **Prism layer** was cost reduction and efficiency gains. By exporting only high-value Groups and the Context layer, combined with an incremental sync mechanism based on `mtime`, we successfully reduced file export volume by 80%. Additionally, two automated pipelines, `knowledge_prism_process` and `knowledge_prism_agent_index`, were deployed to run via Cron schedules, achieving true unattended operation.

The **Collector layer** adopts an inbox/batch rotation architecture paired with dedicated scrapers. It supports high-concurrency collection from eight major platforms: WeChat, Zhihu, Xiaohongshu, Jike, X.com, Reddit, Bilibili, YouTube, and GitHub. This ensures every article automatically generates a structured "Overview + Abstract + Recommendation Reason" before being stored in the database.

## Today's Takeaways

- **Architectural layering is key to solving the memory black box**: By decoupling short-term sessions (Native), structured knowledge (Prism), and external intelligence (Collector), we achieved a memory system that is controllable, traceable, and personalized.
- **The essence of memory is "digestion" rather than "storage"**: The automated refinement process in the Prism layer (Journal to Synthesis) transforms the system from a passive warehouse into actively growing soil, generating time compounding.
- **Hybrid search strategies improve retrieval precision**: Adopting a "70% vector + 30% keyword" hybrid search with MMR re-ranking in the Native Memory layer effectively balances semantic understanding with exact matching needs.
- **Incremental sync and automated pipelines reduce maintenance costs**: The `mtime`-based incremental sync in the Prism layer reduced file processing volume by 80%, and combined with Cron tasks, enabled unattended knowledge production.
- **Three-tier collaboration covers all scenario needs**: From "Locate-Acquire" for technical issues to "Fuse" for article writing, the three layers provide configuration details, logical skeletons, and external comparisons respectively, ensuring comprehensive and precise outputs.
