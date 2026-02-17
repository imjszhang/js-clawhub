/**
 * ClawHub Builder — site build logic extracted from build/build.js.
 *
 * Copies src/ to docs/ for GitHub Pages deployment, injects Google Analytics,
 * validates i18n completeness, and returns structured results.
 */

import { cpSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { toStderr } from './formatters.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..', '..');
const SRC = join(ROOT, 'src');
const DOCS = join(ROOT, 'docs');

const GA_ID = 'G-4WV60W6FM6';
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
        toStderr('[1/5] Cleaning docs/ ...');
        if (existsSync(DOCS)) {
            rmSync(DOCS, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
        }
        mkdirSync(DOCS, { recursive: true });
    } else if (dryRun) {
        toStderr('[1/5] Cleaning docs/ ... (skipped: dry-run)');
    } else {
        toStderr('[1/5] Cleaning docs/ ... (skipped: --no-clean)');
    }

    // Step 2: Copy
    let filesCopied = 0;
    if (!dryRun) {
        toStderr('[2/5] Copying src/ → docs/ ...');
        if (!existsSync(DOCS)) {
            mkdirSync(DOCS, { recursive: true });
        }
        cpSync(SRC, DOCS, { recursive: true });
        filesCopied = countFiles(DOCS);
    } else {
        toStderr('[2/5] Copying src/ → docs/ ... (skipped: dry-run)');
        filesCopied = countFiles(SRC);
    }

    // Step 3: .nojekyll
    if (!dryRun) {
        toStderr('[3/5] Creating .nojekyll ...');
        writeFileSync(join(DOCS, '.nojekyll'), '');
    } else {
        toStderr('[3/5] Creating .nojekyll ... (skipped: dry-run)');
    }

    // Step 4: GA injection
    let gaInjected = 0;
    if (!skipGa && !dryRun) {
        toStderr('[4/5] Injecting Google Analytics ...');
        gaInjected = injectGA(DOCS);
        toStderr(`     Injected into ${gaInjected} HTML file(s)`);
    } else {
        toStderr(`[4/5] Injecting Google Analytics ... (skipped${skipGa ? ': --skip-ga' : ': dry-run'})`);
    }

    // Step 5: i18n validation
    let i18nWarnings = [];
    if (!skipI18n) {
        toStderr('[5/5] Validating i18n translations ...');
        i18nWarnings = validateI18n();
        for (const w of i18nWarnings) {
            toStderr(`  ⚠️  Missing "${w.locale}" in ${w.file} → ${w.field}`);
        }
    } else {
        toStderr('[5/5] Validating i18n translations ... (skipped: --skip-i18n)');
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

    return { filesCopied, gaInjected, i18nWarnings, elapsed, dryRun };
}
