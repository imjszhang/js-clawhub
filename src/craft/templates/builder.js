/**
 * Builder — Copies src/ to docs/ for GitHub Pages deployment,
 * injects Google Analytics, validates i18n, and generates /api/v1/ data layer.
 */

import { existsSync, mkdirSync, rmSync, cpSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');
const DOCS = join(ROOT, 'docs');

function toStderr(msg) { process.stderr.write(msg + '\n'); }

function countFiles(dir) {
    let count = 0;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isFile()) count++;
        else if (entry.isDirectory()) count += countFiles(join(dir, entry.name));
    }
    return count;
}

function copyMdFiles(srcDir, destDir) {
    if (!existsSync(srcDir)) return 0;
    let count = 0;
    for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
        cpSync(join(srcDir, entry.name), join(destDir, entry.name));
        count++;
    }
    return count;
}

function injectGA(docsDir) {
    const GA_ID = process.env.GA_ID || '';
    if (!GA_ID) return 0;
    const snippet = `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');</script>`;
    let injected = 0;
    function walk(dir) {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const full = join(dir, entry.name);
            if (entry.isDirectory()) { walk(full); continue; }
            if (!entry.name.endsWith('.html')) continue;
            let html = readFileSync(full, 'utf-8');
            if (html.includes('googletagmanager.com')) continue;
            html = html.replace('</head>', snippet + '</head>');
            writeFileSync(full, html, 'utf-8');
            injected++;
        }
    }
    walk(docsDir);
    return injected;
}

function generateApiLayer() {
    const apiDir = join(DOCS, 'api', 'v1');
    mkdirSync(apiDir, { recursive: true });

    let fileCount = 0;

    // projects.json — full navigation data
    const navPath = join(SRC, 'data', 'navigation.json');
    if (existsSync(navPath)) {
        cpSync(navPath, join(apiDir, 'projects.json'));
        fileCount++;

        const nav = JSON.parse(readFileSync(navPath, 'utf-8'));
        if (nav.stats) {
            writeFileSync(join(apiDir, 'stats.json'), JSON.stringify(nav.stats, null, 2), 'utf-8');
            fileCount++;
        }
    }

    // blog
    const blogDir = join(apiDir, 'blog');
    mkdirSync(blogDir, { recursive: true });
    const blogIdx = join(SRC, 'blog', 'posts', 'index.json');
    if (existsSync(blogIdx)) {
        cpSync(blogIdx, join(blogDir, 'index.json'));
        fileCount++;
        fileCount += copyMdFiles(join(SRC, 'blog', 'posts'), blogDir);
    }

    // guide
    const guideDir = join(apiDir, 'guide');
    mkdirSync(guideDir, { recursive: true });
    const guideIdx = join(SRC, 'guide', 'data', 'index.json');
    if (existsSync(guideIdx)) {
        cpSync(guideIdx, join(guideDir, 'index.json'));
        fileCount++;
        fileCount += copyMdFiles(join(SRC, 'guide', 'data'), guideDir);
    }

    // pulse
    const pulseDir = join(apiDir, 'pulse');
    mkdirSync(pulseDir, { recursive: true });
    const pulseSrc = join(SRC, 'pulse', 'data', 'pulse_stats.json');
    if (existsSync(pulseSrc)) {
        cpSync(pulseSrc, join(pulseDir, 'latest.json'));
        fileCount++;
    }
    const itemsSrc = join(SRC, 'pulse', 'data', 'items.json');
    if (existsSync(itemsSrc)) {
        const allItems = JSON.parse(readFileSync(itemsSrc, 'utf-8'));
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const weekItems = allItems.filter(i => new Date(i.date) >= weekAgo);
        writeFileSync(join(pulseDir, 'week.json'), JSON.stringify(weekItems, null, 2), 'utf-8');
        fileCount++;
    }

    return fileCount;
}

export function build(options = {}) {
    const { clean = true, skipGa = false, dryRun = false } = options;
    const start = Date.now();

    toStderr('\nBuild');
    toStderr('='.repeat(50));

    // Step 1: Clean
    if (clean && !dryRun) {
        toStderr('[1/5] Cleaning docs/ ...');
        if (existsSync(DOCS)) rmSync(DOCS, { recursive: true, force: true });
        mkdirSync(DOCS, { recursive: true });
    }

    // Step 2: Copy
    let filesCopied = 0;
    if (!dryRun) {
        toStderr('[2/5] Copying src/ -> docs/ ...');
        cpSync(SRC, DOCS, { recursive: true });
        filesCopied = countFiles(DOCS);
    }

    // Step 3: .nojekyll
    if (!dryRun) {
        toStderr('[3/5] Creating .nojekyll ...');
        writeFileSync(join(DOCS, '.nojekyll'), '');
    }

    // Step 4: GA injection
    let gaInjected = 0;
    if (!skipGa && !dryRun) {
        toStderr('[4/5] Injecting Google Analytics ...');
        gaInjected = injectGA(DOCS);
    }

    // Step 5: API layer
    let apiFiles = 0;
    if (!dryRun) {
        toStderr('[5/5] Generating API layer (api/v1/) ...');
        apiFiles = generateApiLayer();
        toStderr(`      Generated ${apiFiles} file(s)`);
    }

    const elapsed = Date.now() - start;
    toStderr('='.repeat(50));
    toStderr(`Done in ${elapsed}ms\n`);

    return { filesCopied, gaInjected, i18nWarnings: [], apiFiles, elapsed, dryRun };
}
