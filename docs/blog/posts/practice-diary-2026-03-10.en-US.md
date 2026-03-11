# Equipping the Knowledge Graph with a "Z-Axis": Prism Memory Bridging and 3D Visualization in Action

> Day 39 · 2026-03-10

After laying out the data cleaning pipeline yesterday, today was finally the moment of truth: connecting Prism to OpenClaw's memory core and upgrading that flat 2D graph into a rotatable, traceable 3D pyramid. I thought it would just be a matter of tweaking a few configs and swapping libraries, but I still stumbled over a few pitfalls regarding hardware requirements and rendering details.

## The "Hard Threshold" for Memory Bridging: No Embedding Provider, No Deal

The main event this morning was bridging the memory gap between Prism and OpenClaw. My vision was clear: Prism would filter out the high-density information from the `Groups` layer of the pyramid structure (ignoring the noisy `Journal` and `Outputs`), use the `mtime` incremental sync mechanism, and push the cleaned, high-value knowledge into OpenClaw's `extraPaths`.

However, while configuring `memorySearch.extraPaths`, I hit a "silent failure"—newly imported Markdown files simply wouldn't show up in search results. After debugging for ages, I discovered an easily overlooked hard constraint: **enabling vector search relies not only on `memorySearch.enabled = true` but also requires configuring at least one available Embedding Provider.**

Without a Provider (whether it's a remote one like OpenAI or a local one like Ollama), OpenClaw's `syncMemoryFiles` and `indexFile` functions return immediately without even building the Full-Text Search (FTS) index. This means that even if you configure `extraPaths`, new content will never make it into the retrieval database.

The solution turned out to be surprisingly smooth. Considering privacy and low costs, I ditched the remote API calls and opted for deploying a lightweight model locally. After comparing Ollama and `node-llama-cpp`, I chose the latter because it doesn't require a persistent background process. All I had to do was run `pnpm approve-builds` in `package.json` to select the module, then execute `pnpm rebuild`. It automatically downloaded the ~0.6GB `EmbeddingGemma-300M` model. Once the config took effect, the 73 high-value files exported by Prism were indexed in 0.6 seconds, with retrieval quality significantly better than feeding in raw notes directly.

## Upgrading the 3D Graph: From "Flat Map" to "Rotatable Pyramid"

I spent the entire afternoon upgrading the knowledge graph visualization. The previous 2D D3 solution looked cramped once nodes exceeded 30, and it couldn't intuitively display the six-layer pyramid structure of "Journal → Viewpoint → Output".

This time, I decided to introduce `3d-force-graph` (wrapped around Three.js). The biggest challenge was the layout algorithm: how to naturally present hierarchy in 3D space? I tried various force-directed configurations and eventually found that using `d3.forceY` to forcibly distribute nodes of different layers at different Y-axis heights was the most efficient approach. When users rotate the view with the left mouse button in the browser, a clear pyramid structure emerges: `Journal` at the base, `Outputs` at the peak, and the refined `Groups` in the middle.

To make the experience even more extreme, I implemented two key optimizations:

1.  **Offline Inlining**: To avoid CDN loading failures or network latency, I wrote a regex logic that automatically detects four core libraries like `three.min.js` in the `vendor/` directory and inlines them into the generated HTML. This allows the graph file to run completely offline.
2.  **Full-Link Traceability Highlighting**: This is the most "satisfying" feature of the day. Clicking any node triggers a BFS bidirectional traversal algorithm that instantly highlights all its upstream ancestors (up to `Journal`) and downstream descendants (down to `Output`), while dimming the rest. Paired with an animation where the camera automatically flies to the target, the sense of control when "following the clues" is unmatched by 2D charts.

During testing, rendering 33 nodes and 41 relationships was buttery smooth; the previous lag was completely gone.

## Today's Takeaways

-   **Prerequisite for Memory Bridging**: Simply toggling the `memorySearch` switch is ineffective. You must configure at least one Embedding Provider (local or remote) to trigger index creation for new content.
-   **Low-Cost Local Solution**: `node-llama-cpp` paired with a 300M parameter model is a cost-effective choice for implementing private vector search on low-spec hardware, requiring no persistent background processes.
-   **Value of Data Filtering**: By syncing only the `Groups` layer and ignoring noisy data, Prism reduces the data preparation cost for vector search by over 80% while improving the signal-to-noise ratio of retrieval.
-   **Core of 3D Layout**: Using `d3.forceY` to enforce vertical layering is the key to solving structural chaos in 3D space and intuitively displaying the pyramid hierarchy in knowledge graphs.
-   **Interaction Equals Insight**: Full-link traceability highlighting implemented via BFS bidirectional traversal allows users to instantly understand the upstream and downstream position of a single knowledge point within the entire knowledge system.
