<h1 align="center">JS ClawHub</h1>

<p align="center">
  <strong>Curated OpenClaw Ecosystem Navigation</strong>
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License: MIT" />
  </a>
  <a href="https://github.com/imjszhang/js-clawhub">
    <img src="https://img.shields.io/badge/Version-1.0.0-blue.svg?style=flat-square" alt="Version" />
  </a>
  <a href="https://imjszhang.github.io/js-clawhub/">
    <img src="https://img.shields.io/badge/Demo-GitHub%20Pages-FCD228?style=flat-square" alt="Demo" />
  </a>
</p>

<p align="center">
  <a href="#features">English</a> | <a href="./README.zh-CN.md">中文文档</a>
</p>

---

## What is This?

A curated navigation site for the [OpenClaw](https://openclaw.ai/) ecosystem, built and maintained by JS. Discover the best skills, integrations, tutorials, and community resources.

| | Other Directories | JS ClawHub |
|--|-------------------|------------|
| **Curation** | Auto-generated or uncurated | ✅ Handpicked by JS with editorial commentary |
| **Content** | Links only | ✅ Tutorials, guides, reviews, and community pulse |
| **i18n** | Single language | ✅ Chinese + English bilingual |
| **Cost** | Varies | ✅ Free, open-source, static site |

## Features

- **Project Navigation** — Browse featured projects and categorized integrations across the OpenClaw ecosystem
- **Skills Market** — Discover and explore community-created skills with detailed documentation
- **Blog** — In-depth tutorials, architecture analyses, and deployment guides
- **Getting Started Guide** — Step-by-step documentation from installation to advanced configuration
- **Pulse** — AI-curated X/Twitter highlights from the OpenClaw community, updated daily
- **Bilingual (i18n)** — Full Chinese/English support with one-click language switching

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Static Site** | Zero server cost, deployed on GitHub Pages |
| **Neo-Brutalism Design** | Bold, modern UI with JS brand identity |
| **Tailwind CSS** | Utility-first responsive styling |
| **Three.js** | Animated 3D background |
| **marked.js + highlight.js** | Client-side Markdown rendering with syntax highlighting |
| **Custom I18nManager** | Lightweight client-side internationalization |

## Architecture

```
js-clawhub/
├── src/                          # Source code
│   ├── index.html                # Homepage
│   ├── shared/
│   │   ├── js/
│   │   │   ├── i18n/             # i18n system
│   │   │   │   ├── index.js      # I18nManager core
│   │   │   │   └── locales/      # zh-CN.js, en-US.js
│   │   │   ├── nav.js            # Navigation with language toggle
│   │   │   ├── footer.js         # Footer component
│   │   │   └── search.js         # Search filter
│   │   └── css/brutal.css        # Design system
│   ├── blog/                     # Blog system
│   ├── skills/                   # Skills market
│   ├── guide/                    # Getting started guide
│   └── pulse/                    # Community pulse
├── build/build.js                # Build script (src/ → docs/)
├── docs/                         # Build output (GitHub Pages)
└── scripts/                      # Utility scripts
```

## Quick Start

```bash
# Clone
git clone https://github.com/imjszhang/js-clawhub.git
cd js-clawhub

# Development (serves src/ directly)
npm run dev

# Build (copies src/ → docs/ with validation)
npm run build

# Preview build output
npm run preview
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (serves `src/`) |
| `npm run build` | Build to `docs/` with i18n validation |
| `npm run preview` | Preview build output on port 3000 |
| `npm run sync-pulse` | Sync latest OpenClaw X highlights |
| `npm run setup` | Configure Cloudflare + GitHub Pages |

## i18n (Internationalization)

JS ClawHub supports Chinese (default) and English. The i18n system includes:

- **UI translations** — All static text via `data-i18n` attributes and locale files
- **Bilingual JSON data** — Content fields use `{"zh-CN": "...", "en-US": "..."}` objects
- **Dual Markdown files** — `article.md` (Chinese) + `article.en-US.md` (English)
- **Language toggle** — One-click switch in the navigation bar
- **Locale persistence** — User preference saved in localStorage

## Deployment

The site is deployed on GitHub Pages from the `docs/` directory.

```bash
# Build and deploy
npm run build
git add docs/
git commit -m "build: update site"
git push
```

GitHub Pages will automatically serve the updated content.

## Contributing

PRs welcome! Fork → Change → Submit.

To add a new project to the directory, create an issue or submit a PR with the project details.

## License

MIT

## Acknowledgments

- [OpenClaw](https://openclaw.ai/) — The open-source personal AI assistant
- [DeepSeek Cowork](https://github.com/imjszhang/deepseek-cowork) — Architecture reference for i18n and deployment
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS framework
- [Three.js](https://threejs.org/) — 3D graphics library

---

<div align="center">

**Curated by JS — Making OpenClaw ecosystem discoverable**

[![X](https://img.shields.io/badge/X-@imjszhang-000000?logo=x)](https://x.com/imjszhang)

</div>
