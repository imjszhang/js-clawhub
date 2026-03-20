# Eliminating Manual Conversions: Built-in WeChat Cover Image Automation in the JS VI System

> Day 49 · 2026-03-20

Today's main mission was to tackle the "visual fragmentation" pain point in our official account operations. Previously, our generic poster dimensions lacked specific naming conventions for WeChat, forcing us to manually calculate pixel ratios like 900×383 or 500×500 every time we generated a cover image. This not only slowed us down but also risked damaging brand consistency due to human error. I decided to embed WeChat-specific templates and dimension enums directly into `js-vi-system`, creating a seamless automated loop from finalizing content in Prism to generating the cover image.

## Defining Dedicated Dimension Enums and Static Constraints

Addressing WeChat's unique pixel specifications, I first added two new keys to the global `SIZES` enum in `templates/_shared/sizes.js`: `wechat-cover` (900×383) and `wechat-thumb` (500×500). Before this, the team could only use generic sizes like `a4` or `square`, requiring operations staff to manually calculate aspect ratios. This was inefficient and often led to images being cropped in the WeChat feed due to rounding errors. Now, simply passing the CLI parameter `--size wechat-cover` locks in the standard specification immediately. Additionally, to align with WeChat's backend preference for static images, I explicitly defined a constraint at the metadata level to disable animations for this scenario. This ensures the output is ready to use straight away, eliminating the need for secondary processing.

## Building an Independent Template Directory and Structured Metadata

To support these dimensions, I created a dedicated `templates/wechat-cover/` directory containing `render.js`, `meta.json`, and `styles.css`. In `meta.json`, I pre-defined structured fields like `title`, `subtitle`, `tag`, and `issue`. This allows the Agent to directly populate the template with article titles and issue numbers without hardcoding strings. A key technical decision was setting `animation.supported` to `false`, forcing static rendering mode. This not only simplifies the `renderToHTML` logic but also ensures styles are correctly inlined. Furthermore, I fixed a subtle bug: `renderToHTML` now passes `meta._dir` as `templateDir` into `wrapHTML`. This guarantees that even when using external extended templates, their specific `styles.css` is accurately read and bundled into the final HTML, avoiding the awkward situation where "only built-in templates have styles."

## Dual-Mode Entry Points and Workflow Integration

To truly integrate this capability into our automation loop, I provided dual entry points: a CLI command and an OpenClaw plugin. In standalone CLI mode, running `node bin/js-vi.js poster -t wechat-cover --size wechat-cover --scheme dark -f png` instantly produces a dark-mode cover image. Within the OpenClaw ecosystem, the `vi_poster_generate` tool now supports specifying the `template: wechat-cover` parameter. The core value of this improvement lies in workflow integration: once knowledge is finalized on the Prism side, the Agent can immediately generate accompanying images using the same brand guidelines (Neo-Brutalism + Cyberpunk Token). This completely eliminates the disconnect of "articles in Prism, graphics in Photoshop," laying the foundation for future Cron jobs to handle automatic publishing.

## Clarifying Bitmap Export Dependencies and Responsibility Boundaries

At the delivery stage, I clarified the boundaries between Puppeteer-based bitmap export dependencies and the HTML proofing process. Generating PNG/JPEG/PDF heavily relies on having Chrome or Edge installed locally (called via `puppeteer-core`), which requires extra `browserPath` configuration in headless server environments. In contrast, the HTML format has no such dependencies, making it ideal for quick layout proofing before generating bitmaps. I also drew a clear line regarding system responsibilities: `js-vi-system` is solely responsible for ensuring pixel precision and layout compliance with brand guidelines. Requirements from the WeChat backend regarding image file size compression are left to operations staff to handle within the editor later. We no longer attempt to over-optimize compression algorithms at the rendering engine level, maintaining a clean separation of concerns.

## Today's Takeaways

- **Front-loaded Dimension Enums**: Solidifying pixel specifications for business scenarios (like WeChat covers) directly into `SIZES` enum keys in the code eliminates manual calculation errors at runtime.
- **Isolated Template Directories**: Creating independent template directories (including CSS/JS/Meta) for specific scenarios and dynamically injecting styles via `meta._dir` solves the issue of missing styles in external templates.
- **Static Rendering Constraints**: Disabling animation support directly at the metadata level for specific delivery channels (like the WeChat backend) simplifies the rendering pipeline from the source and improves output stability.
- **Clear Responsibility Boundaries**: Strictly distinguishing between "visual specification generation" and "operational compression processing." The system only guarantees correct pixels and layout, without overstepping to handle file size optimization.
