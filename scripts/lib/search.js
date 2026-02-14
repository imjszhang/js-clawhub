/**
 * ClawHub Search — cross-source full-text keyword search.
 *
 * Searches across pulse, projects, skills, blog, and guide data.
 * Returns a unified result format with type, id, title, summary, and url.
 */

import {
    readPulse,
    readProjects,
    readSkills,
    readBlog,
    readGuide,
} from './data-reader.js';

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Check if any of the given fields contain the keyword (case-insensitive).
 */
function matches(keyword, ...fields) {
    const kw = keyword.toLowerCase();
    return fields.some(f => (f || '').toLowerCase().includes(kw));
}

// ── Search per source ────────────────────────────────────────────────

function searchPulse(keyword) {
    return readPulse().filter(it =>
        matches(keyword, it.title, it.summary, it.relevance, it.author)
    ).map(it => ({
        type: 'pulse',
        id: it.id,
        title: it.title,
        summary: it.summary || it.relevance || '',
        url: it.tweet_url || '',
        score: it.score || 0,
        date: it.date || '',
    }));
}

function searchProjects(keyword) {
    return readProjects().filter(it =>
        matches(keyword, it.name, it.desc, it.tags.join(' '))
    ).map(it => ({
        type: 'project',
        id: it.name,
        title: it.name,
        summary: it.desc || '',
        url: it.url || '',
        category: it.category || '',
    }));
}

function searchSkills(keyword) {
    return readSkills().filter(it =>
        matches(keyword, it.name, it.desc, (it.tags || []).join(' '), it.category)
    ).map(it => ({
        type: 'skill',
        id: it.slug,
        title: it.name,
        summary: it.desc || '',
        url: it.github || '',
        category: it.category || '',
    }));
}

function searchBlog(keyword) {
    return readBlog().filter(it =>
        matches(keyword, it.title, it.summary, (it.tags || []).join(' '))
    ).map(it => ({
        type: 'blog',
        id: it.slug,
        title: it.title,
        summary: it.summary || '',
        url: `/blog/${it.slug}`,
        date: it.date || '',
    }));
}

function searchGuide(keyword) {
    return readGuide().filter(it =>
        matches(keyword, it.title, it.slug)
    ).map(it => ({
        type: 'guide',
        id: it.slug,
        title: it.title,
        summary: '',
        url: `/guide/${it.slug}`,
        order: it.order || 0,
    }));
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Search across all (or filtered) data sources.
 * @param {string} keyword  - Search term
 * @param {string} [type]   - Restrict to one source: pulse|project|skill|blog|guide
 * @returns {Array}
 */
export function search(keyword, type) {
    if (!keyword) return [];

    const searchers = {
        pulse: searchPulse,
        project: searchProjects,
        skill: searchSkills,
        blog: searchBlog,
        guide: searchGuide,
    };

    if (type) {
        const fn = searchers[type.toLowerCase()];
        if (!fn) return [];
        return fn(keyword);
    }

    // Search all sources
    const results = [];
    for (const fn of Object.values(searchers)) {
        results.push(...fn(keyword));
    }
    return results;
}
