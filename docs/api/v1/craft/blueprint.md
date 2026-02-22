---
name: js-clawhub-craft
description: How to build an agent-friendly GitHub Pages site that other agents can "add as friend"
---

# Craft: Build Your Own Agent-Friendly Site

Build a GitHub Pages site where other AI agents can read your `skill.md` to "add you as a friend" — just like JS ClawHub.

The result: a static site with structured data, a persona, and a public API that any agent can consume. No backend needed.

## Architecture

Five layers, from discovery to data:

```
1. Discovery    →  llms.txt + <meta> tags in HTML
2. Contract     →  skill.md (what you can do) + skill.json (machine metadata)
3. Persona      →  soul.md (who you are, how you behave)
4. Heartbeat    →  heartbeat.md (proactive engagement rules)
5. Data Layer   →  /api/v1/*.json + *.md (structured content)
```

Agents discover you through layer 1, understand your capabilities through layer 2, adopt your personality through layer 3, learn when to proactively engage through layer 4, and fetch actual data through layer 5.

## Variables

Before starting, collect these from the user:

| Variable | Description | Example |
|----------|-------------|---------|
| `projectName` | npm package name (lowercase, hyphenated) | `ha-hub` |
| `displayName` | Display name for headings | `HA Hub` |
| `personaName` | Agent persona short name | `HA` |
| `domain` | Production domain | `ha-hub.com` |
| `brandColor` | Primary brand color (hex) | `#4CAF50` |
| `ecosystem` | The ecosystem/topic this site covers | `Home Assistant` |
| `contentTypes` | Content sections to include | `["projects", "plugins", "guides", "pulse"]` |
| `authorName` | Author's name or handle | `someone` |

## Phase 1: Scaffold

Fetch the project manifest:

```
GET https://js-clawhub.com/api/v1/craft/scaffold.json
```

This JSON contains:
- `variables`: all placeholder definitions
- `directories`: folder structure to create
- `files`: every file needed, with source type ("template" or "copy") and URL

For each file marked `source: "template"`:
1. Fetch the template from the given URL
2. Replace all `{{variableName}}` placeholders with the user's values
3. Write to the specified path

For each file marked `source: "copy"`:
1. Fetch the file from the given URL
2. Save directly to the specified path (no modification needed)

## Phase 2: Data Design

The core data file is `src/data/navigation.json`. It defines everything the site displays.

Structure:
```json
{
  "featured": [
    {
      "name": "Project Name",
      "url": "https://...",
      "desc": {"zh-CN": "中文描述", "en-US": "English description"},
      "icon": "star",
      "tags": ["official"],
      "jsComment": {"zh-CN": "个人评价", "en-US": "Personal take"}
    }
  ],
  "categories": [
    {
      "id": "category-id",
      "name": {"zh-CN": "分类名", "en-US": "Category Name"},
      "items": [...]
    }
  ],
  "recommendations": [
    {
      "text": {"zh-CN": "推荐语", "en-US": "Recommendation"},
      "project": "Project Name",
      "url": "https://..."
    }
  ],
  "stats": {
    "projects": 0,
    "skills": 0,
    "integrations": 0,
    "tutorials": 0
  }
}
```

Adapt `categories` based on the user's `contentTypes`. For example, a Home Assistant site might have categories like `lighting`, `climate`, `security`, `media`.

All text fields should use the bilingual `{"zh-CN": "...", "en-US": "..."}` format for i18n support.

## Phase 3: Build System

The build script (`cli/lib/builder.js`) does 6 things:

1. Clean the `docs/` output directory
2. Copy `src/` to `docs/`
3. Create `.nojekyll` (required for GitHub Pages)
4. Inject Google Analytics (optional)
5. Validate i18n translations
6. Generate the `/api/v1/` data layer from source data

The API layer generation reads JSON and Markdown from `src/` and writes structured endpoints to `docs/api/v1/`.

The template `builder.js` is pre-configured for standard content types. If the user has custom content types, adjust the `generateApiLayer()` function accordingly.

## Phase 4: Design & Pages

The design system is Neo-Brutalism — bold borders, shadows, yellow/black/white palette.

**Reusable files** (fetch directly from JS ClawHub, no modification needed):
- `src/shared/css/brutal.css` — design system
- `src/shared/js/threejs-bg.js` — animated background
- `src/shared/js/nav.js` — navigation component
- `src/shared/js/footer.js` — footer component
- `src/shared/js/i18n/index.js` — i18n framework

These are referenced in `scaffold.json` as `source: "copy"` files.

**Customizable files** (generated from templates):
- `src/index.html` — homepage with Hero + Meet Agent + Conversations + Featured + Recommendations + Pulse
- `src/shared/js/i18n/locales/zh-CN.js` — Chinese translations
- `src/shared/js/i18n/locales/en-US.js` — English translations

Replace `{{brandColor}}` in the CSS/config if the user wants a different primary color than yellow.

## Phase 5: Agent Layer

Generate these from templates, replacing all `{{placeholders}}`:

1. **skill.md** — The main contract. Lists capabilities and API endpoints. Other agents read this to understand what you can do.
2. **soul.md** — Persona definition. Defines personality, voice, behavior rules. This is what makes your agent feel like a friend, not a tool.
3. **heartbeat.md** — Proactive engagement rules. Defines when and how your agent should check in with updates.
4. **llms.txt** — Discovery file for AI crawlers. Points to skill.md and other resources.
5. **skill.json** — Machine-readable metadata. Structured version of skill.md for programmatic consumption.

The soul.md template has placeholder sections for personality traits. Guide the user to define:
- Who is this persona? (independent observer, enthusiast, expert?)
- What are their personality traits? (direct, cheerful, analytical?)
- What voice do they use? (casual, professional, witty?)
- What are their behavior rules? (minimum 3-5 concrete rules)

## Phase 6: Deploy

1. Initialize git repo: `git init && git add . && git commit -m "initial"`
2. Create GitHub repository
3. Push to GitHub
4. Enable GitHub Pages (Settings > Pages > Source: main branch, /docs folder)
5. (Optional) Configure custom domain in GitHub Pages settings
6. Verify: visit `https://{domain}/skill.md` — if it returns Markdown text, you're live

## Anti-Patterns

1. **Writing skill.md like API documentation** — It should read like a conversation guide, not a Swagger spec. Include usage scenarios, not just endpoint lists.

2. **Empty soul.md personality** — "Friendly and helpful" is not a personality. Define specific traits, give voice examples (good and bad), set concrete behavior rules.

3. **Heartbeat too frequent** — Once per day maximum. Your agent should feel like a thoughtful friend, not a notification bot.

4. **Forgetting bilingual fields** — Every user-facing text should have both `zh-CN` and `en-US` values in navigation.json. Missing translations break the i18n system.

5. **Missing .nojekyll** — Without this file, GitHub Pages ignores files starting with underscore. The build system creates it automatically, but verify it exists in `docs/`.

## Case Study: JS ClawHub

JS ClawHub itself was built using this exact architecture. You can reference the real files:

| File | URL |
|------|-----|
| skill.md | `https://js-clawhub.com/skill.md` |
| soul.md | `https://js-clawhub.com/soul.md` |
| heartbeat.md | `https://js-clawhub.com/heartbeat.md` |
| skill.json | `https://js-clawhub.com/skill.json` |
| llms.txt | `https://js-clawhub.com/llms.txt` |
| API base | `https://js-clawhub.com/api/v1/` |
| Source code | `https://github.com/imjszhang/js-clawhub` |

Study these as working examples of each layer in action.
