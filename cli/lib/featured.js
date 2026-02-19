/**
 * ClawHub Featured Manager — manage homepage featured/curated content.
 *
 * Reads from various data sources (navigation.json, skills, guide, blog)
 * and writes curated selections to src/data/featured.json.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SRC = join(__dirname, '..', '..', 'src');

const PATHS = {
    featured:   join(SRC, 'data', 'featured.json'),
    navigation: join(SRC, 'data', 'navigation.json'),
    skills:     join(SRC, 'skills', 'data', 'index.json'),
    blog:       join(SRC, 'blog', 'posts', 'index.json'),
    guide:      join(SRC, 'guide', 'data', 'index.json'),
};

function readJson(filepath) {
    if (!existsSync(filepath)) return null;
    try {
        return JSON.parse(readFileSync(filepath, 'utf-8'));
    } catch {
        return null;
    }
}

function writeFeatured(data) {
    writeFileSync(PATHS.featured, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function loadFeatured() {
    return readJson(PATHS.featured) || { projects: [], guide: [], blog: [] };
}

/**
 * Build a flat list of all available projects from navigation.json + skills.
 * Each entry has: name (lowercase key), original data for featured.json.
 */
function getAllProjects() {
    const results = [];
    const nav = readJson(PATHS.navigation);
    if (nav) {
        for (const item of (nav.featured || [])) {
            results.push({
                key: item.name.toLowerCase(),
                data: {
                    name: item.name,
                    url: item.url,
                    desc: item.desc,
                    tags: item.tags || [],
                    jsComment: item.jsComment || null,
                    icon: item.icon || null,
                    source: 'navigation.featured',
                },
            });
        }
        for (const cat of (nav.categories || [])) {
            for (const item of (cat.items || [])) {
                results.push({
                    key: item.name.toLowerCase(),
                    data: {
                        name: item.name,
                        url: item.url,
                        desc: item.desc,
                        tags: [cat.id, ...(item.tags || [])],
                        jsComment: null,
                        icon: null,
                        source: `navigation.${cat.id}`,
                    },
                });
            }
        }
    }
    const skills = readJson(PATHS.skills) || [];
    for (const item of skills) {
        results.push({
            key: item.name.toLowerCase(),
            data: {
                name: item.name,
                url: item.github || '#',
                desc: item.desc,
                tags: ['skills', ...(item.tags || [])],
                jsComment: null,
                icon: null,
                source: 'skills',
            },
        });
    }
    return results;
}

/**
 * List current featured selections.
 */
export function listFeatured() {
    return loadFeatured();
}

/**
 * Set featured items for a section.
 * @param {'projects'|'guide'|'blog'} section
 * @param {string[]} ids - comma-separated names (projects) or slugs (guide/blog)
 * @returns {Object} updated featured data
 */
export function setFeatured(section, ids) {
    const featured = loadFeatured();

    if (section === 'projects') {
        const allProjects = getAllProjects();
        const matched = [];
        for (const id of ids) {
            const needle = id.toLowerCase().trim();
            const found = allProjects.find(p => p.key === needle);
            if (found) {
                matched.push(found.data);
            } else {
                const partial = allProjects.find(p => p.key.includes(needle));
                if (partial) {
                    matched.push(partial.data);
                }
            }
        }
        featured.projects = matched;

    } else if (section === 'guide') {
        const allGuide = readJson(PATHS.guide) || [];
        const matched = [];
        for (const id of ids) {
            const slug = id.trim();
            const found = allGuide.find(g => g.slug === slug);
            if (found) {
                matched.push({ ...found, source: 'guide' });
            }
        }
        featured.guide = matched;

    } else if (section === 'blog') {
        const allBlog = readJson(PATHS.blog) || [];
        const matched = [];
        for (const id of ids) {
            const slug = id.trim();
            const found = allBlog.find(b => b.slug === slug);
            if (found) {
                matched.push({ ...found, source: 'blog' });
            }
        }
        featured.blog = matched;

    } else {
        throw new Error(`Unknown section: ${section}. Use: projects, guide, blog`);
    }

    writeFeatured(featured);
    return featured;
}

/**
 * Clear all featured items in a section.
 * @param {'projects'|'guide'|'blog'} section
 * @returns {Object} updated featured data
 */
export function clearFeatured(section) {
    const featured = loadFeatured();
    if (!['projects', 'guide', 'blog'].includes(section)) {
        throw new Error(`Unknown section: ${section}. Use: projects, guide, blog`);
    }
    featured[section] = [];
    writeFeatured(featured);
    return featured;
}
