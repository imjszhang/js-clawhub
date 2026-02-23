/**
 * ClawHub Puller — pull data from js-moltbook into js-clawhub.
 *
 * Reads published data from js-moltbook's data/publishers/clawhub/,
 * applies edited_items exclusions, and writes to src/pulse/data/.
 * Optionally pulls weekly digest files into src/blog/posts/.
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getExcludedIds } from './data-writer.js';
import { toStderr } from './formatters.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = join(__dirname, '..', '..');
const SRC = join(PROJECT_ROOT, 'src');
const PULSE_DATA_DIR = join(SRC, 'pulse', 'data');
const BLOG_POSTS_DIR = join(SRC, 'blog', 'posts');

const DEFAULT_SOURCE = join(PROJECT_ROOT, '..', 'js-moltbook', 'data', 'publishers', 'clawhub');

function readJson(filepath) {
    if (!existsSync(filepath)) return null;
    try {
        return JSON.parse(readFileSync(filepath, 'utf-8'));
    } catch {
        return null;
    }
}

// ── Pulse Pull ──────────────────────────────────────────────────────

function pullPulse(sourceDir, { dryRun = false } = {}) {
    const srcItems = join(sourceDir, 'items.json');
    const srcStats = join(sourceDir, 'pulse_stats.json');

    if (!existsSync(srcItems)) {
        throw new Error(`Source items.json not found: ${srcItems}`);
    }

    const items = readJson(srcItems);
    if (!Array.isArray(items)) {
        throw new Error(`Invalid items.json: expected array`);
    }

    const excludedIds = new Set(getExcludedIds());
    const filtered = excludedIds.size > 0
        ? items.filter(it => !excludedIds.has(it.id))
        : items;

    const excludedCount = items.length - filtered.length;

    toStderr(`  Source: ${srcItems}`);
    toStderr(`  Items: ${items.length} total, ${excludedCount} excluded, ${filtered.length} kept`);

    if (dryRun) {
        toStderr('  [dry-run] Skipping write.');
        return { items: filtered.length, excluded: excludedCount, stats: false, dryRun: true };
    }

    const dstItems = join(PULSE_DATA_DIR, 'items.json');
    writeFileSync(dstItems, JSON.stringify(filtered, null, 2) + '\n', 'utf-8');
    toStderr(`  Written: ${dstItems}`);

    let statsCopied = false;
    if (existsSync(srcStats)) {
        const dstStats = join(PULSE_DATA_DIR, 'pulse_stats.json');
        copyFileSync(srcStats, dstStats);
        statsCopied = true;
        toStderr(`  Copied: pulse_stats.json`);
    }

    return { items: filtered.length, excluded: excludedCount, stats: statsCopied, dryRun: false };
}

// ── Weekly Pull ─────────────────────────────────────────────────────

function pullWeekly(sourceDir, { dryRun = false } = {}) {
    const weeklyDir = join(sourceDir, 'weekly');

    if (!existsSync(weeklyDir)) {
        toStderr('  No weekly/ directory in source, skipping.');
        return { files: 0, indexMerged: false };
    }

    const mdFiles = readdirSync(weeklyDir).filter(f => f.startsWith('weekly-') && f.endsWith('.md'));
    if (mdFiles.length === 0) {
        toStderr('  No weekly markdown files found, skipping.');
        return { files: 0, indexMerged: false };
    }

    const existingBlogFiles = new Set(
        existsSync(BLOG_POSTS_DIR) ? readdirSync(BLOG_POSTS_DIR) : []
    );
    const newFiles = mdFiles.filter(f => !existingBlogFiles.has(f));

    if (newFiles.length === 0) {
        toStderr('  All weekly files already present, skipping.');
        return { files: 0, indexMerged: false };
    }

    toStderr(`  New weekly files: ${newFiles.length}`);

    if (dryRun) {
        toStderr('  [dry-run] Skipping write.');
        return { files: newFiles.length, indexMerged: false, dryRun: true };
    }

    for (const f of newFiles) {
        copyFileSync(join(weeklyDir, f), join(BLOG_POSTS_DIR, f));
        toStderr(`  Copied: ${f}`);
    }

    let indexMerged = false;
    const weeklyIndex = join(weeklyDir, 'index.json');
    const blogIndex = join(BLOG_POSTS_DIR, 'index.json');
    if (existsSync(weeklyIndex) && existsSync(blogIndex)) {
        try {
            const weeklyEntries = readJson(weeklyIndex) || [];
            const blogEntries = readJson(blogIndex) || [];
            const newSlugs = new Set(weeklyEntries.map(e => e.slug));
            const merged = [
                ...weeklyEntries,
                ...blogEntries.filter(e => !newSlugs.has(e.slug)),
            ];
            writeFileSync(blogIndex, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
            indexMerged = true;
            toStderr('  Merged: blog index.json');
        } catch (err) {
            toStderr(`  Warning: failed to merge blog index.json: ${err.message}`);
        }
    }

    return { files: newFiles.length, indexMerged };
}

// ── Main Entry ──────────────────────────────────────────────────────

/**
 * Pull data from js-moltbook into js-clawhub.
 *
 * @param {Object} options
 * @param {string} [options.source]  - Path to js-moltbook publisher output dir
 * @param {string} [options.type]    - 'pulse', 'weekly', or 'all' (default: 'all')
 * @param {boolean} [options.dryRun] - Preview only
 * @returns {Object} Pull results
 */
export function pull({ source, type = 'all', dryRun = false } = {}) {
    const sourceDir = source || DEFAULT_SOURCE;

    if (!existsSync(sourceDir)) {
        throw new Error(`Source directory not found: ${sourceDir}\nExpected js-moltbook at ../js-moltbook/`);
    }

    toStderr(`\n── Pull from ${sourceDir} ──`);

    const result = { pulse: null, weekly: null };

    if (type === 'pulse' || type === 'all') {
        toStderr('\n[Pulse]');
        result.pulse = pullPulse(sourceDir, { dryRun });
    }

    if (type === 'weekly' || type === 'all') {
        toStderr('\n[Weekly]');
        result.weekly = pullWeekly(sourceDir, { dryRun });
    }

    return result;
}
