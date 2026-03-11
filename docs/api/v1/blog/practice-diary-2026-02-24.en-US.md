# Refracting Scattered Notes into a Spectrum: The Birth of the Knowledge Prism

> Day 25 · 2026-02-24

After accumulating over twenty notes in the past few days—covering channel deployment, Agent configuration, security hardening, and more—I realized that while the content was rich, finding a core concept still required piecing together information across five different files. Today, I decided to stop just recording and start building a "prism" to automatically refract this scattered white light into a clear spectrum for readers.

## Equipping Notes with an "Append-Only" Filter

Before writing any code, the biggest dilemma was architecture. My old habit was to edit notes as I went, which only made things messier and erased the original exploration process. This time, I made a tough call and set an iron rule: **The Journal layer (raw material) must be "append-only"**.

I forcibly split the project into three layers: `journal/` for faithfully recording the timeline, `pyramid/` for structured decomposition, and `outputs/` for generating the final articles. To implement this, I wrote a three-stage incremental pipeline in `lib/process.mjs`:

1.  **Atoms Extraction**: The LLM reads new journals, extracts minimal knowledge units, and archives them by month.
2.  **Groups Aggregation**: Atoms are clustered across documents to forcibly synthesize a single viewpoint sentence.
3.  **Synthesis Convergence**: Top-level candidates are converged from all synthesized viewpoints.

During debugging, I nearly stumbled into a trap where repeated runs would generate duplicate data. I later added idempotency checks to the pipeline, ensuring that no matter how many times a journal is processed, the generated atoms remain unique. Watching scattered markdown files get automatically decomposed and grouped brought back that sense of "order."

## The Zero-Dependency Core vs. Dual Entry Points

During technology selection, I almost habitually ran `npm install` for a bunch of libraries. But then I thought: this is a knowledge management tool; if the installation barrier is too high, who would want to use it? So, I made a counter-intuitive decision: **The core library and the standalone CLI must remain zero external dependencies**.

Except for using `archiver` when packaging skill packs, the core logic relies entirely on Node.js native `fetch` and ES Modules. To accommodate different scenarios, I designed a "dual entry point" system:

-   **Standalone CLI**: `npx js-knowledge-prism init`, runs without installing OpenClaw, with configuration via `.env`.
-   **OpenClaw Plugin**: Deeply integrated into Agent conversations, with configuration via `openclaw.json`.

At 22:18 tonight, when I submitted the Initial Commit, looking at the clean `.mjs` files in `bin/cli.mjs` and the `lib/` directory, I felt quite grounded. No complex dependency trees, just pure logic flow—that's what a tool should look like.

## Today's Takeaways

-   The value of notes lies not in how much is recorded, but in whether they can be retrieved and reused at low cost.
-   An "append-only" raw material layer is the cornerstone for ensuring knowledge evolution is traceable.
-   LLM-driven incremental pipelines adapt better to unstructured thinking processes than rule-based matching.
-   A zero-dependency core strategy significantly lowers the barrier to dissemination and reduces ecosystem compatibility risks.
-   The dual entry point design allows the same core logic to serve both command-line geeks and Agent users simultaneously.
