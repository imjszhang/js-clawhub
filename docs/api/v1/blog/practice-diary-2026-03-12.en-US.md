# Leave Creativity to the LLM, Hand Structure to Code: The Birth of the Template Creation Skill

> Day 41 · 2026-03-12

Yesterday, I was still wrestling with how to help new users cross the mountain of frontmatter, section structures, and variable tables. Today, I decided to stop piling up documentation and instead build a "guide." The core idea behind the `prism-template-author` skill we're developing is simple: let the LLM handle the creative Prompt content, while solidifying the tedious structural decisions into a fixed process.

## Why I Didn't Just Build a CLI Tool

Initially, I considered building a command-line tool where users input a few parameters, and *bam*, a bunch of files are generated. But then I realized that the hardest part of creating templates isn't "generating files," it's "making decisions."

Users need to figure out: Who is this output for (a narrative retrospective or a structured tutorial)? Is it one KL per piece or one per perspective? Do we need phased generation? If we dump all this cognitive load on the user, the barrier to entry is too high; if we leave it entirely to the LLM's free rein, it's prone to going off the rails.

So, I decided to adopt a three-layer architecture: "Decision Guidance + Schema Reference + Scaffold Tools." The main file, `SKILL.md`, contains only four key questions (Output Format, Writing Style, Generation Complexity, and Quality Review). These four questions directly map user intent to specific `split`, `type`, and component configurations. As for the detailed frontmatter field tables, variable tables, and other hundreds of lines of dry data, they all go into the `schema-reference.md` attachment.

It's like training an apprentice: the master (`SKILL.md`) only asks about the key direction, while the specific move manuals (`Schema`) are kept handy for reference. We definitely don't slap the entire encyclopedia in the apprentice's face on day one. This progressive disclosure strategy keeps the main skill file strictly under 130 lines, making the interaction interface much cleaner.

## Let the Scaffold Tool Be an "Emotionless" Construction Worker

With the architecture set, it was time for the most critical execution phase. I defined two AI tools: `prism_scaffold_template` and `prism_scaffold_component`.

Here, I made a firm decision: these two tools must be purely deterministic and strictly forbidden from calling the LLM to generate any content. Their sole responsibility is to validate naming, merge default values, and generate frontmatter and section placeholders. For instance, when running `prism_scaffold_template({ name: "tutorial", split: "per-perspective", type: "blog" ... })`, it only ensures the framework is built tightly, without writing a single word of the actual body text.

When I first implemented this, I worried it might be too rigid. However, after running several `--dry-run` verifications, I realized this is exactly what we need. Structural correctness is guaranteed by code, ensuring zero errors; meanwhile, the creative work of filling content is left entirely to the Agent to explore based on the earlier decision guidance. This separation of duties between the "construction worker" and the "designer" actually makes the generated templates both standardized and soulful.

Additionally, file write paths are handled intelligently: they prioritize writing to the `outputs/_templates/` directory in the knowledge base. If that directory doesn't exist, it falls back to the built-in project directory. This local-first strategy allows generated templates to integrate directly into the user's workflow, rather than sitting lonely in system folders gathering dust.

## Today's Takeaways

- High-barrier tasks shouldn't just offer CLI tools; instead, design dedicated skills that guide users through structured decisions via "Four-Question Mapping."
- Skill architecture must separate decision guidance logic from detailed Schema references, utilizing progressive disclosure to avoid information overload.
- Scaffold tools must strictly adhere to purely deterministic logic, responsible only for structure validation and skeleton generation, never overstepping to generate content.
- Creative tasks (Prompt writing) should be left to the LLM, while configuration decisions should be guided by the skill through solidified processes.
- Establishing a "Local Knowledge Base First, Project Directory Fallback" file writing mechanism allows for more natural integration into the user's workflow.
