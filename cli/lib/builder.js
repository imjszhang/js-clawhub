/**
 * ClawHub Builder — site build logic extracted from build/build.js.
 *
 * Copies src/ to docs/ for GitHub Pages deployment, injects Google Analytics,
 * validates i18n completeness, generates /api/v1/ data layer for agent skills,
 * and returns structured results.
 */

import { cpSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync, readdirSync, unlinkSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { toStderr } from './formatters.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..', '..');
const SRC = join(ROOT, 'src');
const DOCS = join(ROOT, 'docs');
const SITE_URL = 'https://js-clawhub.com';

const GA_ID = 'G-DL14E140EC';
const GA_SNIPPET = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${GA_ID}');
</script>`;

const BILINGUAL_FIELDS = {
    'data/navigation.json': {
        'featured[].desc': true,
        'featured[].jsComment': true,
        'categories[].name': true,
        'categories[].items[].desc': true,
        'recommendations[].text': true,
        'recommendations[].project': true,
    },
    'blog/posts/index.json': {
        '[].title': true,
        '[].summary': true,
    },
    'skills/data/index.json': {
        '[].desc': true,
    },
    'guide/data/index.json': {
        '[].title': true,
    },
    'gallery/data/index.json': {
        '[].title': true,
        '[].description': true,
    },
};

const LOCALES = ['zh-CN', 'en-US'];

// ── Internal helpers ─────────────────────────────────────────────────

function countFiles(dir) {
    let count = 0;
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            count += countFiles(fullPath);
        } else {
            count++;
        }
    }
    return count;
}

function injectGA(dir) {
    let count = 0;
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            count += injectGA(fullPath);
        } else if (entry.name.endsWith('.html')) {
            let html = readFileSync(fullPath, 'utf-8');
            if (!html.includes('googletagmanager.com') && html.includes('</head>')) {
                html = html.replace('</head>', `${GA_SNIPPET}\n</head>`);
                writeFileSync(fullPath, html, 'utf-8');
                count++;
            }
        }
    }
    return count;
}

function validateBilingualField(value, fieldPath, filePath, warnings) {
    if (value === null || value === undefined) return;
    if (typeof value === 'string') return;

    if (typeof value === 'object' && !Array.isArray(value)) {
        for (const loc of LOCALES) {
            if (!value[loc] || (typeof value[loc] === 'string' && value[loc].trim() === '')) {
                warnings.push({ locale: loc, file: filePath, field: fieldPath });
            }
        }
    }
}

function validateArrayField(arr, fieldName, filePath, warnings) {
    if (!Array.isArray(arr)) return;
    arr.forEach((item, idx) => {
        if (item && typeof item === 'object' && fieldName in item) {
            if (filePath === 'blog/posts/index.json' && item.series) return;
            validateBilingualField(item[fieldName], `[${idx}].${fieldName}`, filePath, warnings);
        }
    });
}

function validateI18n() {
    const warnings = [];

    for (const [relPath, fields] of Object.entries(BILINGUAL_FIELDS)) {
        const fullPath = join(SRC, relPath);
        if (!existsSync(fullPath)) {
            warnings.push({ locale: '-', file: relPath, field: 'FILE_NOT_FOUND' });
            continue;
        }

        const data = JSON.parse(readFileSync(fullPath, 'utf-8'));

        for (const fieldSpec of Object.keys(fields)) {
            const parts = fieldSpec.split('.');
            let current = data;

            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];

                if (part.endsWith('[]')) {
                    const key = part.slice(0, -2);
                    const arr = key ? current[key] : current;
                    if (Array.isArray(arr)) {
                        const remainingPath = parts.slice(i + 1).join('.');
                        if (remainingPath.includes('[]')) {
                            arr.forEach(item => {
                                const subParts = remainingPath.split('.');
                                const subKey = subParts[0].endsWith('[]') ? subParts[0].slice(0, -2) : subParts[0];
                                const finalField = subParts[subParts.length - 1];
                                if (item[subKey]) {
                                    validateArrayField(item[subKey], finalField, relPath, warnings);
                                }
                            });
                        } else {
                            validateArrayField(arr, remainingPath, relPath, warnings);
                        }
                    }
                    break;
                } else {
                    current = current[part];
                    if (!current) break;
                }
            }
        }
    }

    return warnings;
}

// ── Blog import artifacts cleanup ────────────────────────────────────

const BLOG_IMPORT_ARTIFACTS = [
    'blog/sources.json',
    'blog/import-manifest.json',
];

function cleanBlogImportArtifacts() {
    for (const rel of BLOG_IMPORT_ARTIFACTS) {
        const fullPath = join(DOCS, rel);
        if (existsSync(fullPath)) {
            unlinkSync(fullPath);
        }
    }
}

// ── Pulse data sanitization ──────────────────────────────────────────

const PULSE_INTERNAL_FIELDS = ['suggested_angle'];

function stripInternalFields(item) {
    const clean = { ...item };
    for (const f of PULSE_INTERNAL_FIELDS) delete clean[f];
    return clean;
}

function sanitizePulseDataInDocs() {
    const paths = [
        join(DOCS, 'pulse', 'data', 'items.json'),
        join(DOCS, 'pulse', 'data', 'pulse_stats.json'),
    ];

    for (const p of paths) {
        if (!existsSync(p)) continue;
        const raw = JSON.parse(readFileSync(p, 'utf-8'));

        if (Array.isArray(raw)) {
            writeFileSync(p, JSON.stringify(raw.map(stripInternalFields), null, 2), 'utf-8');
        } else if (raw.this_week?.top_items) {
            raw.this_week.top_items = raw.this_week.top_items.map(stripInternalFields);
            writeFileSync(p, JSON.stringify(raw, null, 2), 'utf-8');
        }
    }
}

// ── API layer generation ─────────────────────────────────────────────

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

function generateApiLayer() {
    const apiDir = join(DOCS, 'api', 'v1');
    const dirs = [
        apiDir,
        join(apiDir, 'skills'),
        join(apiDir, 'blog'),
        join(apiDir, 'guide'),
        join(apiDir, 'pulse'),
    ];
    for (const d of dirs) mkdirSync(d, { recursive: true });

    let fileCount = 0;

    // projects.json — full navigation data
    cpSync(join(SRC, 'data', 'navigation.json'), join(apiDir, 'projects.json'));
    fileCount++;

    // stats.json — extracted stats field
    const nav = JSON.parse(readFileSync(join(SRC, 'data', 'navigation.json'), 'utf-8'));
    writeFileSync(join(apiDir, 'stats.json'), JSON.stringify(nav.stats, null, 2), 'utf-8');
    fileCount++;

    // featured.json — homepage curated content
    const featuredSrc = join(SRC, 'data', 'featured.json');
    if (existsSync(featuredSrc)) {
        cpSync(featuredSrc, join(apiDir, 'featured.json'));
        fileCount++;
    }

    // skills.json + skill markdown docs
    cpSync(join(SRC, 'skills', 'data', 'index.json'), join(apiDir, 'skills.json'));
    fileCount++;
    fileCount += copyMdFiles(join(SRC, 'skills', 'data'), join(apiDir, 'skills'));

    // blog/index.json + blog post markdown
    cpSync(join(SRC, 'blog', 'posts', 'index.json'), join(apiDir, 'blog', 'index.json'));
    fileCount++;
    fileCount += copyMdFiles(join(SRC, 'blog', 'posts'), join(apiDir, 'blog'));

    // guide/index.json + guide markdown
    cpSync(join(SRC, 'guide', 'data', 'index.json'), join(apiDir, 'guide', 'index.json'));
    fileCount++;
    fileCount += copyMdFiles(join(SRC, 'guide', 'data'), join(apiDir, 'guide'));

    // pulse/latest.json — compact stats (strip internal fields from top_items)
    const statsRaw = JSON.parse(readFileSync(join(SRC, 'pulse', 'data', 'pulse_stats.json'), 'utf-8'));
    if (statsRaw.this_week?.top_items) {
        statsRaw.this_week.top_items = statsRaw.this_week.top_items.map(stripInternalFields);
    }
    writeFileSync(join(apiDir, 'pulse', 'latest.json'), JSON.stringify(statsRaw, null, 2), 'utf-8');
    fileCount++;

    // pulse/week.json — this week's items only (strip internal fields)
    const allItems = JSON.parse(readFileSync(join(SRC, 'pulse', 'data', 'items.json'), 'utf-8'));
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekItems = allItems
        .filter(item => new Date(item.date) >= weekAgo)
        .map(stripInternalFields);
    writeFileSync(join(apiDir, 'pulse', 'week.json'), JSON.stringify(weekItems, null, 2), 'utf-8');
    fileCount++;

    // gallery/index.json + gallery images
    const gallerySrc = join(SRC, 'gallery', 'data', 'index.json');
    if (existsSync(gallerySrc)) {
        const galleryApiDir = join(apiDir, 'gallery');
        mkdirSync(galleryApiDir, { recursive: true });
        cpSync(gallerySrc, join(galleryApiDir, 'index.json'));
        fileCount++;
    }

    // craft/ — methodology guide + scaffold + templates
    const craftSrc = join(SRC, 'craft');
    if (existsSync(craftSrc)) {
        const craftDest = join(apiDir, 'craft');
        cpSync(craftSrc, craftDest, { recursive: true });
        fileCount += countFiles(craftDest);
    }

    return fileCount;
}

// ── Sitemap generation ───────────────────────────────────────────────

function generateSitemap() {
    const today = new Date().toISOString().split('T')[0];

    const blogPosts = JSON.parse(readFileSync(join(SRC, 'blog', 'posts', 'index.json'), 'utf-8'));
    const skills = JSON.parse(readFileSync(join(SRC, 'skills', 'data', 'index.json'), 'utf-8'));

    const galleryFile = join(SRC, 'gallery', 'data', 'index.json');
    const galleryItems = existsSync(galleryFile) ? JSON.parse(readFileSync(galleryFile, 'utf-8')) : [];

    const latestBlogDate = blogPosts.length ? blogPosts[0].date : today;
    const latestSkillDate = skills.length
        ? skills.reduce((max, s) => s.date > max ? s.date : max, skills[0].date)
        : today;
    const latestGalleryDate = galleryItems.length
        ? galleryItems.reduce((max, g) => (g.createdAt || '') > max ? g.createdAt : max, galleryItems[0].createdAt || today)
        : today;
    const latestDate = [latestBlogDate, latestSkillDate].reduce((max, d) => d > max ? d : max);

    const urls = [
        { loc: '/', lastmod: latestDate, changefreq: 'weekly', priority: '1.0' },
        { loc: '/blog/', lastmod: latestBlogDate, changefreq: 'weekly', priority: '0.8' },
        { loc: '/skills/', lastmod: latestSkillDate, changefreq: 'weekly', priority: '0.8' },
        { loc: '/guide/', lastmod: today, changefreq: 'monthly', priority: '0.8' },
        { loc: '/pulse/', lastmod: today, changefreq: 'daily', priority: '0.7' },
        { loc: '/projects/', lastmod: today, changefreq: 'monthly', priority: '0.7' },
        { loc: '/gallery/', lastmod: latestGalleryDate, changefreq: 'weekly', priority: '0.7' },
    ];

    for (const item of galleryItems) {
        urls.push({
            loc: `/gallery/detail.html?id=${item.id}`,
            lastmod: item.createdAt || today,
            changefreq: 'monthly',
            priority: '0.6',
        });
    }

    for (const post of blogPosts) {
        urls.push({
            loc: `/blog/post.html?slug=${post.slug}`,
            lastmod: post.date,
            changefreq: 'monthly',
            priority: '0.6',
        });
    }

    for (const skill of skills) {
        urls.push({
            loc: `/skills/detail.html?slug=${skill.slug}`,
            lastmod: skill.date,
            changefreq: 'monthly',
            priority: '0.6',
        });
    }

    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls.map(u => [
            '  <url>',
            `    <loc>${SITE_URL}${u.loc}</loc>`,
            `    <lastmod>${u.lastmod}</lastmod>`,
            `    <changefreq>${u.changefreq}</changefreq>`,
            `    <priority>${u.priority}</priority>`,
            '  </url>',
        ].join('\n')),
        '</urlset>',
        '',
    ].join('\n');

    writeFileSync(join(DOCS, 'sitemap.xml'), xml, 'utf-8');
    return urls.length;
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Build the site: copy src/ to docs/, inject GA, validate i18n.
 *
 * @param {Object} [options]
 * @param {boolean} [options.clean=true]    Remove docs/ before copying
 * @param {boolean} [options.skipGa=false]  Skip Google Analytics injection
 * @param {boolean} [options.skipI18n=false] Skip i18n validation
 * @param {boolean} [options.dryRun=false]  Only validate, don't write files
 * @returns {{ filesCopied: number, gaInjected: number, i18nWarnings: Array, elapsed: number }}
 */
export function build(options = {}) {
    const { clean = true, skipGa = false, skipI18n = false, dryRun = false } = options;
    const start = Date.now();

    toStderr('\n🔧 JS ClawHub Build');
    toStderr('='.repeat(50));

    if (dryRun) {
        toStderr('[dry-run] No files will be written.\n');
    }

    // Step 1: Clean (maxRetries handles IDE file-watcher race conditions)
    if (clean && !dryRun) {
        toStderr('[1/8] Cleaning docs/ ...');
        if (existsSync(DOCS)) {
            rmSync(DOCS, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
        }
        mkdirSync(DOCS, { recursive: true });
    } else if (dryRun) {
        toStderr('[1/8] Cleaning docs/ ... (skipped: dry-run)');
    } else {
        toStderr('[1/8] Cleaning docs/ ... (skipped: --no-clean)');
    }

    // Step 2: Copy
    let filesCopied = 0;
    if (!dryRun) {
        toStderr('[2/8] Copying src/ → docs/ ...');
        if (!existsSync(DOCS)) {
            mkdirSync(DOCS, { recursive: true });
        }
        cpSync(SRC, DOCS, { recursive: true });
        cleanBlogImportArtifacts();
        filesCopied = countFiles(DOCS);
    } else {
        toStderr('[2/8] Copying src/ → docs/ ... (skipped: dry-run)');
        filesCopied = countFiles(SRC);
    }

    // Step 3: .nojekyll
    if (!dryRun) {
        toStderr('[3/8] Creating .nojekyll ...');
        writeFileSync(join(DOCS, '.nojekyll'), '');
    } else {
        toStderr('[3/8] Creating .nojekyll ... (skipped: dry-run)');
    }

    // Step 4: GA injection
    let gaInjected = 0;
    if (!skipGa && !dryRun) {
        toStderr('[4/8] Injecting Google Analytics ...');
        gaInjected = injectGA(DOCS);
        toStderr(`     Injected into ${gaInjected} HTML file(s)`);
    } else {
        toStderr(`[4/8] Injecting Google Analytics ... (skipped${skipGa ? ': --skip-ga' : ': dry-run'})`);
    }

    // Step 5: i18n validation
    let i18nWarnings = [];
    if (!skipI18n) {
        toStderr('[5/8] Validating i18n translations ...');
        i18nWarnings = validateI18n();
        for (const w of i18nWarnings) {
            toStderr(`  ⚠️  Missing "${w.locale}" in ${w.file} → ${w.field}`);
        }
    } else {
        toStderr('[5/8] Validating i18n translations ... (skipped: --skip-i18n)');
    }

    // Step 6: Sanitize pulse data (strip internal fields from public output)
    if (!dryRun) {
        toStderr('[6/8] Sanitizing pulse data ...');
        sanitizePulseDataInDocs();
    } else {
        toStderr('[6/8] Sanitizing pulse data ... (skipped: dry-run)');
    }

    // Step 7: Generate API layer for agent skills
    let apiFiles = 0;
    if (!dryRun) {
        toStderr('[7/8] Generating API layer (api/v1/) ...');
        apiFiles = generateApiLayer();
        toStderr(`      Generated ${apiFiles} file(s) in api/v1/`);
    } else {
        toStderr('[7/8] Generating API layer ... (skipped: dry-run)');
    }

    // Step 8: Generate sitemap.xml from content indexes
    let sitemapUrls = 0;
    if (!dryRun) {
        toStderr('[8/8] Generating sitemap.xml ...');
        sitemapUrls = generateSitemap();
        toStderr(`      ${sitemapUrls} URL(s) in sitemap.xml`);
    } else {
        toStderr('[8/8] Generating sitemap.xml ... (skipped: dry-run)');
    }

    // Summary
    const elapsed = Date.now() - start;
    toStderr('='.repeat(50));
    if (i18nWarnings.length > 0) {
        toStderr(`⚠️  Build complete with ${i18nWarnings.length} translation warning(s).`);
    } else {
        toStderr('✅ Build complete. No translation issues found.');
    }
    toStderr(`📁 Output: docs/`);
    toStderr(`⏱  ${elapsed}ms\n`);

    return { filesCopied, gaInjected, i18nWarnings, apiFiles, sitemapUrls, elapsed, dryRun };
}
