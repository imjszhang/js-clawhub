/**
 * ClawHub Data Reader — unified read layer for all docs/ data sources.
 *
 * Every public function returns plain JS objects (no formatting).
 * Paths are resolved relative to the repo root via __dirname so the
 * caller never needs to know where the JSON files live.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Paths ────────────────────────────────────────────────────────────

const DOCS = join(__dirname, '..', '..', 'docs');

const PATHS = {
    pulse:      join(DOCS, 'pulse', 'data', 'items.json'),
    navigation: join(DOCS, 'data', 'navigation.json'),
    skills:     join(DOCS, 'skills', 'data', 'index.json'),
    blog:       join(DOCS, 'blog', 'posts', 'index.json'),
    guide:      join(DOCS, 'guide', 'data', 'index.json'),
    guideDir:   join(DOCS, 'guide', 'data'),
    blogDir:    join(DOCS, 'blog', 'posts'),
};

// ── Internal helpers ─────────────────────────────────────────────────

function readJson(filepath) {
    if (!existsSync(filepath)) return null;
    try {
        return JSON.parse(readFileSync(filepath, 'utf-8'));
    } catch {
        return null;
    }
}

function formatDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Read Pulse items with optional filters.
 * @param {Object} opts
 * @param {number} [opts.days]      - Only items from last N days
 * @param {number} [opts.minScore]  - Minimum score threshold
 * @param {string} [opts.author]    - Filter by author handle (case-insensitive)
 * @param {number} [opts.limit]     - Max items to return
 * @returns {Array}
 */
export function readPulse({ days, minScore, author, limit } = {}) {
    let items = readJson(PATHS.pulse) || [];

    if (days) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const cutoffStr = formatDate(cutoff);
        items = items.filter(it => it.date >= cutoffStr);
    }

    if (minScore != null) {
        items = items.filter(it => (it.score || 0) >= minScore);
    }

    if (author) {
        const needle = author.toLowerCase().replace(/^@/, '');
        items = items.filter(it =>
            (it.author || '').toLowerCase().replace(/^@/, '').includes(needle)
        );
    }

    if (limit) {
        items = items.slice(0, limit);
    }

    return items;
}

/**
 * Read project listings from navigation.json categories.
 * @param {Object} opts
 * @param {string} [opts.category] - Filter by category id (e.g. "messaging")
 * @param {string} [opts.tag]      - Filter by tag (case-insensitive)
 * @returns {Array}
 */
export function readProjects({ category, tag } = {}) {
    const nav = readJson(PATHS.navigation);
    if (!nav) return [];

    let results = [];

    // Featured items
    for (const item of (nav.featured || [])) {
        results.push({
            name: item.name,
            desc: item.desc,
            url: item.url,
            category: 'featured',
            tags: item.tags || [],
        });
    }

    // Category items
    for (const cat of (nav.categories || [])) {
        for (const item of (cat.items || [])) {
            results.push({
                name: item.name,
                desc: item.desc,
                url: item.url,
                category: cat.id,
                tags: item.tags || [],
            });
        }
    }

    if (category) {
        const c = category.toLowerCase();
        results = results.filter(r => r.category.toLowerCase() === c);
    }

    if (tag) {
        const t = tag.toLowerCase();
        results = results.filter(r =>
            r.tags.some(tg => tg.toLowerCase() === t)
        );
    }

    return results;
}

/**
 * Read skills index.
 * @param {Object} opts
 * @param {string} [opts.category] - Filter by category (case-insensitive)
 * @returns {Array}
 */
export function readSkills({ category } = {}) {
    let items = readJson(PATHS.skills) || [];

    if (category) {
        const c = category.toLowerCase();
        items = items.filter(it => (it.category || '').toLowerCase() === c);
    }

    return items;
}

/**
 * Read blog post summaries.
 * @param {Object} opts
 * @param {string} [opts.tag]    - Filter by tag (case-insensitive)
 * @param {number} [opts.latest] - Return only the N most recent posts
 * @returns {Array}
 */
export function readBlog({ tag, latest } = {}) {
    let items = readJson(PATHS.blog) || [];

    // Sort by date desc (newest first)
    items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    if (tag) {
        const t = tag.toLowerCase();
        items = items.filter(it =>
            (it.tags || []).some(tg => tg.toLowerCase() === t)
        );
    }

    if (latest) {
        items = items.slice(0, latest);
    }

    return items;
}

/**
 * Read guide index (no Markdown body in this version).
 * @param {Object} opts
 * @param {string} [opts.slug] - Return only the entry with this slug
 * @returns {Array|Object}
 */
export function readGuide({ slug } = {}) {
    let items = readJson(PATHS.guide) || [];

    // Sort by order
    items.sort((a, b) => (a.order || 0) - (b.order || 0));

    if (slug) {
        return items.find(it => it.slug === slug) || null;
    }

    return items;
}

/**
 * Aggregate stats across all data sources.
 * @returns {Object}
 */
export function getStats() {
    const pulse = readJson(PATHS.pulse) || [];
    const skills = readJson(PATHS.skills) || [];
    const blog = readJson(PATHS.blog) || [];
    const guide = readJson(PATHS.guide) || [];
    const nav = readJson(PATHS.navigation);

    // Count all project items from navigation
    let projectCount = 0;
    if (nav) {
        projectCount += (nav.featured || []).length;
        for (const cat of (nav.categories || [])) {
            projectCount += (cat.items || []).length;
        }
    }

    return {
        pulse_count: pulse.length,
        skills_count: skills.length,
        blog_count: blog.length,
        guide_count: guide.length,
        projects_count: projectCount,
        pulse_latest_date: pulse.length > 0 ? pulse[0].date : null,
        blog_latest_date: blog.length > 0
            ? blog.reduce((a, b) => (a.date || '') > (b.date || '') ? a : b).date
            : null,
    };
}
