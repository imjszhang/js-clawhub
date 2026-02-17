#!/usr/bin/env node

/**
 * ClawHub CLI — programmatic access to all ClawHub data.
 *
 * Usage:
 *   node cli/cli.js <command> [options]
 *
 * Commands:
 *   search <keyword> [--type pulse|project|skill|blog|guide]
 *   pulse  [--days N] [--min-score 0.8] [--author @xxx] [--limit N]
 *   pulse-edit <id> [--score N] [--js-take-en "..."] [--js-take-zh "..."] ...
 *   pulse-delete <id>
 *   setup-cloudflare   Set up Cloudflare DNS for GitHub Pages
 *   setup-github-pages Configure GitHub Pages custom domain + HTTPS
 *   stats
 *   projects [--category messaging] [--tag official]
 *   skills   [--category productivity]
 *   blog     [--tag Guide] [--latest N]
 *
 * All output is JSON to stdout. Logs go to stderr.
 */

import { readPulse, readProjects, readSkills, readBlog, readGuide, getStats } from './lib/data-reader.js';
import { updatePulseItem, deletePulseItem } from './lib/data-writer.js';
import { setupCloudflare, setupGithubPages } from './lib/setup.js';
import { search } from './lib/search.js';
import { toJson, toStderr } from './lib/formatters.js';

// ── Arg parser ───────────────────────────────────────────────────────

function parseArgs(argv) {
    const args = argv.slice(2); // strip node + script
    const command = args[0] || '';
    const positional = [];
    const flags = {};

    for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const key = arg.slice(2);
            const next = args[i + 1];
            // Peek: if next arg exists and is not a flag, treat it as the value
            if (next && !next.startsWith('--')) {
                flags[key] = next;
                i++;
            } else {
                flags[key] = true; // boolean flag
            }
        } else {
            positional.push(arg);
        }
    }

    return { command, positional, flags };
}

// ── Command handlers ─────────────────────────────────────────────────

function cmdSearch(positional, flags) {
    const keyword = positional[0];
    if (!keyword) {
        toStderr('Error: search requires a keyword argument.');
        toStderr('Usage: clawhub search <keyword> [--type pulse|project|skill|blog|guide]');
        process.exit(1);
    }
    const results = search(keyword, flags.type);
    toJson(results);
}

function cmdPulse(flags) {
    const opts = {};
    if (flags.days) opts.days = parseInt(flags.days, 10);
    if (flags['min-score']) opts.minScore = parseFloat(flags['min-score']);
    if (flags.author) opts.author = flags.author;
    if (flags.limit) opts.limit = parseInt(flags.limit, 10);
    toJson(readPulse(opts));
}

function cmdStats() {
    toJson(getStats());
}

function cmdProjects(flags) {
    const opts = {};
    if (flags.category) opts.category = flags.category;
    if (flags.tag) opts.tag = flags.tag;
    toJson(readProjects(opts));
}

function cmdSkills(flags) {
    const opts = {};
    if (flags.category) opts.category = flags.category;
    toJson(readSkills(opts));
}

function cmdBlog(flags) {
    const opts = {};
    if (flags.tag) opts.tag = flags.tag;
    if (flags.latest) opts.latest = parseInt(flags.latest, 10);
    toJson(readBlog(opts));
}

function cmdPulseEdit(positional, flags) {
    const id = positional[0];
    if (!id) {
        toStderr('Error: pulse-edit requires an item ID.');
        toStderr('Usage: clawhub pulse-edit <id> [--score 0.9] [--js-take-en "text"] ...');
        process.exit(1);
    }

    // Build patch object from flags
    const patch = {};

    // Simple scalar fields
    if (flags.score != null)           patch.score = parseFloat(flags.score);
    if (flags['comment-type'] != null) patch.comment_type = flags['comment-type'];
    if (flags.relevance != null)       patch.relevance = flags.relevance;
    if (flags['suggested-angle'] != null) patch.suggested_angle = flags['suggested-angle'];

    // Bilingual fields: --<field>-en / --<field>-zh → { "en-US": …, "zh-CN": … }
    for (const field of ['js-take', 'title', 'summary']) {
        const en = flags[`${field}-en`];
        const zh = flags[`${field}-zh`];
        if (en != null || zh != null) {
            const key = field.replace('-', '_'); // js-take → js_take
            const obj = {};
            if (en != null) obj['en-US'] = en;
            if (zh != null) obj['zh-CN'] = zh;
            patch[key] = obj;
        }
    }

    if (Object.keys(patch).length === 0) {
        toStderr('Error: no fields to update. Provide at least one --flag.');
        toStderr('Run "clawhub help" for available flags.');
        process.exit(1);
    }

    try {
        const updated = updatePulseItem(id, patch);
        toJson(updated);
    } catch (err) {
        toStderr(`Error: ${err.message}`);
        process.exit(1);
    }
}

function cmdPulseDelete(positional) {
    const id = positional[0];
    if (!id) {
        toStderr('Error: pulse-delete requires an item ID.');
        toStderr('Usage: clawhub pulse-delete <id>');
        process.exit(1);
    }

    try {
        const removed = deletePulseItem(id);
        toJson(removed);
    } catch (err) {
        toStderr(`Error: ${err.message}`);
        process.exit(1);
    }
}

async function cmdSetupCloudflare() {
    try {
        await setupCloudflare();
    } catch (err) {
        toStderr(`Error: ${err.message}`);
        process.exit(1);
    }
}

async function cmdSetupGithubPages() {
    try {
        await setupGithubPages();
    } catch (err) {
        toStderr(`Error: ${err.message}`);
        process.exit(1);
    }
}

// ── Usage ────────────────────────────────────────────────────────────

function printUsage() {
    toStderr(`ClawHub CLI — programmatic access to ClawHub data

Usage:
  clawhub <command> [options]

Commands:
  search <keyword>   Search across all data sources
    --type <type>      Restrict to: pulse|project|skill|blog|guide

  pulse              List Pulse items (X engagement highlights)
    --days <N>         Only items from last N days
    --min-score <N>    Minimum score (0-1)
    --author <handle>  Filter by author
    --limit <N>        Max items to return

  pulse-edit <id>    Edit a Pulse item (auto-backs up before write)
    --score <N>        Update score (0-1)
    --comment-type <t> Update type (add_insight|agree_and_extend|...)
    --js-take-en "t"   Update JS Take (English)
    --js-take-zh "t"   Update JS Take (Chinese)
    --title-en "t"     Update title (English)
    --title-zh "t"     Update title (Chinese)
    --summary-en "t"   Update summary (English)
    --summary-zh "t"   Update summary (Chinese)
    --relevance "t"    Update relevance description
    --suggested-angle "t"  Update suggested angle

  pulse-delete <id>  Delete a Pulse item (auto-backs up before write)

  setup-cloudflare   Set up Cloudflare DNS records for GitHub Pages
                     Requires CLOUDFARE_API_KEY (or CLOUDFLARE_API_TOKEN) in .env

  setup-github-pages Configure GitHub Pages custom domain + enforce HTTPS
                     Requires GITHUB_TOKEN in .env

  stats              Show aggregate site statistics

  projects           List project directory
    --category <id>    Filter by category (messaging|ai-models|productivity|...)
    --tag <tag>        Filter by tag (official|community|...)

  skills             List skills
    --category <cat>   Filter by category

  blog               List blog posts
    --tag <tag>        Filter by tag
    --latest <N>       Only N most recent posts

Examples:
  clawhub search "memory"
  clawhub pulse --days 1 --min-score 0.8
  clawhub pulse-edit 2023439732328525890 --score 0.9 --js-take-zh "新点评"
  clawhub pulse-delete 2023439732328525890
  clawhub setup-cloudflare
  clawhub setup-github-pages
  clawhub stats
  clawhub projects --category messaging
  clawhub skills --category productivity
  clawhub blog --latest 3`);
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
    const { command, positional, flags } = parseArgs(process.argv);

    switch (command) {
        case 'search':
            cmdSearch(positional, flags);
            break;
        case 'pulse':
            cmdPulse(flags);
            break;
        case 'stats':
            cmdStats();
            break;
        case 'projects':
            cmdProjects(flags);
            break;
        case 'skills':
            cmdSkills(flags);
            break;
        case 'blog':
            cmdBlog(flags);
            break;
        case 'pulse-edit':
            cmdPulseEdit(positional, flags);
            break;
        case 'pulse-delete':
            cmdPulseDelete(positional);
            break;
        case 'setup-cloudflare':
            await cmdSetupCloudflare();
            break;
        case 'setup-github-pages':
            await cmdSetupGithubPages();
            break;
        case 'help':
        case '--help':
        case '-h':
        case '':
            printUsage();
            process.exit(command === '' ? 1 : 0);
            break;
        default:
            toStderr(`Error: unknown command "${command}"`);
            toStderr('Run "clawhub help" for usage.');
            process.exit(1);
    }
}

main().catch(err => {
    process.stderr.write(`Error: ${err.message}\n`);
    process.exit(1);
});
