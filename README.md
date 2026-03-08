<h1 align="center">JS ClawHub</h1>

<p align="center">
  <strong>Curated OpenClaw Ecosystem Navigation</strong>
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License: MIT" />
  </a>
  <a href="https://github.com/imjszhang/js-clawhub">
    <img src="https://img.shields.io/badge/Version-1.2.0-blue.svg?style=flat-square" alt="Version" />
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

- **OpenClaw Plugin** — Runs as an OpenClaw plugin, providing Agent Tools, CLI subcommands, HTTP routes, and Skills
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
├── openclaw-plugin/              # OpenClaw plugin
│   ├── index.mjs                 # Plugin entry (register function)
│   ├── openclaw.plugin.json      # Plugin manifest (configSchema + uiHints)
│   ├── package.json              # ESM entry + openclaw.extensions
│   └── skills/
│       └── clawhub-navigator/    # Navigator skill
│           └── SKILL.md
├── cli/                          # CLI tool (standalone)
│   ├── cli.js                    # Entry point (clawhub <command>)
│   └── lib/                      # Modules
│       ├── builder.js            # Build logic
│       ├── git.js                # Git operations
│       ├── data-reader.js        # Data queries
│       ├── data-writer.js        # Data mutations
│       ├── search.js             # Cross-source search
│       ├── formatters.js         # Output formatting
│       └── setup.js              # Cloudflare / GitHub Pages setup
├── build/build.js                # Build script (wraps cli/lib/builder.js)
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
| `npm run build` | Build to `docs/` with i18n validation + sitemap generation |
| `npm run preview` | Preview build output on port 3000 |
| `npm run setup` | Configure Cloudflare + GitHub Pages |
| `npm run cli -- <cmd>` | Run CLI commands (see below) |

## CLI

The CLI provides programmatic access to all ClawHub data and operations. All output is JSON to stdout, logs to stderr.

```bash
node cli/cli.js <command> [options]
```

### Build & Deploy

| Command | Description |
|---------|-------------|
| `clawhub build` | Build site: src/ → docs/, inject GA, validate i18n, generate sitemap |
| `clawhub build --dry-run` | Validate only, don't write files |
| `clawhub build --skip-ga` | Skip Google Analytics injection |
| `clawhub commit` | Stage all changes and commit with auto-generated message |
| `clawhub commit --message "msg"` | Commit with a custom message |
| `clawhub commit --scope pulse` | Only stage src/pulse/ and docs/pulse/ |
| `clawhub sync` | Build + commit + push in one step |
| `clawhub sync --no-push` | Build + commit without pushing |
| `clawhub sync --dry-run` | Preview the full pipeline without changes |

### Data Access

| Command | Description |
|---------|-------------|
| `clawhub search <keyword>` | Search across all data sources |
| `clawhub pulse --days 7` | List recent Pulse items |
| `clawhub pulse-edit <id> --score 0.9` | Edit a Pulse item |
| `clawhub projects --category messaging` | List projects by category |
| `clawhub skills` | List all skills |
| `clawhub blog --latest 5` | List recent blog posts |
| `clawhub stats` | Show aggregate statistics |

Run `clawhub help` for the full command reference.

## OpenClaw Plugin

JS ClawHub can run as an OpenClaw plugin while retaining its standalone CLI capability.

### Two Modes of Operation

| | Standalone | As OpenClaw Plugin |
|--|-----------|-------------------|
| **Entry** | `node cli/cli.js <cmd>` | `openclaw hub <cmd>` |
| **Data Access** | CLI JSON output | Agent Tools + CLI + HTTP API |
| **Site Serving** | `npx serve src` | `/plugins/js-clawhub/` routes |
| **Configuration** | `.env` file | OpenClaw plugin settings UI |
| **Deployment** | Manual scripts | `openclaw hub setup-cloudflare` / `setup-github-pages` |

### Agent Tools

The plugin registers 8 tools for Agent use:

| Tool | Purpose |
|------|---------|
| `clawhub_search` | Cross-source keyword search |
| `clawhub_projects` | Project listing (category/tag filtering) |
| `clawhub_skills` | Skills listing |
| `clawhub_blog` | Blog listing or full post content |
| `clawhub_guide` | Guide listing or full article content |
| `clawhub_pulse` | Pulse items (days/score/author filtering) |
| `clawhub_stats` | Site statistics |
| `clawhub_featured` | Homepage featured content |

### Plugin Configuration

The following options can be configured through OpenClaw's settings UI (no manual `.env` editing required):

| Option | Purpose |
|--------|---------|
| `locale` | Default language |
| `moltbookPath` | Moltbook data source path |
| `llmApiBaseUrl` / `llmApiKey` / `llmApiModel` | AI translation |
| `cloudflareApiToken` / `cloudflareEmail` | Cloudflare DNS management |
| `githubToken` | GitHub Pages configuration |
| `gaId` | Google Analytics |

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
# One-step build + commit + push
node cli/cli.js sync

# Or manually
node cli/cli.js build
node cli/cli.js commit --message "build: update site"
git push
```

GitHub Pages will automatically serve the updated content.

## Contributing

PRs welcome! Fork → Change → Submit.

To add a new project to the directory, create an issue or submit a PR with the project details.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history and version details.

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
