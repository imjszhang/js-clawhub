# Teach Your Lobster, Use Your flomo: Evolving from Passive Recording to Active Thinking

> Day 77 · 2026-04-17

Today, I finally tackled the deepest pain point for flomo users: taking notes that never get read. When a keyword search returns 200 results, most people just close the window. I decided to let the system do the reading for us first, transforming this "pile-up" into genuine "cognitive elevation."

## System Positioning: From "Can't Reach Data" to "Thinking for You"

Previously, KL27 solved the problem of the "lobster" being unable to reach WeChat data by using `wechat-cli` to enable automatic data scraping. But today, facing flomo, I realized the new bottleneck isn't acquisition; it's digestion. The core dilemma of flomo is "too many notes, not enough reading": the human brain cannot simultaneously process hidden connections among hundreds of notes, leaving vast amounts of material dormant.

Therefore, the positioning of the `js-knowledge-flomo` project has undergone a fundamental shift: it is no longer just a maintenance tool, but an automated analysis engine that replaces manual reading. This marks the evolution of the "Lobster Raising Diary" series from KL30's "System Self-Growth" to KL31's "System Thinking for You." Our goal is clear: unless the system reads first and tells you what it found, taking notes without reading them is pointless.

## Five-Layer Modular Architecture and Multi-Terminal Synergy

To support this goal, I built a lightweight five-layer architecture based on Node.js 18+, local SQLite caching, and OpenAI-compatible APIs. The project plays the dual role of both MCP Client and MCP Server, ensuring extreme flexibility.

The core code structure is clearly layered: the `cli/` directory handles auth, search, and the core AI processing engine `processor.js`; `mcp-server/` provides standard AI analysis and note read/write tools; the `prompts/` directory independently manages prompt templates for insights, associations, outlines, etc., achieving decoupling of logic and strategy. Additionally, it includes the `openclaw-plugin` skill pack and static Web UI resources under `src/`. This design allows us to support four usage scenarios simultaneously: conversational operations via 15 dedicated tools in OpenClaw, running as a standalone CLI in the terminal, invoking as an MCP service in Cursor or Claude Desktop, and launching a local Web UI for visualized insight generation.

## Seven Major AI Analysis Functions: Mining Hidden Associations and Opinion Evolution

The core value of the system lies in its seven major AI analysis functions, which transform scattered timeline notes into structured knowledge.

First is **Insight Discovery**. The system defaults to pulling 50 notes cached in SQLite, using an LLM to analyze recurring themes, emotional trend changes, and hidden associations across tags, directly answering "What are you truly concerned about recently?" Next is **Association Discovery**, which forces the LLM to find at least 3 meaningful connections across time and space, speculating on the big questions the user is subconsciously pondering. For specific topics, the **Opinion Evolution** function marks key turning points along the timeline, clearly displaying the evidence chain of a stance shifting from A to B.

On the output side, the **Writing Outline** function refuses to generate content out of thin air; instead, it builds a structured outline based on real, scattered notes. **Material Collection** combines keyword search with flomo's official "Related Recommendations" interface to ensure comprehensive sourcing. Addressing increasingly chaotic tag systems, **Tag Suggestions** automatically categorize untagged notes, while **Tag Audit** deeply analyzes the tag tree for duplicates, naming inconsistencies, and hierarchy issues, providing specific merge or rename recommendations. Together, these functions achieve the leap from "searching" to "discovering."

## Security and Privacy Principles: Data Never Leaves the User Environment

While building an automated closed loop, I strictly enforced a defense-in-depth security strategy. The access layer insists on using the official flomo MCP protocol, avoiding security risks from reverse engineering through standard OAuth authorization. The data storage layer uses SQLite, leveraging its lightweight, zero-dependency, and SQL-query-supporting features to build a local cache, ensuring raw data remains entirely in the user's hands.

Most critically, during the AI analysis phase, all LLM calls point to user-self-hosted API interfaces, strictly guaranteeing that data never leaves the user's environment. Meanwhile, I stored all Prompt templates independently in the `prompts/` directory. This not only facilitates separate optimization of prompt engineering but also achieves complete decoupling of business logic and AI strategy, making the system both secure and iterable.

## Today's Takeaways

- **Pain Point Evolution Identification**: The bottleneck of knowledge management has shifted from "difficulty in data acquisition" (KL27) to "difficulty in information digestion" (KL31). System positioning must upgrade from "automatic maintenance" to "active thinking."
- **Dual-Role Architecture**: Adopting an MCP Client + Server dual-role architecture, paired with local SQLite caching, satisfies multi-terminal needs for CLI, IDE plugins, and Web UI simultaneously, maximizing reusability.
- **Deep Functional Design**: AI analysis cannot stop at summarization; it must delve into high-dimensional cognitive tasks like "opinion evolution," "cross-temporal associations," and "tag audits" to truly replace manual reading.
- **Security and Privacy Bottom Line**: Adhering to the triad of official OAuth protocols, local caching, and self-hosted LLM interfaces is a necessary prerequisite for building a trustworthy personal knowledge system.
- **Strategy-Code Decoupling**: Managing Prompt templates in an independent directory structure is a key engineering practice to ensure AI applications are maintainable long-term and can iterate quickly.
