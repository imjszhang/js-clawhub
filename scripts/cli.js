#!/usr/bin/env node

/**
 * ClawHub CLI — programmatic access to all ClawHub data.
 *
 * Usage:
 *   node scripts/cli.js <command> [options]
 *
 * Commands:
 *   search <keyword> [--type pulse|project|skill|blog|guide]
 *   pulse  [--days N] [--min-score 0.8] [--author @xxx] [--limit N]
 *   stats
 *   projects [--category messaging] [--tag official]
 *   skills   [--category productivity]
 *   blog     [--tag Guide] [--latest N]
 *
 * All output is JSON to stdout. Logs go to stderr.
 */

import { readPulse, readProjects, readSkills, readBlog, readGuide, getStats } from './lib/data-reader.js';
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
  clawhub stats
  clawhub projects --category messaging
  clawhub skills --category productivity
  clawhub blog --latest 3`);
}

// ── Main ─────────────────────────────────────────────────────────────

function main() {
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

main();
