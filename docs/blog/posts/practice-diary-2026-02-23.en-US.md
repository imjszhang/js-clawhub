# Installing a "Distillation Machine" for Scattered Notes

> Day 24 · 2026-02-23

After 23 days of accumulating a massive pile of chronological logs, I finally decided to stop letting them gather dust on my hard drive. Today, I officially built a pipeline capable of transforming "timeline notes" into "structured knowledge."

## Why More Notes Make Them Harder to Use

Staring at dozens of `journal` documents sorted by date on my screen, I suddenly realized an awkward truth: these notes are great for answering "What did I learn that day?" but once I try to answer "What do I know about topic X?", I'm left relying on keyword luck or brute-forcing my memory.

As notes accumulate, fragments scatter across different dated documents, and retrieval efficiency plummets. I originally thought adding more tags would solve this, but today's review revealed the root cause isn't a lack of tags; it's that I was trying to force structure onto raw timeline material. It's like trying to build a wall directly out of loose sand—it's exhausting and prone to collapse at any moment.

Today's decision is clear: stop patching up raw notes. Instead, build a "distillation pipeline" that moves from raw material to finished product.

## Designing the Three-Layer Architecture of the "Knowledge Prism"

To solve the dilemma above, I designed a system called the "Knowledge Prism." The core idea is splitting the workflow into three layers, each with a single responsibility and no interference between them.

The first layer is `journal`. Its only job is "fidelity." Entries are archived by date, sealed immediately after writing, and never modified again. It serves as the raw evidence for all subsequent analysis, much like unfiltered RAW format photos.

The second layer, `pyramid`, is the real engine—and the part that excites me the most. I designed it as a bidirectional track:

- **Bottom-Up (Analysis)**: Break down knowledge points from the `journal` into atomic cards (Atoms), group them across documents to extract insights (Groups), and finally converge on top-level viewpoint candidates (Synthesis).
- **Top-Down (Structure)**: Based on the Pyramid Principle, start by designing an SCQA introduction, then expand into a complete logic tree (Tree), and finally perform MECE checks and logical validation.

The relationship between these two tracks is subtle: Analysis acts as a shared pool of materials for all perspectives, while Structure can be developed independently based on different viewpoints. This means the same set of analysis results can support both a technical tutorial and a casual blog essay.

The third layer, `outputs`, is the finished zone面向 readers. Readers only need to see this layer; they don't need to know about the deconstruction and recombination happening behind the scenes. This separation of concerns means I can modify article structures without worrying about accidentally damaging the original notes.

## Letting the System Grow Naturally Through "Incremental" Updates

Once the architecture was in place, the biggest challenge was getting it to run. If every update required starting from scratch, this system would have been abandoned long ago due to exhaustion.

So, I established an "incremental evolution" workflow: every time a new `journal` note is added, it triggers a full processing pipeline—extracting new atoms, reviewing whether existing groups need updates, checking if synthesis viewpoints require adjustment, and finally updating the article skeletons for various perspectives.

The core philosophy here is "continuous distillation." We don't aim for a one-step massive refactor; instead, we let the knowledge system grow naturally with every new input. Just like today, I only processed the new notes from the day, yet the entire system's structure became slightly clearer. This "use it or lose it" mechanism might just be the key to a personal knowledge base surviving long-term.

## Today's Takeaways

- Timeline notes are naturally suited for recalling "what I learned that day" but cannot efficiently support retrieval and reuse for "what I know about a specific topic."
- The core solution to note fragmentation isn't forcing structure onto raw materials, but building a layered pipeline from material to output.
- Implementing the Pyramid Principle requires bidirectional tracks: bottom-up extraction of insights from fragments, and top-down construction of logic trees from those insights.
- The Analysis layer should serve as a shared material pool, while the Structure layer remains independent per perspective, enabling multiple outputs from a single source.
- The vitality of a knowledge system lies in "incremental evolution." Every new input passes through the full pipeline, allowing the structure to grow naturally through usage.
