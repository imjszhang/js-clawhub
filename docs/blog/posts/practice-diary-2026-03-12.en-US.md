# Turning Template Creation from "Configuration Hell" into a "Four-Question Guide"

> Day 41 · 2026-03-12

Yesterday, I finally fixed the timezone bugs in the Draft mechanism. Today, I planned to ride that momentum and generate a few more outputs, but I hit a wall while preparing a new template. Creating a new template required simultaneously handling frontmatter, section variables, component references, and review logic—the barrier to entry was absurdly high. Instead of making users guess configurations by reading documentation, I decided to let the LLM act as a "guide." So, today's main mission became: designing a template creation skill capable of automatic decision-making.

## Why CLI Can't Save Template Creation, But Skills Can

Initially, my instinct was to add a few CLI parameters, like `--type blog --style narrative`. But I quickly realized this was just shifting the pain. Users would still need to know what `split` corresponds to `blog`, or which `persona` component `narrative` requires. The LLM's true strength isn't generating empty skeletons; it's understanding vague intents like "I want to write an article similar to a technical weekly journal" and translating them into specific configurations.

Therefore, I decided to abandon the pure tool approach and develop the `prism-template-author` skill instead. The core logic changed: instead of users filling in parameters, the skill asks the user four questions: Output format (single post or series?), Writing style (narrative or tutorial?), Generation complexity (one-step or phased?), and Is review needed? The answers to these four questions map directly to internal `split`, `type`, and component configurations. Users only need to focus on business intent; all the technical details are encapsulated within the skill's decision tree.

## The Clear Boundary Between Deterministic Scaffolding and Agent Creativity

With the skill designed, I faced an architectural choice during implementation: Who generates the file structure? Who writes the Prompt content? If we leave everything to the LLM, it might miss a frontmatter field or misspell a section title, ruining the entire template. If we hardcode everything, we lose flexibility.

The final solution was "strict division of labor." I wrote two purely deterministic AI tools: `prism_scaffold_template` and `prism_scaffold_component`. These tools **never call the LLM**; they are solely responsible for checking if template names are duplicated, merging default values, and generating standard frontmatter and section placeholders. They act like the steelworkers on a construction site, ensuring the skeleton is perfectly straight and level. Meanwhile, content requiring "creativity," such as Persona settings and Style descriptions, is left entirely to the Agent to fill in based on the skill's guidance. This strategy of "deterministic skeleton construction + Agent responsible for content" ensures structural correctness while unleashing the LLM's value in creative generation.

To prevent the skill file itself from becoming bloated, I also implemented progressive disclosure: the main skill file `SKILL.md` is kept under 130 lines, containing only the decision flow; detailed Schema references and variable tables are moved to an attachment `schema-reference.md`, which the Agent only reads when it needs to look something up. Finally, after generating the template, I run `npx js-knowledge-prism output --dry-run` to perform a pre-validation, ensuring the logic is sound before committing to disk.

## Today's Takeaways

- The high barrier to template creation cannot be solved by piling on CLI parameters; it requires a dedicated skill to automatically map intent to configuration.
- The LLM's core value lies in generating high-quality creative content (such as Prompts), not in generating structural skeletons that are prone to errors.
- The core toolchain must strictly follow the division of labor: "pure deterministic logic builds the skeleton, Agent fills the content."
- Adopting a progressive disclosure strategy—lightweight main skill with detailed Schema as an on-demand attachment—significantly reduces cognitive load.
- Enforcing a pre-validation via the dry-run mechanism before formally committing the template to disk is a critical quality checkpoint to ensure structural correctness.
