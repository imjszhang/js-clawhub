---
name: js-clawhub
description: OpenClaw ecosystem navigation & content hub — project directory, skill market, blog, guide, community pulse, and Craft methodology.
version: 1.2.0
metadata:
  openclaw:
    emoji: "\U0001F43E"
    homepage: https://github.com/imjszhang/js-clawhub
    os:
      - windows
      - macos
      - linux
    requires:
      bins:
        - node
---

# JS ClawHub

OpenClaw ecosystem navigation & content hub — curated projects, skills, blog, guides, community pulse, and a static site deployed to GitHub Pages.

## First Step: Detect Runtime Mode

Before performing any operation, detect whether this project is running as an **OpenClaw plugin** or in **standalone CLI mode**. The result determines configuration paths, command prefixes, and available features.

### Detection Steps

#### Step 0 — OS & Environment Variable Probe

First detect the current operating system to choose the correct shell commands, then check OpenClaw-related environment variables:

**OS Detection:**

| Check | Windows | macOS / Linux |
|-------|---------|---------------|
| OS identification | `echo %OS%` or `$env:OS` (PowerShell) | `uname -s` |
| Home directory | `%USERPROFILE%` | `$HOME` |
| Default OpenClaw state dir | `%USERPROFILE%\.openclaw\` | `~/.openclaw/` |
| Default config path | `%USERPROFILE%\.openclaw\openclaw.json` | `~/.openclaw/openclaw.json` |

**Environment Variable Check:**

```bash
# Windows (PowerShell)
Get-ChildItem Env: | Where-Object { $_.Name -match '^OPENCLAW_' }

# Windows (CMD / Git Bash)
set | grep -iE "^OPENCLAW_"

# macOS / Linux
env | grep -iE "^OPENCLAW_"
```

| Variable | Meaning if set |
|----------|---------------|
| `OPENCLAW_CONFIG_PATH` | Direct path to config file — **highest priority**, use as-is |
| `OPENCLAW_STATE_DIR` | OpenClaw state directory — config file at `$OPENCLAW_STATE_DIR/openclaw.json` |
| `OPENCLAW_HOME` | Custom home directory — state dir resolves to `$OPENCLAW_HOME/.openclaw/` |

**OpenClaw config file resolution order** (first match wins):

1. `OPENCLAW_CONFIG_PATH` is set → use that file directly
2. `OPENCLAW_STATE_DIR` is set → `$OPENCLAW_STATE_DIR/openclaw.json`
3. `OPENCLAW_HOME` is set → `$OPENCLAW_HOME/.openclaw/openclaw.json`
4. None set → default `~/.openclaw/openclaw.json` (Windows: `%USERPROFILE%\.openclaw\openclaw.json`)

Use the resolved config path in all subsequent steps.

#### Step 1 — OpenClaw Binary Detection

1. Check if `openclaw` command exists on PATH (Windows: `where openclaw`, macOS/Linux: `which openclaw`)
2. If exists, read the OpenClaw config file (path resolved by Step 0) and look for `js-clawhub` in `plugins.entries` with `enabled: true`
3. Verify that `plugins.load.paths` contains a path pointing to this project's `openclaw-plugin/` directory

If **all three checks pass** → use **OpenClaw Plugin Mode**. Otherwise → use **Standalone CLI Mode**.

### Mode Comparison

| Aspect | OpenClaw Plugin Mode | Standalone CLI Mode |
|--------|---------------------|-------------------|
| Configuration | `~/.openclaw/openclaw.json` → `plugins.entries.js-clawhub.config` | `.env` file in project root |
| Command prefix | `openclaw hub <cmd>` | `node cli/cli.js <cmd>` |
| AI tools | `clawhub_*` (10 tools via OpenClaw Agent) | Not available (use CLI) |
| Cron auto-sync | `openclaw hub setup-cron --type blog\|pulse` | Not available |
| Web UI | `http://<host>/plugins/js-clawhub/` | `npx serve src` (dev) / `npx serve docs` (preview) |
| Blog auto-sync | `clawhub_blog_auto_sync` tool / cron | Manual `blog-import` + `blog-translate` + `sync` |
| Pulse auto-sync | `clawhub_pulse_auto_sync` tool / cron | Manual `pull --type pulse` + `sync` |

### OpenClaw Plugin Mode

When the plugin is deployed:

- **CLI**: always use `openclaw hub ...` instead of `node cli/cli.js ...`
- **AI tools**: prefer `clawhub_*` tools when invoked from an OpenClaw Agent session
- **Config**: modify `~/.openclaw/openclaw.json` → `plugins.entries["js-clawhub"].config` for LLM API, moltbook path, tokens, etc.; do NOT edit `.env` for plugin-managed settings
- **Cron**: manage via `openclaw hub setup-cron --type blog` / `openclaw hub setup-cron --type pulse`
- **Web UI**: access at `http://<openclaw-host>/plugins/js-clawhub/`

### Standalone CLI Mode

When running without OpenClaw:

- **CLI**: use `node cli/cli.js <cmd>`
- **Config**: `.env` for API credentials and tokens (see environment variable table below)
- **No cron / auto-sync** features — run `blog-import`, `blog-translate`, `build`, `sync` manually
- **No AI tools** — all interaction through CLI commands
- **Dev server**: `npx serve src` for local development, `npx serve docs -l 3000` for preview

---

## Deployment Probe

After detecting the runtime mode, run the following diagnostic steps to build a complete picture of the local deployment. Execute these in order; skip remaining steps if an earlier step indicates OpenClaw is unavailable.

> **Prerequisite**: Step 0 (OS & Environment Variable Probe) from the Detection Steps above must have already been executed. Use the detected OS to choose correct commands, and use the resolved config path from Step 0.

### Step 1 — OpenClaw Availability

- Windows: `where openclaw` / macOS & Linux: `which openclaw`
- If found: `openclaw --version` to confirm the installed version

### Step 2 — Plugin Load Status

Read the OpenClaw config file (path resolved by Step 0) and check:

- `plugins.load.paths` — does it include a path pointing to this project's `openclaw-plugin/` directory?
- `plugins.entries["js-clawhub"].enabled` — is the plugin enabled?
- `plugins.entries["js-clawhub"].config` — extract `locale`, `moltbookPath`, `llmApiBaseUrl`, `llmApiModel` for a quick config snapshot

### Step 3 — Cron Job Status

```bash
openclaw cron list --json
```

Look for two jobs by name:

| Job Name | Purpose |
|----------|---------|
| `clawhub-blog-sync` | Periodically imports blog posts, translates, builds, and pushes |
| `clawhub-pulse-sync` | Periodically pulls Pulse data from js-moltbook, builds, and pushes |

If either job is missing, the corresponding auto-sync is not configured. See the Runbook section for setup instructions.

### Step 4 — Data Source Health Check

Inspect the data directories to verify content availability:

| Path | Healthy State | Unhealthy Signal |
|------|---------------|-----------------|
| `src/data/navigation.json` | Exists, contains categories and projects | Missing → project navigation broken |
| `src/pulse/data/items.json` | Exists, contains pulse items | Missing → no pulse data |
| `src/skills/data/index.json` | Exists, contains skill entries | Missing → skill market empty |
| `src/blog/posts/index.json` | Exists, contains blog index | Missing → blog listing broken |
| `src/blog/sources.json` | Exists, lists import sources | Missing → blog import unavailable |
| `src/guide/data/index.json` | Exists, contains guide entries | Missing → guide section empty |
| `src/data/featured.json` | Exists, contains featured selections | Missing → homepage featured section empty |
| `docs/` | Exists, mirrors `src/` after build | Missing → site not built yet |

---

## Config Files Map

| File | Typical Path | Purpose | How to Modify |
|------|-------------|---------|--------------|
| `openclaw.json` | `~/.openclaw/openclaw.json` | Main config: locale, LLM API, moltbook path, tokens, cron | Edit JSON directly |
| `.env` | `{project_root}/` | Standalone mode: API keys and tokens | Edit directly (not used in plugin mode) |
| `navigation.json` | `src/data/` | Project directory, categories, recommendations (bilingual) | Edit JSON directly |
| `featured.json` | `src/data/` | Homepage featured content (projects, guide, blog) | Via CLI `featured set` or edit JSON |
| `items.json` | `src/pulse/data/` | Pulse items (X/Twitter curated highlights) | Auto-synced from js-moltbook; edits via `pulse-edit` |
| `edited_items.json` | `src/pulse/data/` | Pulse edit/delete registry (excluded item IDs) | Via CLI `pulse-edit` / `pulse-delete` |
| `sources.json` | `src/blog/` | Blog import source definitions | Edit JSON directly |
| `import-manifest.json` | `src/blog/` | Blog import tracking (deduplication) | Auto-managed; safe to delete entries to re-import |

---

## Action Priority

When performing an operation, always prefer the highest-priority method available:

> **OpenClaw AI Tool → OpenClaw CLI (`openclaw hub ...`) → Standalone CLI (`node cli/cli.js ...`) / file edit**

| Scenario | Preferred | Fallback | Last Resort |
|----------|-----------|----------|-------------|
| Search across all sources | `clawhub_search` | `openclaw hub search` | `node cli/cli.js search` |
| List projects | `clawhub_projects` | `openclaw hub projects` | `node cli/cli.js projects` |
| List skills | `clawhub_skills` | `openclaw hub skills` | `node cli/cli.js skills` |
| Read blog post | `clawhub_blog` (with slug) | `openclaw hub blog` | `node cli/cli.js blog` |
| Read guide article | `clawhub_guide` (with slug) | `openclaw hub guide` | `node cli/cli.js guide` |
| View pulse | `clawhub_pulse` | `openclaw hub pulse` | `node cli/cli.js pulse` |
| View stats | `clawhub_stats` | `openclaw hub stats` | `node cli/cli.js stats` |
| View featured | `clawhub_featured` | `openclaw hub featured` | `node cli/cli.js featured` |
| Blog auto-sync | `clawhub_blog_auto_sync` | no CLI equivalent | `blog-import` + `blog-translate` + `sync` |
| Pulse auto-sync | `clawhub_pulse_auto_sync` | no CLI equivalent | `pull --type pulse` + `sync` |
| Build site | — | `openclaw hub build` | `node cli/cli.js build` |
| Commit + push | — | `openclaw hub sync` | `node cli/cli.js sync` |
| Pull from moltbook | — | `openclaw hub pull` | `node cli/cli.js pull` |
| Configure cron | `openclaw hub setup-cron` | — | N/A |
| Change API / model | edit `~/.openclaw/openclaw.json` plugin config | edit `.env` | N/A |

---

## Runbook

### "Sync blog for me"

1. Plugin mode: call `clawhub_blog_auto_sync` — it handles everything (import → translate → build → commit → push)
2. Standalone mode:
   - `node cli/cli.js blog-import <sourceId> --all --translate`
   - `node cli/cli.js sync`

### "Sync Pulse for me"

1. Plugin mode: call `clawhub_pulse_auto_sync` — it handles everything (pull → build → commit → push)
2. Standalone mode:
   - `node cli/cli.js pull --type pulse`

### "Cron doesn't seem to be running"

1. `openclaw cron list --json` — check if jobs exist
2. Missing blog cron → `openclaw hub setup-cron --type blog`
3. Missing pulse cron → `openclaw hub setup-cron --type pulse`
4. Present but stale → check if moltbook path or blog sources are accessible

### "Switch LLM model / API endpoint"

1. Plugin mode: edit `~/.openclaw/openclaw.json` → `plugins.entries["js-clawhub"].config` (change `llmApiBaseUrl`, `llmApiModel`, or `llmApiKey`)
2. Standalone mode: edit `.env` — set `CLAWHUB_API_BASE_URL`, `CLAWHUB_API_MODEL`, `CLAWHUB_API_KEY`
3. No restart needed — next run picks up the new config automatically

### "Build and deploy the site"

1. `openclaw hub build` (or `node cli/cli.js build`)
2. `openclaw hub sync` (or `node cli/cli.js sync`) — stages, commits, and pushes to GitHub Pages

### "Edit or remove a Pulse item"

1. Edit: `node cli/cli.js pulse-edit <id> --score 0.9 --js-take-zh "新点评"`
2. Delete: `node cli/cli.js pulse-delete <id> --reason "spam"`
3. Restore: `node cli/cli.js pulse-restore <id>`
4. View excluded: `node cli/cli.js pulse-excluded`

### "Manage homepage featured content"

1. View: `node cli/cli.js featured` (or `clawhub_featured`)
2. Set: `node cli/cli.js featured set projects "OpenClaw,ClawHub Skills"`
3. Clear: `node cli/cli.js featured clear blog`

---

## What it does

JS ClawHub is a curated navigation and content hub for the OpenClaw ecosystem:

1. **Project Directory** — categorized listing of OpenClaw ecosystem projects (messaging, AI models, productivity, etc.)
2. **Skill Market** — community skills and plugins
3. **Blog** — articles with external source import and AI-powered bilingual translation
4. **Guide** — step-by-step tutorials for OpenClaw (installation, configuration, advanced usage)
5. **Pulse** — curated X/Twitter highlights about OpenClaw, sourced from js-moltbook with AI scoring + human curation
6. **Featured** — homepage curated content across projects, guides, and blog

The site is built as a static site and deployed to GitHub Pages. The OpenClaw plugin adds Agent tools, CLI subcommands, HTTP routes, and cron-driven auto-sync.

## Architecture

```
Data Sources (JSON + Markdown)
├── navigation.json    → Projects & Categories
├── skills/index.json  → Skill Market
├── blog/posts/        → Blog (Markdown + index.json)
├── guide/data/        → Guides (Markdown + index.json)
├── pulse/items.json   → Pulse (X curated)
└── featured.json      → Homepage Featured

        ↓ build (src/ → docs/)

Static Site (GitHub Pages)
├── Neo-Brutalism UI + Tailwind CSS
├── Three.js 3D background
├── Client-side i18n (zh-CN / en-US)
└── marked.js + highlight.js for Markdown rendering

        ↓ OpenClaw plugin

Agent Tools (10) + CLI + HTTP Routes + Cron
```

## Provided AI Tools

| Tool | Description |
|------|-------------|
| `clawhub_search` | Cross-source full-text search across pulse, project, skill, blog, guide |
| `clawhub_projects` | List OpenClaw ecosystem projects with category/tag filtering |
| `clawhub_skills` | List skill market entries with category filtering |
| `clawhub_blog` | List blog posts or retrieve full Markdown content by slug |
| `clawhub_guide` | List guides or retrieve full Markdown content by slug |
| `clawhub_pulse` | List community Pulse items with days/minScore/author/limit filtering |
| `clawhub_stats` | Get aggregate site statistics (counts, latest dates) |
| `clawhub_featured` | Get homepage featured/curated content |
| `clawhub_blog_auto_sync` | Blog auto-sync: import → translate → build → commit → push (cron target) |
| `clawhub_pulse_auto_sync` | Pulse auto-sync: pull from moltbook → build → commit → push (cron target) |

## CLI Commands

```
openclaw hub search <keyword>                Cross-source search
openclaw hub stats                           View site statistics
openclaw hub projects [--category] [--tag]   List projects
openclaw hub skills [--category]             List skills
openclaw hub blog [--tag] [--latest N]       List blog posts
openclaw hub pulse [--days N] [--min-score]  List Pulse items
openclaw hub build [--skip-ga] [--dry-run]   Build site: src/ → docs/
openclaw hub pull [--source] [--type]        Pull data from js-moltbook
openclaw hub sync [--no-build] [--no-push]   Build + commit + push
openclaw hub setup-cloudflare                Configure Cloudflare DNS
openclaw hub setup-github-pages              Configure GitHub Pages
openclaw hub setup-cron --type blog|pulse    Configure auto-sync cron job
```

### Standalone CLI (without OpenClaw)

```
node cli/cli.js search <keyword> [--type pulse|project|skill|blog|guide]
node cli/cli.js pulse [--days N] [--min-score N] [--author @xxx] [--limit N]
node cli/cli.js pulse-edit <id> [--score N] [--js-take-en "..."] [--js-take-zh "..."]
node cli/cli.js pulse-delete <id> [--reason "..."]
node cli/cli.js pulse-restore <id>
node cli/cli.js pulse-excluded
node cli/cli.js featured [list|set|clear] [section] [ids]
node cli/cli.js build [--skip-ga] [--skip-i18n] [--dry-run] [--no-clean]
node cli/cli.js commit [--message "..."] [--all] [--scope <area>]
node cli/cli.js sync [--no-build] [--no-push] [--message "..."] [--dry-run]
node cli/cli.js pull [--source <path>] [--type pulse|weekly|all] [--dry-run]
node cli/cli.js blog-import <sourceId> [--file <name>] [--all] [--translate]
node cli/cli.js blog-sources
node cli/cli.js blog-translate <slug> [--all] [--force] [--dry-run]
node cli/cli.js stats
node cli/cli.js projects [--category] [--tag]
node cli/cli.js skills [--category]
node cli/cli.js blog [--tag] [--latest N]
node cli/cli.js setup-cloudflare
node cli/cli.js setup-github-pages
```

## Web UI

The plugin registers HTTP routes on the OpenClaw gateway:

| Route | Description |
|-------|-------------|
| `/plugins/js-clawhub/` | Static site served from `src/` (full navigation hub) |
| `/plugins/js-clawhub/api/v1/projects.json` | Projects JSON API |
| `/plugins/js-clawhub/api/v1/stats.json` | Statistics JSON API |
| `/plugins/js-clawhub/api/v1/featured.json` | Featured content JSON API |
| `/plugins/js-clawhub/api/v1/skills.json` | Skills JSON API |
| `/plugins/js-clawhub/api/v1/blog/index.json` | Blog index JSON API |
| `/plugins/js-clawhub/api/v1/guide/index.json` | Guide index JSON API |
| `/plugins/js-clawhub/api/v1/pulse/latest.json` | Pulse latest JSON API (supports `?limit=N`) |

Access the hub at `http://<openclaw-host>/plugins/js-clawhub/` after the plugin is loaded.

## Skill Bundle Structure

```
js-clawhub/
├── SKILL.md                               ← Skill entry point (this file)
├── package.json                           ← Root package (ESM)
├── LICENSE
├── .env                                   ← Standalone mode credentials (gitignored)
├── openclaw-plugin/
│   ├── openclaw.plugin.json               ← Plugin manifest (config schema, UI hints)
│   ├── index.mjs                          ← Plugin logic — 10 AI tools + CLI + HTTP routes
│   └── skills/
│       └── clawhub-navigator/
│           └── SKILL.md                   ← Navigation assistant skill definition
├── cli/
│   ├── cli.js                             ← Standalone CLI entry point
│   └── lib/
│       ├── builder.js                     ← Build: src/ → docs/, GA injection, i18n validation
│       ├── data-reader.js                 ← Unified data reader (pulse/projects/skills/blog/guide)
│       ├── data-writer.js                 ← Pulse item editing (edit/delete/restore)
│       ├── search.js                      ← Cross-source full-text search
│       ├── featured.js                    ← Featured content management
│       ├── puller.js                      ← Data pull from js-moltbook (pulse + weekly)
│       ├── blog-importer.js               ← Blog import + AI translation
│       ├── git.js                         ← Git operations (status/add/commit/push/pull)
│       ├── setup.js                       ← Cloudflare DNS + GitHub Pages setup
│       └── formatters.js                  ← Output formatting (JSON/stderr)
├── build/
│   └── build.js                           ← Build entry (delegates to cli/lib/builder.js)
├── scripts/
│   ├── setup-cloudflare.js                ← Cloudflare setup script
│   └── setup-github-pages.js              ← GitHub Pages setup script
├── src/                                   ← Source files (data + static site)
│   ├── index.html                         ← Homepage
│   ├── shared/
│   │   ├── js/
│   │   │   ├── i18n/                      ← I18nManager + locale files (zh-CN/en-US)
│   │   │   ├── nav.js                     ← Navigation + language switcher
│   │   │   ├── footer.js                  ← Footer component
│   │   │   ├── search.js                  ← Client-side search filter
│   │   │   └── threejs-bg.js              ← Three.js 3D background
│   │   └── css/brutal.css                 ← Neo-Brutalism design system
│   ├── data/
│   │   ├── navigation.json                ← Project directory + categories (bilingual)
│   │   └── featured.json                  ← Homepage featured content
│   ├── blog/
│   │   ├── posts/                         ← Markdown blog posts (zh-CN + en-US)
│   │   ├── sources.json                   ← External blog import sources
│   │   └── import-manifest.json           ← Import tracking for deduplication
│   ├── skills/
│   │   └── data/index.json                ← Skill market entries
│   ├── guide/
│   │   └── data/                          ← Guide articles (Markdown)
│   ├── pulse/
│   │   └── data/
│   │       ├── items.json                 ← Pulse entries (X curated highlights)
│   │       └── edited_items.json          ← Edit/delete registry
│   ├── projects/                          ← Project pages
│   └── craft/                             ← Craft site-building methodology
└── docs/                                  ← Build output (GitHub Pages deployment)
```

> `openclaw-plugin/index.mjs` imports from `../cli/lib/` via relative paths, so the directory layout must be preserved.

## Prerequisites

- **Node.js** >= 18
- An **OpenAI-compatible API** endpoint (for blog translation only; other features work offline)

## Install

### Option A — As OpenClaw Plugin (recommended)

1. Clone or download the repository
2. Run `npm install` in the project root
3. Register the plugin (see below)

### Option B — Standalone

1. Clone or download the repository
2. Run `npm install` in the project root
3. Copy `.env.example` to `.env` and fill in credentials
4. Use `node cli/cli.js <command>` for all operations

### Register the plugin

Add to `~/.openclaw/openclaw.json`:

```json
{
  "plugins": {
    "load": {
      "paths": ["/path/to/js-clawhub/openclaw-plugin"]
    },
    "entries": {
      "js-clawhub": {
        "enabled": true,
        "config": {
          "locale": "zh-CN",
          "moltbookPath": "../js-moltbook/packages/publisher/output",
          "llmApiBaseUrl": "http://localhost:8888/v1",
          "llmApiModel": "gpt-4.1-mini",
          "llmApiKey": "your-key"
        }
      }
    }
  }
}
```

Restart OpenClaw to load the plugin.

## Plugin Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `locale` | string | `zh-CN` | Default language (`zh-CN` or `en-US`) |
| `moltbookPath` | string | `""` | Path to js-moltbook publisher output (for Pulse + Weekly pull) |
| `llmApiBaseUrl` | string | `""` | OpenAI-compatible API endpoint (for blog translation) |
| `llmApiKey` | string | `""` | LLM API key |
| `llmApiModel` | string | `gpt-4.1-mini` | LLM model name |
| `cloudflareApiToken` | string | `""` | Cloudflare API Token (Zone:Read, Zone:Edit, DNS:Edit) |
| `cloudflareEmail` | string | `""` | Cloudflare email (only for Global API Key method) |
| `githubToken` | string | `""` | GitHub Personal Access Token (repo scope) |
| `gaId` | string | `""` | Google Analytics Measurement ID (injected at build time) |
| `cron.defaultInterval` | number | `120` | Auto-sync interval (minutes) |
| `cron.timezone` | string | `Asia/Shanghai` | Cron timezone (IANA) |

## Environment Variables (Standalone Mode)

| Variable | Description |
|----------|-------------|
| `CLAWHUB_API_BASE_URL` / `LLM_API_BASE_URL` | OpenAI-compatible API base URL |
| `CLAWHUB_API_KEY` / `LLM_API_KEY` | LLM API key |
| `CLAWHUB_API_MODEL` / `LLM_API_MODEL` | LLM model name |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token |
| `CLOUDFLARE_EMAIL` | Cloudflare email |
| `GITHUB_TOKEN` | GitHub Personal Access Token |
| `GA_ID` | Google Analytics Measurement ID |

## Verify

```bash
openclaw hub stats
```

Expected output:

```
=== ClawHub 统计 ===
  Pulse 动态: 42
  项目: 15
  技能: 8
  博客: 12
  指南: 5
  Pulse 最新: 2026-03-15
  博客最新: 2026-03-10
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Cannot find module '../cli/lib/...'` | Directory layout broken | Ensure `openclaw-plugin/` and `cli/` are sibling directories |
| Blog translation fails | LLM API unreachable | Check `llmApiBaseUrl` and network connectivity |
| Pulse pull returns 0 items | moltbook path incorrect | Verify `moltbookPath` points to valid publisher output |
| Build outputs nothing | `src/` is empty or corrupted | Check data files in `src/data/`, `src/pulse/data/`, etc. |
| Tools not appearing in Agent | Plugin path wrong | Ensure path points to `openclaw-plugin/` subdirectory |
| `git push` fails in auto-sync | No push permission | Configure SSH key or token for the remote |
| i18n validation errors on build | Missing translation keys | Check `src/shared/js/i18n/` locale files for completeness |

## Security

This skill only communicates with **user-configured** LLM API endpoints (for blog translation). It does not call any external APIs, collect telemetry, or transmit user data. All other features work entirely offline. Git push operations only target user-configured remotes.

## Extension Skills

| Skill | Description |
|-------|-------------|
| **clawhub-navigator** | Navigation assistant — matches user queries to the appropriate ClawHub tools, supports cron auto-sync triggers |

All skills are bundled in `openclaw-plugin/skills/`.

## Links

- Source: https://github.com/imjszhang/js-clawhub
- License: MIT
