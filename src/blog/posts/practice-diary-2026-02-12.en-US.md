# Reject Heavy Frameworks: Build an Ecosystem Navigation Site in One Day with Vanilla JS and Neo-Brutalism

> Day 13 · 2026-02-12

Yesterday, I was still wrestling with how users could discover those scattered gem projects within the OpenClaw ecosystem. Today, I decided to stop overthinking and just build "JS ClawHub," a curated navigation site, turning the concept into reality. Since the official ClawHub handles "installation," we'll handle "discovery." The goal is clear: zero backend, purely static, and get the first version running within a single day.

## Ditch React, Embrace the "Brutal Aesthetics" of Native HTML

At the start of the project, the biggest temptation was to spin up a React or Vue app instantly; component-based development is just too appealing. But on second thought, this is just a content navigation site. Introducing a build toolchain and a virtual DOM would be overkill, unnecessarily bloating the load size. So, I made a bold decision: go back to native HTML + modular JS.

To ensure the page didn't look like a relic from a 90s GeoCities site, I chose the Neo-Brutalism style. This style is bold and high-contrast, perfectly matching the personality of a "curated" site. Paired with Tailwind CSS for rapid responsive layout setup, and throwing a rotating 3D background on the homepage using Three.js, the immersion factor instantly hit max.

What satisfied me most was the complete decoupling of data and presentation. Instead of hard-coding content into the HTML, I dumped everything into JSON files and wrote a lightweight rendering logic: when the page loads, it reads the JSON and dynamically generates cards. The benefit? If we need to add new modules later, we only change the data source, leaving the template almost untouched. This "minimalist architecture" allowed me to make the Initial Commit by 19:45 PM; the basic structure and homepage were standing firm within just a few hours.

## DIY I18n and CLI Automation: Hand Over Repetitive Tasks to Scripts

For a navigation site to have an international vibe, bilingual support is a must. Those massive i18n libraries on the market were just too heavy for my needs. I hand-wrote an `I18nManager` with simple, brutal core logic: tag all DOM elements needing translation with a `data-i18n` attribute. On startup, based on preferences in `localStorage`, it fetches copy from `locales/zh-CN.js` or `en-US.js` to replace them. For Markdown articles, it detects the `.en-US.md` suffix to load the corresponding version. This approach might be rough, but it's controllable and has zero runtime overhead.

When it came to deployment, I really didn't want to manually `git add`, `commit`, `push`, and check if the GA code was injected every time I tweaked some copy. So, I whipped up a `cli/cli.js`. The most satisfying moment was typing `node cli/cli.js sync`: the script automatically executed 7 steps including file copying, Google Analytics injection, i18n integrity checks, Pulse data cleanup, and API generation, finally auto-committing and pushing to GitHub Pages.

Watching the logs scroll in the terminal, from build completion to Cloudflare CDN propagation, the entire loop ran unattended. The thrill of "solidifying processes into commands" is even more addictive than writing the business logic itself.

## Today's Takeaways

- For content-based navigation sites, native HTML plus modular JS is often lighter and has lower maintenance costs than heavy frameworks.
- Strictly separating source code (`src`) from deployment artifacts (`docs`) in the architecture is the prerequisite for a clear and controllable build pipeline.
- A lightweight, self-built i18n solution (`data-i18n` + JSON) is sufficient for multi-language needs in small-to-medium projects, without needing massive dependencies.
- Encapsulating repetitive tasks like building, validation, and deployment into CLI commands is key to achieving "unattended" iterations.
- Clear differentiated positioning (human curation vs. automatic aggregation) determines a product's core value more than technology stacking does.
