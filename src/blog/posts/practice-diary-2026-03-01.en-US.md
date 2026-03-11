# A Victory of Zero Changes to the Core Layer: Implementing the Agent-First Five-Layer Architecture

> Day 30 · 2026-03-01

Yesterday, I was still struggling with how to turn scattered notes into reusable knowledge. Today, I performed major "surgery" on the entire project—evolving from a simple CLI tool into a complete Agent-First five-layer architecture. This isn't just code refactoring; it's a shift in mindset. Previously, I focused on making things easy for humans; now, I have to ensure AI Agents can first "understand" and automatically invoke them.

## Building a "Home" for AI Agents: Practical Upgrade to the Five-Layer Architecture

The catalyst was reviewing the code for the JS-Eyes project, where I suddenly realized that the design pattern treating AI as the primary consumer was worth systematizing. So, today I decided to forcibly elevate `js-knowledge-prism` from its original "CLI + Plugin" structure to a full five-layer architecture: the Agent Interface Layer, Business Core Layer, Human CLI Layer, Developer Toolchain Layer, and Extension Skill Layer.

The most exciting outcome of this implementation: **The Core Business Logic Layer (Layer 2) remained completely untouched.**

I used to worry that refactoring would cause a domino effect, but this verified the concept of "write core logic once." All build, test, distribution, and extension capabilities grew around the core layer like plugins. Layer 1 is just a thin wrapper mapping core functions into Tools that Agents can call; Layer 3 is reserved for human command-line interaction; while the newly added Layer 4 and Layer 5 have truly unleashed productivity.

Specifically regarding the Layer 4 developer toolchain, I created `cli/cli.cjs`, implementing five commands in one go: `build`, `bump`, `commit`, `sync`, and `release`. Previously, releasing a version required manually updating version numbers in three places (`package.json`, `plugin.json`, `SKILL.md`). Now, a single `bump` command synchronizes everything automatically. The build system is also smarter, outputting the main skill package, sub-skill packages, and the `skills.json` registry simultaneously, truly achieving "commit equals release."

## Pitfalls and Fixes: The CJS vs. ESM Module War

Of course, the process wasn't entirely smooth. While developing the Layer 4 toolchain, I encountered a classic Node.js module system "pitfall."

The `package.json` in the project root was set to `"type": "module"`, meaning all `.js` files are treated as ESM by default. When I enthusiastically wrote `require('archiver')` in the newly created development CLI, the console immediately threw an error: `require is not defined`.

Initially, I considered converting the entire project to CommonJS, but then I realized that the Core and Plugin layers heavily use `import/export` syntax, making the cost of change too high. The final solution was very "geeky": I uniformly changed the file extension of the development CLI files to `.cjs`.

```bash
# Final file structure
cli/
├── cli.cjs          ← Entry file, forced to use CJS
└── lib/
    ├── builder.cjs  ← Multi-target build logic
    └── git.cjs      ← Git operation encapsulation
```

This small decision made me deeply realize that in a hybrid architecture, file extensions are not just suffixes; they are firewalls isolating different module systems. Using `.cjs` explicitly tells Node.js "use the old rules here," avoiding conflicts with the rest of the project's ESM modules while allowing me to directly use `require()` to import legacy libraries that haven't fully adapted to ESM yet (like `archiver`).

## Letting Skills "Grow Themselves": Closing the Extension Ecosystem Loop

The final piece of the architectural upgrade puzzle is the Layer 5 Extension Skill Layer. Previously, adding new features required modifying the main code; now, you just need to drop a new folder into the `skills/` directory.

Today, I created the first sub-skill, `prism-output-blog`, which can automatically convert perspective notes into blog posts. The magic is that two new Tools in the main plugin, `knowledge_prism_discover_skills` and `knowledge_prism_install_skill`, allow the Agent to discover and install this skill on its own.

The build system scans the YAML frontmatter in `skills/*/SKILL.md` and automatically generates the `skills.json` registry. An Agent only needs to fetch this static JSON to know what new skills are available, and can even automatically download, decompress, and install dependencies. This "static registry + dynamic discovery" mechanism gives the skill ecosystem true self-growing capabilities.

## Today's Takeaways

- The core value of layered architecture lies in "writing core logic once," allowing Agents, CLIs, and tests to reuse the same business foundation.
- In hybrid module systems, leveraging the `.cjs` extension is a lightweight silver bullet for isolating conflicts between ESM and CommonJS.
- A static skill registry (`skills.json`) is better suited for automatic Agent discovery than dynamic APIs because it has no server dependencies and ensures build-time consistency.
- Automation of the developer toolchain (`build`/`bump`/`sync`) is key infrastructure for liberating developers from repetitive labor.
- The vitality of a knowledge system doesn't lie in a one-time perfect design, but in a pipeline where every new input triggers incremental distillation.
