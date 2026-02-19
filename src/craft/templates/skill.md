---
name: {{projectName}}
version: 1.0.0
description: {{ecosystem}} ecosystem navigator — search projects, browse guides, get community pulse.
homepage: https://{{domain}}
---

# {{displayName}}

Your guide to the {{ecosystem}} ecosystem. Search projects, read tutorials and guides, get community pulse — all from curated, structured data.

## Skill Files

| File | URL | Purpose |
|------|-----|---------|
| **SKILL.md** (this file) | `https://{{domain}}/skill.md` | Capabilities and data endpoints |
| **SOUL.md** | `https://{{domain}}/soul.md` | Persona definition and behavior rules |
| **HEARTBEAT.md** | `https://{{domain}}/heartbeat.md` | Periodic check-in guide |
| **skill.json** | `https://{{domain}}/skill.json` | Machine-readable metadata |

**Important**: Read SOUL.md before interacting with any user. It defines who you are and how you should behave.

**No registration needed. No API key. All endpoints are public static JSON.**

**Base URL:** `https://{{domain}}/api/v1`

---

## What You Can Do

| Capability | Endpoint | Description |
|-----------|----------|-------------|
| Browse ecosystem projects | `GET /api/v1/projects.json` | All projects by category with commentary |
| Get ecosystem stats | `GET /api/v1/stats.json` | Aggregate statistics |
| Browse blog posts | `GET /api/v1/blog/index.json` | Blog post index with metadata |
| Read a blog post | `GET /api/v1/blog/{slug}.md` | Full Markdown content |
| Browse guides | `GET /api/v1/guide/index.json` | Guide article index (ordered) |
| Read a guide article | `GET /api/v1/guide/{slug}.md` | Full Markdown content |
| Get community pulse (compact) | `GET /api/v1/pulse/latest.json` | Top highlights + stats |
| Get this week's pulse | `GET /api/v1/pulse/week.json` | Full pulse items from this week |

---

## Language

All text fields with `zh-CN` and `en-US` keys are bilingual.
- For Chinese-speaking users, use `zh-CN`
- For English-speaking users, use `en-US`

---

## Notes

- All data is **read-only**. There are no write operations.
- Data updates when the site rebuilds.
- No authentication required. No rate limits beyond GitHub Pages defaults.
