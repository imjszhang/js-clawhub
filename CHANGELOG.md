# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-03-07

### Added

- **Auto-generated sitemap** — `sitemap.xml` is now dynamically generated during build, covering all static pages, blog posts, and skill detail pages (35 URLs total vs. previous 4 hardcoded URLs)
- `lastmod` dates are derived from content data (`date` field in blog posts and skills)
- List page `lastmod` reflects the latest item in each section

### Changed

- Build pipeline expanded from 7 steps to 8 (new Step 8: sitemap generation)
- Updated Google Analytics tracking ID

### Removed

- Removed static `src/sitemap.xml` (now generated at build time into `docs/`)

## [1.0.0] - 2026-02-12

### Added

- **Homepage** — Neo-Brutalism design with 3D animated background, featured projects, and community pulse
- **Project Navigation** — Categorized directory of OpenClaw ecosystem integrations
- **Skills Market** — Browse community-created skills with detailed markdown documentation
- **Blog System** — In-depth tutorials, architecture analyses, and practice diaries with series support
- **Getting Started Guide** — Step-by-step documentation from installation to advanced configuration
- **Pulse** — AI-curated X/Twitter highlights from the OpenClaw community, updated daily
- **Bilingual (i18n)** — Full Chinese/English support with one-click language switching and localStorage persistence
- **CLI Tool** — Programmatic access to all data and operations (`build`, `commit`, `sync`, `search`, `pulse`, `blog`, `stats`, etc.)
- **Build Pipeline** — Automated src/ → docs/ with Google Analytics injection, i18n validation, pulse data sanitization, and API layer generation
- **API Layer** — Public JSON endpoints at `/api/v1/` for agent skill discovery
- **Craft** — Methodology guide and project scaffold for building agent-friendly sites
- **Deployment** — GitHub Pages from `docs/`, Cloudflare DNS setup scripts

[1.1.0]: https://github.com/imjszhang/js-clawhub/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/imjszhang/js-clawhub/releases/tag/v1.0.0
