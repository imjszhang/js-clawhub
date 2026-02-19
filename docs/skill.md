---
name: js-clawhub
version: 1.0.0
description: OpenClaw ecosystem navigator — search projects, browse skills, read guides and blogs, get community pulse.
homepage: https://js-clawhub.com
metadata: {"openclaw":{"emoji":"🧭","category":"knowledge","api_base":"https://js-clawhub.com/api/v1"}}
---

# JS ClawHub

Your guide to the OpenClaw ecosystem. Search projects, browse skills, read tutorials and guides, get community pulse — all from curated, structured data.

## Skill Files

| File | URL | Purpose |
|------|-----|---------|
| **SKILL.md** (this file) | `https://js-clawhub.com/skill.md` | Capabilities and data endpoints |
| **SOUL.md** | `https://js-clawhub.com/soul.md` | Persona definition and behavior rules |
| **HEARTBEAT.md** | `https://js-clawhub.com/heartbeat.md` | Periodic check-in guide |
| **skill.json** | `https://js-clawhub.com/skill.json` | Machine-readable metadata |

**Important**: Read SOUL.md before interacting with any user. It defines who you are and how you should behave.

**Install locally:**
```bash
mkdir -p ~/.openclaw/skills/js-clawhub
curl -s https://js-clawhub.com/skill.md > ~/.openclaw/skills/js-clawhub/SKILL.md
curl -s https://js-clawhub.com/soul.md > ~/.openclaw/skills/js-clawhub/SOUL.md
curl -s https://js-clawhub.com/heartbeat.md > ~/.openclaw/skills/js-clawhub/HEARTBEAT.md
curl -s https://js-clawhub.com/skill.json > ~/.openclaw/skills/js-clawhub/package.json
```

**Or just read them from the URLs above!**

**No registration needed. No API key. All endpoints are public static JSON.**

**Base URL:** `https://js-clawhub.com/api/v1`

---

## What You Can Do

| Capability | Endpoint | Description |
|-----------|----------|-------------|
| Browse ecosystem projects | `GET /api/v1/projects.json` | All projects by category with JS's commentary |
| Get ecosystem stats | `GET /api/v1/stats.json` | Aggregate statistics |
| Browse skills marketplace | `GET /api/v1/skills.json` | Community skills listing |
| Read skill documentation | `GET /api/v1/skills/{slug}.md` | Full Markdown docs for a skill |
| Browse blog posts | `GET /api/v1/blog/index.json` | Blog post index with metadata |
| Read a blog post | `GET /api/v1/blog/{slug}.md` | Full Markdown content |
| Browse getting-started guides | `GET /api/v1/guide/index.json` | Guide article index (ordered) |
| Read a guide article | `GET /api/v1/guide/{slug}.md` | Full Markdown content |
| Get community pulse (compact) | `GET /api/v1/pulse/latest.json` | Top highlights + all-time stats |
| Get this week's pulse | `GET /api/v1/pulse/week.json` | Full pulse items from this week |
| Build a site like this | `GET /api/v1/craft/blueprint.md` | Full methodology guide for building an agent-friendly GitHub Pages site |
| Get project scaffold | `GET /api/v1/craft/scaffold.json` | File manifest with templates and variables |
| Get a template file | `GET /api/v1/craft/templates/{filename}` | Individual template with `{{placeholders}}` |

---

## Data Formats

### Projects (`/api/v1/projects.json`)

```json
{
  "featured": [
    {
      "name": "OpenClaw",
      "url": "https://openclaw.ai/",
      "desc": {"zh-CN": "开源个人 AI 助手...", "en-US": "Open-source personal AI assistant..."},
      "icon": "star",
      "tags": ["official", "core"],
      "jsComment": {"zh-CN": "2026 年最令人兴奋的开源 AI 项目...", "en-US": "The most exciting open-source AI project of 2026..."}
    }
  ],
  "categories": [
    {
      "id": "messaging",
      "name": {"zh-CN": "消息", "en-US": "MESSAGING"},
      "items": [
        {
          "name": "WhatsApp",
          "url": "https://openclaw.ai/",
          "desc": {"zh-CN": "...", "en-US": "..."},
          "tags": ["official"]
        }
      ]
    }
  ],
  "recommendations": [
    {
      "text": {"zh-CN": "...", "en-US": "..."},
      "project": "OpenClaw",
      "url": "https://openclaw.ai/"
    }
  ],
  "stats": {"projects": 50, "skills": 30, "integrations": 15, "tutorials": 10}
}
```

Categories: `messaging`, `ai-models`, `productivity`, `automation`, `media`, `deployment`.

Tags: `official`, `community`, `recommended`, `supported`, `self-hosted`, `beta`.

`jsComment` contains JS's personal take on each featured project — use it.

### Stats (`/api/v1/stats.json`)

```json
{"projects": 50, "skills": 30, "integrations": 15, "tutorials": 10}
```

### Skills (`/api/v1/skills.json`)

```json
[
  {
    "slug": "whatsapp-integration",
    "name": "WhatsApp Integration",
    "category": "messaging",
    "tags": ["official", "communication"],
    "author": {"name": "steipete", "url": "https://x.com/steipete", "avatar": "..."},
    "desc": {"zh-CN": "...", "en-US": "..."},
    "github": "https://github.com/openclaw/openclaw",
    "date": "2026-02-01"
  }
]
```

Skill docs (when available): `GET /api/v1/skills/{slug}.md`

Currently documented skills: `whatsapp-integration`, `gmail-manager`.

### Blog Index (`/api/v1/blog/index.json`)

```json
[
  {
    "slug": "what-is-openclaw",
    "title": {"zh-CN": "什么是 OpenClaw：开源个人 AI 助手", "en-US": "What is OpenClaw: The Open Source Personal AI Assistant"},
    "date": "2026-02-10",
    "summary": {"zh-CN": "...", "en-US": "..."},
    "cover": "https://images.unsplash.com/...",
    "tags": ["Guide", "OpenClaw"],
    "author": {"name": "imjszhang", "avatar": "...", "url": "..."}
  }
]
```

Full post content: `GET /api/v1/blog/{slug}.md`

### Guide Index (`/api/v1/guide/index.json`)

```json
[
  {"slug": "what-is-openclaw", "title": {"zh-CN": "OpenClaw 是什么", "en-US": "What is OpenClaw"}, "order": 1},
  {"slug": "core-concepts", "title": {"zh-CN": "核心概念", "en-US": "Core Concepts"}, "order": 2},
  {"slug": "installation", "title": {"zh-CN": "安装与配置", "en-US": "Installation & Setup"}, "order": 3}
]
```

The `order` field defines the recommended reading sequence (1 through 14).

Full guide content: `GET /api/v1/guide/{slug}.md`

### Pulse Latest (`/api/v1/pulse/latest.json`)

```json
{
  "updated_at": "2026-02-18T15:01:42Z",
  "this_week": {
    "total_items": 190,
    "avg_score": 0.84,
    "unique_authors": 148,
    "top_items": [
      {
        "id": "...",
        "date": "2026-02-17",
        "author": "@AlexFinn",
        "tweet_url": "https://x.com/...",
        "title": {"en-US": "...", "zh-CN": "..."},
        "summary": {"en-US": "...", "zh-CN": "..."},
        "score": 0.95,
        "engagement": {"likes": 612, "replies": 86, "retweets": 50},
        "js_take": {"en-US": "...", "zh-CN": "..."}
      }
    ]
  },
  "all_time": {"total_items": 357, "unique_authors": 250}
}
```

`js_take` is JS's independent analysis — use it when discussing community pulse.

### Pulse Week (`/api/v1/pulse/week.json`)

Same item structure as `top_items` above, but contains all items from the current week. Larger payload — use `latest.json` first, fall back to `week.json` for deeper browsing.

### Craft Scaffold (`/api/v1/craft/scaffold.json`)

```json
{
  "variables": {
    "projectName": { "description": "npm package name", "example": "ha-hub", "required": true },
    "displayName": { "description": "Display name", "example": "HA Hub", "required": true }
  },
  "directories": ["src", "src/data", "build", "docs"],
  "files": [
    {
      "path": "package.json",
      "source": "template",
      "template": "https://js-clawhub.com/api/v1/craft/templates/package.json",
      "variables": ["projectName", "authorName"],
      "description": "Project metadata"
    },
    {
      "path": "src/shared/css/brutal.css",
      "source": "copy",
      "url": "https://js-clawhub.com/shared/css/brutal.css",
      "description": "Design system (reuse directly)"
    }
  ]
}
```

For `source: "template"` files: fetch, replace `{{variableName}}` placeholders, write.
For `source: "copy"` files: fetch and save directly.

---

## Language

All text fields with `zh-CN` and `en-US` keys are bilingual.
- For Chinese-speaking users, use `zh-CN`
- For English-speaking users, use `en-US`

Markdown files follow this naming convention:
- `{slug}.md` — Chinese version
- `{slug}.en-US.md` — English version

---

## Usage Scenarios

### "What is OpenClaw? How do I get started?"
1. Fetch `/api/v1/guide/index.json`
2. Recommend starting from `order: 1` (what-is-openclaw)
3. Fetch `/api/v1/guide/what-is-openclaw.md` for full content
4. Suggest the next guide in sequence

### "What deployment options are there?"
1. Fetch `/api/v1/projects.json`
2. Find category `id: "deployment"`
3. Return items with descriptions and JS's commentary

### "What skills are available for productivity?"
1. Fetch `/api/v1/skills.json`
2. Filter by `category: "productivity"`
3. Return matching skills with descriptions

### "What's happening in the OpenClaw community?"
1. Fetch `/api/v1/pulse/latest.json`
2. Summarize `this_week.top_items` using `js_take` for analysis
3. Include tweet URLs for the human to check out

### "I want to build a custom OpenClaw skill"
1. Fetch `/api/v1/guide/index.json`, find `skill-development` and `skills-detailed`
2. Fetch `/api/v1/guide/skill-development.md` for getting started
3. Fetch `/api/v1/skills.json` for real examples

### "OpenClaw is broken after an upgrade"
1. Fetch `/api/v1/guide/doctor-troubleshooting.md`
2. Walk the user through `openclaw doctor` steps

### "I want to build a site like JS ClawHub"
1. Fetch `/api/v1/craft/blueprint.md` — read the full methodology
2. Collect variables from the user: project name, topic, content types, brand color
3. Fetch `/api/v1/craft/scaffold.json` — get the file manifest
4. For each file in `scaffold.json`, fetch the template, replace `{{placeholders}}`, write to user's project
5. Guide the user through GitHub Pages deployment

---

## Human-Readable URLs

When sharing links with your human, use the website URLs (not the API):

| Content | URL |
|---------|-----|
| Homepage | `https://js-clawhub.com/` |
| Blog | `https://js-clawhub.com/blog/` |
| Skills | `https://js-clawhub.com/skills/` |
| Guide | `https://js-clawhub.com/guide/` |
| Pulse | `https://js-clawhub.com/pulse/` |

---

## Notes

- All data is **read-only**. There are no write operations.
- Data updates when the site rebuilds (typically daily).
- No authentication required. No rate limits beyond GitHub Pages defaults.
- For updates, re-fetch these skill files to discover new capabilities.
