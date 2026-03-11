# Leave Creativity to the LLM, Hand Structure to Code: The Birth of the Template Creation Skill

> Day 41 · 2026-03-12

Yesterday, I was still struggling with how to help new users understand frontmatter and section structures. Today, I decided to stop writing dry documentation and instead build a dedicated skill that can "converse." Since creating templates involves multiple layers of cognitive load—ranging from output formats to writing styles—it's better to let the Agent guide the decision-making while we just pave the road.

## Why I Refused to Build Just a CLI Scaffolder

The initial idea was simple: write a command-line tool where users run `create-template --name demo`, and it spits out a bunch of empty files. But I immediately realized this wouldn't work. Prompt engineering is essentially a creative task; the most valuable aspect of an LLM is generating high-quality content, not just outputting a cold, empty skeleton. If users can't even figure out whether to set `split` to `per-kl` or `per-perspective`, giving them a perfect directory structure is pointless.

So, I scrapped the pure CLI approach and designed a three-layer architecture for the `prism-template-author` skill. The core philosophy is "division of labor": `SKILL.md` carries the decision logic, mapping vague user intents to specific configurations through four key questions (output format, writing style, generation complexity, and quality review); detailed schema definitions are offloaded to the `schema-reference.md` attachment for the Agent to consult on demand; and actual file generation is handed over to two purely deterministic Scaffold tools. This way, the creative part is entirely handled by the Agent following the guidance, while code strictly guards structural correctness.

## Let Scaffold Tools "Shut Up" and Only Execute Deterministically

When implementing the `prism_scaffold_template` and `prism_scaffold_component` tools, I set one iron rule for myself: absolutely no calling the LLM.

This might sound counter-intuitive for an AI project. However, I found that once the LLM gets involved in generating file structures, it starts to "hallucinate"—inventing non-existent types or messing up the field order in frontmatter. So, I turned these two tools into pure "executors": they are only responsible for checking if template names are duplicated, merging default values for types, and generating standard frontmatter and section placeholders.

For example, when executing `prism_scaffold_template({ name: "tutorial", split: "per-perspective", type: "blog" })`, the tool doesn't ponder what content "tutorial" should contain. It mechanically checks for name conflicts in the `outputs/_templates/` directory and then precisely outputs the file paths. This "clumsy" deterministic logic actually ensures baseline safety as the system evolves from being "recordable" to "teachable." Content filling? That's for the Agent to unleash its potential using the skill guidance; the scaffolder must never overstep its bounds.

## Today's Takeaways

- High-barrier creative tasks aren't suitable for pure CLI tools; instead, design dedicated skills to guide user decisions through "four-question mapping."
- Skill architecture must separate decision guidance, Schema references, and Scaffold tools into three distinct layers to keep the main flow clear.
- Core Scaffold tools must execute purely deterministic logic, strictly stripping away content generation responsibilities to guarantee structural safety.
- Implement a progressive disclosure strategy, keeping the main skill file under 130 lines and loading detailed Schemas on demand.
- Establish a "local-first" write path specification and a `--dry-run` validation mechanism to ensure predictable generation results.
