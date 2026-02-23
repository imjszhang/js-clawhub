#!/usr/bin/env node

/**
 * ClawHub CLI — programmatic access to all ClawHub data, build, and deploy.
 *
 * Usage:
 *   node cli/cli.js <command> [options]
 *
 * Commands:
 *   search <keyword> [--type pulse|project|skill|blog|guide]
 *   pulse  [--days N] [--min-score 0.8] [--author @xxx] [--limit N]
 *   pulse-edit <id> [--score N] [--js-take-en "..."] [--js-take-zh "..."] ...
 *   pulse-delete <id> [--reason "..."]
 *   pulse-restore <id>
 *   pulse-excluded
 *   featured [list|set|clear] [section] [ids]
 *   build  [--skip-ga] [--skip-i18n] [--dry-run] [--no-clean]
 *   commit [--message "..."] [--all] [--scope <area>]
 *   sync   [--no-build] [--no-push] [--message "..."] [--dry-run]
 *   pull   [--source <path>] [--type pulse|weekly|all] [--no-build] [--no-push] [--dry-run]
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
import { updatePulseItem, deletePulseItem, restoreItem, getExcludedIds } from './lib/data-writer.js';
import { listFeatured, setFeatured, clearFeatured } from './lib/featured.js';
import { setupCloudflare, setupGithubPages } from './lib/setup.js';
import { search } from './lib/search.js';
import { build } from './lib/builder.js';
import { gitStatus, gitAdd, gitAddAll, gitCommit, gitPush, gitDiffStat, generateCommitMessage } from './lib/git.js';
import { toJson, toStderr } from './lib/formatters.js';
import { pull } from './lib/puller.js';

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

function cmdPulseDelete(positional, flags) {
    const id = positional[0];
    if (!id) {
        toStderr('Error: pulse-delete requires an item ID.');
        toStderr('Usage: clawhub pulse-delete <id> [--reason "..."]');
        process.exit(1);
    }

    try {
        const reason = flags.reason || '';
        const removed = deletePulseItem(id, reason);
        toJson(removed);
    } catch (err) {
        toStderr(`Error: ${err.message}`);
        process.exit(1);
    }
}

function cmdPulseRestore(positional) {
    const id = positional[0];
    if (!id) {
        toStderr('Error: pulse-restore requires an item ID.');
        toStderr('Usage: clawhub pulse-restore <id>');
        process.exit(1);
    }

    try {
        const restored = restoreItem(id);
        if (restored) {
            toJson({ restored: true, id });
        } else {
            toJson({ restored: false, id, reason: 'Item not found in edited_items registry' });
        }
    } catch (err) {
        toStderr(`Error: ${err.message}`);
        process.exit(1);
    }
}

function cmdPulseExcluded() {
    try {
        const excludedIds = getExcludedIds();
        toJson({ 
            count: excludedIds.length,
            ids: excludedIds
        });
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

// ── Featured commands ────────────────────────────────────────────────

function cmdFeatured(positional) {
    const subcommand = positional[0] || 'list';

    if (subcommand === 'list' || positional.length === 0) {
        toJson(listFeatured());
        return;
    }

    if (subcommand === 'set') {
        const section = positional[1];
        const idsStr = positional[2];
        if (!section || !idsStr) {
            toStderr('Error: featured set requires <section> <id1,id2,...>');
            toStderr('Usage: clawhub featured set projects OpenClaw,"ClawHub Skills"');
            toStderr('       clawhub featured set guide what-is-openclaw,installation');
            toStderr('       clawhub featured set blog welcome-to-clawhub');
            process.exit(1);
        }
        const ids = idsStr.split(',').map(s => s.trim()).filter(Boolean);
        try {
            const result = setFeatured(section, ids);
            toJson(result);
        } catch (err) {
            toStderr(`Error: ${err.message}`);
            process.exit(1);
        }
        return;
    }

    if (subcommand === 'clear') {
        const section = positional[1];
        if (!section) {
            toStderr('Error: featured clear requires <section>');
            toStderr('Usage: clawhub featured clear projects');
            process.exit(1);
        }
        try {
            const result = clearFeatured(section);
            toJson(result);
        } catch (err) {
            toStderr(`Error: ${err.message}`);
            process.exit(1);
        }
        return;
    }

    toStderr(`Error: unknown featured subcommand "${subcommand}"`);
    toStderr('Usage: clawhub featured [list|set|clear]');
    process.exit(1);
}

// ── Build / Git commands ─────────────────────────────────────────────

function cmdBuild(flags) {
    try {
        const result = build({
            clean: !flags['no-clean'],
            skipGa: !!flags['skip-ga'],
            skipI18n: !!flags['skip-i18n'],
            dryRun: !!flags['dry-run'],
        });
        toJson(result);
    } catch (err) {
        toStderr(`Error: ${err.message}`);
        process.exit(1);
    }
}

function cmdCommit(flags) {
    try {
        // Check current status
        const status = gitStatus();
        if (status.clean) {
            toStderr('Nothing to commit — working tree clean.');
            toJson({ committed: false, reason: 'clean' });
            return;
        }

        // Stage files
        if (flags.all) {
            toStderr('Staging all changes ...');
            gitAddAll();
        } else if (flags.scope) {
            const scopeDirs = [`src/${flags.scope}/`, `docs/${flags.scope}/`];
            toStderr(`Staging scope: ${scopeDirs.join(', ')} ...`);
            gitAdd(scopeDirs);
        } else {
            toStderr('Staging all changes ...');
            gitAddAll();
        }

        // Generate or use provided message
        const { files } = gitDiffStat();
        if (files.length === 0) {
            toStderr('Nothing staged to commit after add.');
            toJson({ committed: false, reason: 'nothing_staged' });
            return;
        }

        const message = flags.message || flags.m || generateCommitMessage(files);
        toStderr(`Committing: ${message}`);
        const { hash } = gitCommit(message);

        toJson({
            committed: true,
            hash,
            message,
            files,
            branch: status.branch,
        });
    } catch (err) {
        toStderr(`Error: ${err.message}`);
        process.exit(1);
    }
}

function cmdSync(flags) {
    try {
        const dryRun = !!flags['dry-run'];
        const noBuild = !!flags['no-build'];
        const noPush = !!flags['no-push'];
        const result = { build: null, commit: null, push: null };

        // Step 1: Check git status
        const status = gitStatus();
        toStderr(`Branch: ${status.branch}`);

        // Step 2: Build (unless --no-build)
        if (!noBuild) {
            toStderr('\n── Build ──');
            result.build = build({
                clean: true,
                skipGa: false,
                skipI18n: false,
                dryRun,
            });
        } else {
            toStderr('Build skipped (--no-build)');
        }

        if (dryRun) {
            toStderr('\n[dry-run] Skipping commit and push.');
            toJson({ ...result, dryRun: true });
            return;
        }

        // Step 3: Stage all changes
        toStderr('\n── Stage ──');
        gitAddAll();

        // Step 4: Commit
        const { files } = gitDiffStat();
        if (files.length === 0) {
            toStderr('Nothing to commit — all clean after build.');
            toJson({ ...result, commit: { committed: false, reason: 'clean' } });
            return;
        }

        const message = flags.message || flags.m || generateCommitMessage(files);
        toStderr(`\n── Commit ──`);
        toStderr(`Message: ${message}`);
        const { hash } = gitCommit(message);
        result.commit = { committed: true, hash, message, files };

        // Step 5: Push (unless --no-push)
        if (!noPush) {
            toStderr(`\n── Push ──`);
            toStderr(`Pushing to origin/${status.branch} ...`);
            const pushResult = gitPush('origin', status.branch);
            result.push = pushResult;
            toStderr('Push complete.');
        } else {
            toStderr('\nPush skipped (--no-push)');
        }

        toJson(result);
    } catch (err) {
        toStderr(`Error: ${err.message}`);
        process.exit(1);
    }
}

// ── Pull command ─────────────────────────────────────────────────────

function cmdPull(flags) {
    try {
        const dryRun = !!flags['dry-run'];
        const noBuild = !!flags['no-build'];
        const noPush = !!flags['no-push'];
        const type = flags.type || 'all';
        const source = flags.source || undefined;

        const pullResult = pull({ source, type, dryRun });

        if (dryRun) {
            toJson({ ...pullResult, dryRun: true });
            return;
        }

        const hasChanges = (pullResult.pulse?.items > 0) || (pullResult.weekly?.files > 0);

        if (!hasChanges) {
            toStderr('\nNo new data pulled.');
            toJson({ ...pullResult, build: null, commit: null, push: null });
            return;
        }

        const result = { ...pullResult, build: null, commit: null, push: null };

        if (!noBuild) {
            toStderr('\n── Build ──');
            result.build = build({ clean: true });
        }

        toStderr('\n── Stage ──');
        gitAddAll();

        const { files } = gitDiffStat();
        if (files.length === 0) {
            toStderr('Nothing to commit after pull + build.');
            toJson({ ...result, commit: { committed: false, reason: 'clean' } });
            return;
        }

        const message = flags.message || flags.m || generateCommitMessage(files);
        toStderr(`\n── Commit ──`);
        toStderr(`Message: ${message}`);
        const { hash } = gitCommit(message);
        result.commit = { committed: true, hash, message, files };

        if (!noPush) {
            toStderr('\n── Push ──');
            const status = gitStatus();
            const pushResult = gitPush('origin', status.branch);
            result.push = pushResult;
            toStderr('Push complete.');
        } else {
            toStderr('\nPush skipped (--no-push)');
        }

        toJson(result);
    } catch (err) {
        toStderr(`Error: ${err.message}`);
        process.exit(1);
    }
}

// ── Usage ────────────────────────────────────────────────────────────

function printUsage() {
    toStderr(`ClawHub CLI — programmatic access to ClawHub data, build, and deploy

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

  pulse-delete <id>  Delete a Pulse item (registers in edited_items.json)
    --reason "text"    Optional reason for deletion

  pulse-restore <id> Restore a deleted/edited item (remove from edited_items.json)

  pulse-excluded     List all IDs excluded from sync (deleted or edited)

  featured           Manage homepage featured/curated content
  featured list      Show current featured selections (default)
  featured set <section> <ids>
                     Set featured items for a section (projects|guide|blog)
                     IDs are comma-separated names (projects) or slugs (guide/blog)
  featured clear <section>
                     Clear all featured items in a section

  build              Build site: copy src/ to docs/, inject GA, validate i18n
    --skip-ga          Skip Google Analytics injection
    --skip-i18n        Skip i18n translation validation
    --dry-run          Validate only, don't write files
    --no-clean         Don't remove docs/ before copying

  commit             Stage and commit changes with auto-generated message
    --message "msg"    Use custom commit message (alias: --m)
    --all              Stage all changes (default)
    --scope <area>     Only stage src/<area>/ and docs/<area>/

  sync               Build + commit + push in one step
    --no-build         Skip build step
    --no-push          Skip push step (build + commit only)
    --message "msg"    Use custom commit message
    --dry-run          Show what would happen without making changes

  pull               Pull data from js-moltbook, build + commit + push
    --source <path>    Path to js-moltbook publisher output (default: ../js-moltbook/...)
    --type <type>      What to pull: pulse|weekly|all (default: all)
    --no-build         Skip build step after pull
    --no-push          Skip push step (pull + build + commit only)
    --message "msg"    Use custom commit message
    --dry-run          Preview what would be pulled without writing

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
  clawhub build
  clawhub build --dry-run
  clawhub commit --message "pulse: add new items"
  clawhub sync
  clawhub sync --no-push --message "update pulse data"
  clawhub pull
  clawhub pull --type pulse --no-push
  clawhub pull --dry-run
  clawhub setup-cloudflare
  clawhub setup-github-pages
  clawhub featured
  clawhub featured set projects "OpenClaw,ClawHub Skills,Mac Mini"
  clawhub featured set guide what-is-openclaw,installation
  clawhub featured set blog welcome-to-clawhub
  clawhub featured clear blog
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
            cmdPulseDelete(positional, flags);
            break;
        case 'pulse-restore':
            cmdPulseRestore(positional);
            break;
        case 'pulse-excluded':
            cmdPulseExcluded();
            break;
        case 'featured':
            cmdFeatured(positional);
            break;
        case 'setup-cloudflare':
            await cmdSetupCloudflare();
            break;
        case 'setup-github-pages':
            await cmdSetupGithubPages();
            break;
        case 'build':
            cmdBuild(flags);
            break;
        case 'commit':
            cmdCommit(flags);
            break;
        case 'sync':
            cmdSync(flags);
            break;
        case 'pull':
            cmdPull(flags);
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
