#!/usr/bin/env node

/**
 * JS ClawHub - Pulse Sync Script
 * 
 * Reads x-engage engagement_history from js-moltbook,
 * filters OpenClaw-related items by keyword matching,
 * deduplicates against existing items.json, and writes new entries.
 *
 * Usage:
 *   node scripts/sync-pulse.js              # sync last 2 days
 *   node scripts/sync-pulse.js --days 7     # sync last 7 days
 *   node scripts/sync-pulse.js --dry-run    # preview without writing
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Config ──────────────────────────────────────────────────────────

const ITEMS_PATH = join(__dirname, '..', 'docs', 'pulse', 'data', 'items.json');

// Relative path from js-clawhub to js-moltbook engagement history
const HISTORY_DIR = join(__dirname, '..', '..', 'js-moltbook', 'data', 'intelligence', 'x_engagement_history');

// Engagement queue (has richer data: engagement stats, why, draft_comment)
const QUEUE_PATH = join(__dirname, '..', '..', 'js-moltbook', 'data', 'intelligence', 'x_engagement_queue', 'engagement_queue.json');

// OpenClaw keyword filter (case-insensitive)
const OPENCLAW_KEYWORDS = [
    'openclaw', 'open claw', 'open-claw',
    'clawhub', 'claw hub',
    'steipete',          // OpenClaw author
    'picoclaw', 'pico claw',
    'tinyclaw', 'tiny claw',
    'compactor',         // Claw Compactor
    'claw desktop',
    'claw skills',
];

// Minimum score threshold
const MIN_SCORE = 0.7;

// ── Helpers ─────────────────────────────────────────────────────────

function parseArgs() {
    const args = process.argv.slice(2);
    let days = 2;
    let dryRun = false;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--days' && args[i + 1]) {
            days = parseInt(args[i + 1], 10);
            i++;
        }
        if (args[i] === '--dry-run') {
            dryRun = true;
        }
    }

    return { days, dryRun };
}

function formatDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getDateRange(days) {
    const dates = [];
    const now = new Date();
    for (let i = 0; i < days; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dates.push(formatDate(d));
    }
    return dates;
}

function isOpenClawRelated(item) {
    const searchText = [
        item.relevance || '',
        item.content_preview || '',
        item.why || '',
        item.author || '',
    ].join(' ').toLowerCase();

    return OPENCLAW_KEYWORDS.some(kw => searchText.includes(kw));
}

function readJsonlFile(filepath) {
    if (!existsSync(filepath)) return [];

    const content = readFileSync(filepath, 'utf-8').trim();
    if (!content) return [];

    return content.split('\n')
        .filter(line => line.trim())
        .map(line => {
            try {
                return JSON.parse(line);
            } catch {
                return null;
            }
        })
        .filter(Boolean);
}

function extractDate(ts) {
    if (!ts) return '';
    // "2026-02-14T02:00:39.708980+08:00" → "2026-02-14"
    return ts.slice(0, 10);
}

function extractAuthorUrl(author) {
    if (!author) return '';
    const handle = author.replace(/^@+/, '');
    return `https://x.com/${handle}`;
}

function readQueueEnrichment() {
    // Build a tweet_id → {engagement, why, draft_comment} lookup from queue
    const enrichment = new Map();
    if (!existsSync(QUEUE_PATH)) return enrichment;

    try {
        const queue = JSON.parse(readFileSync(QUEUE_PATH, 'utf-8'));
        for (const opp of (queue.opportunities || [])) {
            enrichment.set(opp.tweet_id, {
                engagement: opp.engagement || {},
                why: opp.why || '',
                draft_comment: opp.draft_comment || '',
            });
        }
    } catch { /* ignore parse errors */ }

    return enrichment;
}

function transformToItem(entry, enrichment) {
    const extra = enrichment?.get(entry.tweet_id) || {};
    return {
        id: entry.tweet_id,
        date: extractDate(entry.ts),
        author: entry.author || '',
        author_url: extractAuthorUrl(entry.author),
        tweet_url: entry.tweet_url || '',
        title: entry.content_preview || '',
        summary: extra.why || entry.why || entry.relevance || '',
        relevance: entry.relevance || '',
        score: entry.score || 0,
        engagement: entry.engagement || extra.engagement || {},
        comment_type: entry.comment_type || '',
        synced_at: new Date().toISOString(),
    };
}

// ── Main ────────────────────────────────────────────────────────────

function main() {
    const { days, dryRun } = parseArgs();

    console.log(`\n🔍 Pulse Sync — scanning last ${days} day(s)${dryRun ? ' [DRY RUN]' : ''}\n`);

    // 1. Check history dir exists
    if (!existsSync(HISTORY_DIR)) {
        console.error(`❌ History directory not found: ${HISTORY_DIR}`);
        console.error('   Make sure js-moltbook is at the expected path.');
        process.exit(1);
    }

    // 2. Read existing items
    let existingItems = [];
    if (existsSync(ITEMS_PATH)) {
        try {
            existingItems = JSON.parse(readFileSync(ITEMS_PATH, 'utf-8'));
        } catch {
            existingItems = [];
        }
    }
    const existingIds = new Set(existingItems.map(item => item.id));
    console.log(`📦 Existing items: ${existingItems.length}`);

    // 3. Read history files for date range
    const dates = getDateRange(days);
    let allEntries = [];

    for (const date of dates) {
        const filepath = join(HISTORY_DIR, `${date}.jsonl`);
        const entries = readJsonlFile(filepath);
        if (entries.length > 0) {
            console.log(`📄 ${date}.jsonl: ${entries.length} entries`);
            allEntries.push(...entries);
        }
    }

    if (allEntries.length === 0) {
        console.log('\n⚠️  No history entries found for the date range.');
        return;
    }

    // 4. Filter OpenClaw-related + score threshold
    const openclawEntries = allEntries.filter(entry => {
        if ((entry.score || 0) < MIN_SCORE) return false;
        return isOpenClawRelated(entry);
    });
    console.log(`\n🎯 OpenClaw-related (score ≥ ${MIN_SCORE}): ${openclawEntries.length} / ${allEntries.length}`);

    // 5. Deduplicate against existing items
    const newEntries = openclawEntries.filter(entry => !existingIds.has(entry.tweet_id));

    // Also dedup within new entries themselves (history can have dupes across days)
    const seenNew = new Set();
    const uniqueNew = newEntries.filter(entry => {
        if (seenNew.has(entry.tweet_id)) return false;
        seenNew.add(entry.tweet_id);
        return true;
    });

    console.log(`✨ New items to add: ${uniqueNew.length}`);

    if (uniqueNew.length === 0) {
        console.log('\n✅ Nothing new to sync.');
        return;
    }

    // 6. Read queue enrichment (engagement stats, why, etc.)
    const enrichment = readQueueEnrichment();
    if (enrichment.size > 0) {
        console.log(`📊 Queue enrichment: ${enrichment.size} entries`);
    }

    // 7. Transform and merge
    const newItems = uniqueNew.map(entry => transformToItem(entry, enrichment));

    // Show preview
    console.log('\n── New items ─────────────────────────────────────');
    for (const item of newItems) {
        console.log(`  [${item.score.toFixed(2)}] ${item.author} — ${item.title.slice(0, 60)}`);
        console.log(`         ${item.tweet_url}`);
    }

    if (dryRun) {
        console.log('\n🏁 Dry run complete. No files written.');
        return;
    }

    // 8. Merge and sort by date desc, then score desc
    const merged = [...existingItems, ...newItems];
    merged.sort((a, b) => {
        const dateCmp = b.date.localeCompare(a.date);
        if (dateCmp !== 0) return dateCmp;
        return (b.score || 0) - (a.score || 0);
    });

    // 9. Write
    writeFileSync(ITEMS_PATH, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
    console.log(`\n✅ Written ${merged.length} items to ${ITEMS_PATH}`);
}

main();
