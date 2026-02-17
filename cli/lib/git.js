/**
 * ClawHub Git — git operations for CLI commit and sync commands.
 *
 * All functions use child_process.execFileSync to call git,
 * throwing descriptive errors on failure.
 */

import { execFileSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..', '..');

// ── Low-level helpers ────────────────────────────────────────────────

function git(args) {
    try {
        return execFileSync('git', args, {
            cwd: ROOT,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
        }).trimEnd();
    } catch (err) {
        const stderr = err.stderr?.trim() || err.message;
        throw new Error(`git ${args[0]} failed: ${stderr}`);
    }
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Get current git status.
 * @returns {{ branch: string, clean: boolean, staged: string[], unstaged: string[], untracked: string[] }}
 */
export function gitStatus() {
    const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);

    const porcelain = git(['status', '--porcelain']);
    const lines = porcelain ? porcelain.split('\n') : [];

    const staged = [];
    const unstaged = [];
    const untracked = [];

    for (const line of lines) {
        // Porcelain v1 format: XY<space>PATH  (X=index, Y=worktree)
        const match = line.match(/^(.)(.) (.+)$/);
        if (!match) continue;
        const [, x, y, file] = match;

        if (x === '?' && y === '?') {
            untracked.push(file);
        } else {
            if (x !== ' ' && x !== '?') staged.push(file);
            if (y !== ' ' && y !== '?') unstaged.push(file);
        }
    }

    return {
        branch,
        clean: lines.length === 0,
        staged,
        unstaged,
        untracked,
    };
}

/**
 * Stage files for commit.
 * @param {string[]} paths - File or directory paths to add (relative to repo root)
 */
export function gitAdd(paths) {
    if (!paths || paths.length === 0) {
        throw new Error('gitAdd: no paths provided');
    }
    git(['add', ...paths]);
}

/**
 * Stage all changes (tracked + untracked).
 */
export function gitAddAll() {
    git(['add', '-A']);
}

/**
 * Create a commit with the given message.
 * @param {string} message
 * @returns {{ hash: string, message: string }}
 */
export function gitCommit(message) {
    if (!message || message.trim() === '') {
        throw new Error('gitCommit: empty commit message');
    }
    git(['commit', '-m', message]);
    const hash = git(['rev-parse', '--short', 'HEAD']);
    return { hash, message };
}

/**
 * Push to remote.
 * @param {string} [remote='origin']
 * @param {string} [branch] - Defaults to current branch
 * @param {boolean} [force=false]
 * @returns {{ remote: string, branch: string }}
 */
export function gitPush(remote = 'origin', branch, force = false) {
    if (!branch) {
        branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
    }
    const args = ['push', remote, branch];
    if (force) args.splice(1, 0, '--force');
    git(args);
    return { remote, branch };
}

/**
 * Get diff stats for staged changes.
 * @returns {{ files: string[], summary: string }}
 */
export function gitDiffStat() {
    const stat = git(['diff', '--cached', '--stat']);
    const nameOnly = git(['diff', '--cached', '--name-only']);
    const files = nameOnly ? nameOnly.split('\n') : [];
    return { files, summary: stat };
}

/**
 * Generate a commit message based on changed file paths.
 * Analyzes which areas of the project were modified and produces
 * a descriptive conventional-style message.
 *
 * @param {string[]} files - List of changed file paths
 * @returns {string}
 */
export function generateCommitMessage(files) {
    if (!files || files.length === 0) {
        return 'chore: update files';
    }

    const areas = new Set();
    let hasDocs = false;
    let hasSrc = false;

    for (const f of files) {
        if (f.startsWith('docs/')) {
            hasDocs = true;
        }
        if (f.startsWith('src/')) {
            hasSrc = true;
        }

        if (f.startsWith('src/pulse/') || f.startsWith('docs/pulse/')) {
            areas.add('pulse');
        } else if (f.startsWith('src/blog/') || f.startsWith('docs/blog/')) {
            areas.add('blog');
        } else if (f.startsWith('src/skills/') || f.startsWith('docs/skills/')) {
            areas.add('skills');
        } else if (f.startsWith('src/guide/') || f.startsWith('docs/guide/')) {
            areas.add('guide');
        } else if (f.startsWith('src/shared/') || f.startsWith('docs/shared/')) {
            areas.add('shared');
        } else if (f.startsWith('src/data/') || f.startsWith('docs/data/')) {
            areas.add('data');
        } else if (f.startsWith('cli/')) {
            areas.add('cli');
        } else if (f.startsWith('build/')) {
            areas.add('build');
        }
    }

    // Only docs/ changed (likely a build output update)
    if (hasDocs && !hasSrc && areas.size === 0) {
        return 'build: update site output';
    }

    const areaList = [...areas];

    if (areaList.length === 0) {
        return `chore: update ${files.length} file(s)`;
    }

    if (areaList.length === 1) {
        const area = areaList[0];
        if (hasDocs && hasSrc) {
            return `${area}: update and rebuild`;
        }
        if (hasDocs) {
            return `build: update ${area} output`;
        }
        return `${area}: update`;
    }

    // Multiple areas
    if (hasDocs && hasSrc) {
        return `update ${areaList.join(', ')} and rebuild site`;
    }
    if (hasDocs) {
        return `build: update ${areaList.join(', ')} output`;
    }
    return `update ${areaList.join(', ')}`;
}
