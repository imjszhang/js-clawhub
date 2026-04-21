# Teaching Lobster to Manage Data: A Three-Stage Leap from "Reading Notes" to "Controlling Topics"

> Day 80 · 2026-04-20

Following KL31, where we taught Lobster how to use flomo to "read notes," today's core mission is to expand its capabilities from passive reception to active management—teaching it to operate Feishu Base (multidimensional tables) to manage our "Viral Topic Library." This isn't just about adding another tool call; it's about enabling Lobster to understand data structures, master query and positioning logic, and ultimately form a closed-loop automated workflow.

## Cognitive Preparation: Understand the Structure Before Discussing Operations

Before letting Lobster update a single record, I enforced a "cognition first" strategy. In the past, we tended to simply throw an "update table" command at the AI, but today I realized that Lobster must first build a complete cognitive model of the Base's existence.

I explicitly provided two key identifiers: `app_token` (the unique ID card for the Base) and `table_id` (the ID of the specific data table). Without these two pieces of information, Lobster is facing a black box. Immediately after, instead of letting it write directly, I had it call the API to query the field list first. Only after Lobster "understood" that the table contains eight fields—"Article Number," "Title," "Topic Category," "Core Pain Point," "Reader Psychology," "Solution," "Status," and "Feishu Doc Link"—and grasped that "Topic Category" is a single-select field while "Status" includes enum values like To Write/In Progress/Completed/Published, did I allow it to proceed to the next step. This decision was crucial: teaching AI to manage data isn't about syntax training; it's about building a macro understanding of the internal structure of the Base, ensuring it masters mapping relationships (like between "Topic Category" and "Reader Psychology") before writing.

## Operational Logic: Filter Queries to Get IDs, Then Perform Atomic Updates Based on IDs

Entering the practical phase, we encountered the first hard constraint imposed by the API mechanism. When attempting to update the KL33 record, I initially expected Lobster to update directly via the "Article Number" field. However, reality struck: the Feishu Base API does not support locating and modifying records directly by field name.

This forced us to strictly execute an atomic workflow of "Filter Query to Get ID → Update Based on ID." Today's actual operation was broken down into two rigorous steps: First, Lobster had to use the `filter` parameter to query by article number "KL33" and precisely extract the `record_id` of that record from the returned results. Only after obtaining this ID could the second step—the update operation—be executed. Subsequently, Lobster sequentially modified the title (changed to "How to write OpenClaw's Skill?"), the status (flowed from "To Write" to "Published"), and the topic category (adjusted from "Pitfall Avoidance Guide" to "Blind Spot Correction"), and filled in the newly generated Feishu doc link. This process constructed an automated closed loop from status change to document creation, making me realize: querying is the prerequisite for updating; if you don't know where to write, you absolutely won't write correctly.

## Detail Specifications: Avoiding Type Traps and Data-Driven Evolution

Behind the seemingly smooth updates lurked several detail traps that could easily cause the process to crash, which turned out to be today's biggest "pitfall" lesson. First was the field type matching issue: when updating the single-select fields "Topic Category" and "Status," Lobster initially attempted to pass option IDs, causing API errors. After debugging, we established a standard: we must pass text values directly (e.g., "Blind Spot Correction") rather than internal system IDs. Secondly, regarding URL storage specifications, Feishu Base text fields can store URL strings directly without any special format encapsulation.

Once these technical details were solidified, the system's capabilities underwent a qualitative change. Lobster was no longer just an executor; it began to possess analytical abilities to "manage data." Based on the current data distribution in the topic library, Lobster could identify an imbalance where the "Blind Spot Correction" category had only 3 articles while "Question & New Knowledge" had reached 9, and propose optimization suggestions accordingly. This marks the upgrade of our system from a simple "note reader" to an agent capable of dynamically evolving topic strategies driven by data distribution.

## Today's Takeaways

- **Structure Cognition First**: When teaching AI to operate new tools (like Base), you must first inject the App Token/Table ID and have it read the field list to build a structure map before executing writes. Blind operations are strictly prohibited.
- **Query-Update Atomic Chain**: Due to API design limitations, we must strictly adhere to the iron rule of "First Filter query to get Record ID, then update based on ID." This is the cornerstone of achieving an automated closed loop.
- **Avoiding Type Traps**: When updating single-select fields, you must pass text values instead of Option IDs; URL fields should store strings directly. These details determine the stability of the automation process.
- **Capability Boundary Leap**: By empowering Lobster with "data management" capabilities (KL34), it has evolved from the passive "note reader" of KL31 into a decision-support agent capable of analyzing topic distribution, identifying imbalances, and proactively making suggestions.
