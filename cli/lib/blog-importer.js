/**
 * ClawHub Blog Importer — import Markdown content from external projects
 * into the blog, with content transformation and dedup tracking.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { toStderr } from './formatters.js';
import { createHttpCaller, loadApiConfig } from './ai-caller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = join(__dirname, '..', '..');
const SRC = join(PROJECT_ROOT, 'src');
const BLOG_DIR = join(SRC, 'blog');
const POSTS_DIR = join(BLOG_DIR, 'posts');
const SOURCES_FILE = join(BLOG_DIR, 'sources.json');
const MANIFEST_FILE = join(BLOG_DIR, 'import-manifest.json');

// ── Helpers ──────────────────────────────────────────────────────────

function readJson(filepath) {
    if (!existsSync(filepath)) return null;
    try {
        return JSON.parse(readFileSync(filepath, 'utf-8'));
    } catch {
        return null;
    }
}

function sha256(content) {
    return createHash('sha256').update(content, 'utf-8').digest('hex');
}

function loadSources() {
    const data = readJson(SOURCES_FILE);
    if (!data || typeof data !== 'object') {
        throw new Error(`Sources file not found or invalid: ${SOURCES_FILE}`);
    }
    return data;
}

function loadManifest() {
    return readJson(MANIFEST_FILE) || {};
}

function saveManifest(manifest) {
    writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
}

function loadBlogIndex() {
    return readJson(join(POSTS_DIR, 'index.json')) || [];
}

function saveBlogIndex(index) {
    writeFileSync(join(POSTS_DIR, 'index.json'), JSON.stringify(index, null, 2) + '\n', 'utf-8');
}

/**
 * Resolve the source path. Supports both absolute and relative paths.
 * Relative paths are resolved from the PROJECT_ROOT.
 */
function resolveSourcePath(sourcePath) {
    return resolve(PROJECT_ROOT, sourcePath);
}

// ── Content Transformation Pipeline ──────────────────────────────────

/**
 * Parse YAML frontmatter from markdown content.
 * Returns { frontmatter: Object, body: string }.
 */
function parseFrontmatter(content) {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) return { frontmatter: {}, body: content };

    const raw = match[1];
    const body = match[2];

    const fm = {};
    for (const line of raw.split('\n')) {
        const kv = line.match(/^(\w+):\s*(.+)$/);
        if (kv) fm[kv[1]] = kv[2].trim();
    }

    return { frontmatter: fm, body };
}

/**
 * Extract the H1 title from the markdown body.
 */
function extractTitle(body) {
    const match = body.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : '';
}

/**
 * Extract Day number from the subtitle line: `> Day N · ...`
 */
function extractDayOrder(body) {
    const match = body.match(/^>\s*Day\s+(\d+)/m);
    return match ? parseInt(match[1], 10) : null;
}

/**
 * Clean the subtitle/blockquote line by removing internal KL links.
 * `> Day 24 · 2026-02-23 · 骨架 [KL10](../../pyramid/...)` → `> Day 24 · 2026-02-23`
 */
function cleanSubtitleLine(body) {
    return body.replace(
        /^(>\s*Day\s+\d+\s*·\s*\d{4}-\d{2}-\d{2})\s*·\s*骨架\s*\[.*?\]\(.*?\)/m,
        '$1'
    );
}

/**
 * Strip internal relative links but keep the display text.
 * `[text](../../pyramid/...)` → `text`
 */
function stripInternalLinks(body) {
    return body.replace(/\[([^\]]+)\]\(\.\.\/\.\.\/.+?\)/g, '$1');
}

/**
 * Remove the Groups footer line and the preceding `---` separator.
 * Matches: `---\n\n**相关 Groups**：...`
 */
function stripGroupsFooter(body) {
    return body.replace(/\n---\s*\n+\*\*相关 Groups\*\*[：:].*/g, '');
}

/**
 * Extract the first paragraph after the title and subtitle as summary.
 */
function extractSummary(body, maxLen = 150) {
    const lines = body.split('\n');
    let collecting = false;
    let paragraph = '';

    for (const line of lines) {
        if (line.startsWith('# ') || line.startsWith('> ')) continue;
        const trimmed = line.trim();
        if (!collecting && trimmed.length > 0) {
            collecting = true;
            paragraph = trimmed;
        } else if (collecting && trimmed.length > 0) {
            paragraph += trimmed;
        } else if (collecting && trimmed.length === 0) {
            break;
        }
    }

    if (paragraph.length > maxLen) {
        return paragraph.slice(0, maxLen).replace(/[，。、；：！？,.;:!?\s]+$/, '') + '...';
    }
    return paragraph;
}

/**
 * Apply the full transformation pipeline to a markdown file's content.
 */
function transformContent(content, transformOpts) {
    let { frontmatter, body } = parseFrontmatter(content);

    if (transformOpts.cleanSubtitleLine) {
        body = cleanSubtitleLine(body);
    }
    if (transformOpts.stripInternalLinks) {
        body = stripInternalLinks(body);
    }
    if (transformOpts.stripGroupsFooter) {
        body = stripGroupsFooter(body);
    }

    body = body.trimEnd() + '\n';

    const title = extractTitle(body);
    const dayOrder = extractDayOrder(body);
    const summary = extractSummary(body);
    const date = frontmatter.date || null;

    return { body, title, date, dayOrder, summary };
}

// ── File Discovery ───────────────────────────────────────────────────

/**
 * List importable files from a source, matching the filePattern glob.
 * Only supports simple prefix-suffix patterns like `2026-*.md`.
 */
function listSourceFiles(sourceConfig) {
    const absPath = resolveSourcePath(sourceConfig.path);
    if (!existsSync(absPath)) {
        throw new Error(`Source path not found: ${absPath}`);
    }

    const pattern = sourceConfig.filePattern || '*.md';
    const parts = pattern.split('*');
    const prefix = parts[0] || '';
    const suffix = parts[1] || '';

    return readdirSync(absPath)
        .filter(f => f.startsWith(prefix) && f.endsWith(suffix) && f !== 'README.md' && f !== 'INDEX.md')
        .sort();
}

// ── Import Logic ─────────────────────────────────────────────────────

/**
 * Import a single file from a source into the blog.
 *
 * @param {string} sourceId - Key in sources.json
 * @param {string} filename - The specific file to import
 * @param {Object} options
 * @param {boolean} [options.dryRun=false]
 * @param {boolean} [options.force=false]
 * @returns {Object} Import result for this file
 */
function importFile(sourceId, filename, sourceConfig, manifest, blogIndex, options = {}) {
    const { dryRun = false, force = false } = options;
    const absPath = resolveSourcePath(sourceConfig.path);
    const filePath = join(absPath, filename);
    const manifestKey = `${sourceId}/${filename}`;

    if (!existsSync(filePath)) {
        return { file: filename, status: 'not_found' };
    }

    const content = readFileSync(filePath, 'utf-8');
    const contentHash = sha256(content);

    if (manifest[manifestKey] && !force) {
        const existing = manifest[manifestKey];
        if (existing.sourceHash === contentHash) {
            return { file: filename, status: 'already_imported', slug: existing.slug };
        }
        return { file: filename, status: 'already_imported_changed', slug: existing.slug, hint: 'use --force to re-import' };
    }

    const transformed = transformContent(content, sourceConfig.transform || {});
    const datePart = (transformed.date || filename.replace('.md', '')).replace(/[^a-zA-Z0-9-]/g, '-');
    const slug = `${sourceConfig.slugPrefix}-${datePart}`;

    if (dryRun) {
        return {
            file: filename,
            status: 'would_import',
            slug,
            title: transformed.title,
            date: transformed.date,
            dayOrder: transformed.dayOrder,
        };
    }

    writeFileSync(join(POSTS_DIR, `${slug}.md`), transformed.body, 'utf-8');

    const indexEntry = {
        slug,
        title: { 'zh-CN': transformed.title, 'en-US': '' },
        date: transformed.date || '',
        summary: { 'zh-CN': transformed.summary, 'en-US': '' },
        cover: '',
        tags: [...(sourceConfig.defaultTags || [])],
        author: { ...(sourceConfig.defaultAuthor || {}) },
    };

    if (sourceConfig.series) {
        indexEntry.series = {
            id: sourceConfig.series.id,
            title: sourceConfig.series.title || {},
            order: transformed.dayOrder ?? 0,
        };
    }

    const existingIdx = blogIndex.findIndex(e => e.slug === slug);
    if (existingIdx >= 0) {
        blogIndex[existingIdx] = indexEntry;
    } else {
        blogIndex.push(indexEntry);
    }

    manifest[manifestKey] = {
        slug,
        importedAt: new Date().toISOString(),
        sourceHash: contentHash,
    };

    return {
        file: filename,
        status: force && manifest[manifestKey] ? 'reimported' : 'imported',
        slug,
        title: transformed.title,
        date: transformed.date,
    };
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Import files from a registered source into the blog.
 *
 * @param {string} sourceId - Key in sources.json
 * @param {Object} options
 * @param {string}  [options.file]    - Import a single file
 * @param {boolean} [options.all]     - Import all unimported files
 * @param {boolean} [options.dryRun]  - Preview without writing
 * @param {boolean} [options.force]   - Overwrite already-imported files
 * @returns {Object} Results
 */
export function blogImport(sourceId, options = {}) {
    const { file, all = false, dryRun = false, force = false } = options;

    const sources = loadSources();
    const sourceConfig = sources[sourceId];
    if (!sourceConfig) {
        throw new Error(`Unknown source "${sourceId}". Available: ${Object.keys(sources).join(', ')}`);
    }

    const manifest = loadManifest();
    const blogIndex = loadBlogIndex();

    let filesToImport;
    if (file) {
        filesToImport = [file];
    } else if (all) {
        filesToImport = listSourceFiles(sourceConfig);
    } else {
        const allFiles = listSourceFiles(sourceConfig);
        filesToImport = allFiles.filter(f => !manifest[`${sourceId}/${f}`]);
        if (filesToImport.length === 0) {
            toStderr('  All files already imported. Use --all --force to re-import.');
        }
    }

    toStderr(`\n── Blog Import: ${sourceId} ──`);
    toStderr(`  Source: ${resolveSourcePath(sourceConfig.path)}`);
    toStderr(`  Files to process: ${filesToImport.length}`);

    if (dryRun) {
        toStderr('  [dry-run] No files will be written.\n');
    }

    const results = [];
    for (const f of filesToImport) {
        const result = importFile(sourceId, f, sourceConfig, manifest, blogIndex, { dryRun, force });
        results.push(result);
        toStderr(`  ${result.status}: ${f}${result.slug ? ` → ${result.slug}` : ''}`);
    }

    if (!dryRun && results.some(r => r.status === 'imported' || r.status === 'reimported')) {
        blogIndex.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        saveBlogIndex(blogIndex);
        saveManifest(manifest);
        toStderr('  Updated: index.json + import-manifest.json');
    }

    const imported = results.filter(r => r.status === 'imported' || r.status === 'reimported').length;
    const skipped = results.filter(r => r.status.startsWith('already_imported')).length;

    return { sourceId, total: filesToImport.length, imported, skipped, results };
}

// ── Translation ──────────────────────────────────────────────────────

const TRANSLATE_META_SYSTEM = `You are a professional technical blog translator. Translate the given Chinese title and summary into natural, fluent English.
Keep technical terms accurate. The tone should be casual but professional, like a developer writing for peers.
You MUST respond with a valid JSON object and nothing else: {"title":"...","summary":"..."}`;

const TRANSLATE_BODY_SYSTEM = `You are a professional technical blog translator. Translate the given Chinese Markdown blog post into natural, fluent English.
Rules:
- Keep ALL Markdown formatting exactly as-is (headings, lists, code blocks, links, blockquotes).
- Keep ALL code snippets, file paths, command names, and variable names unchanged.
- Translate inline Chinese comments inside code blocks.
- The tone should be casual but professional, like a developer writing for peers.
- Output ONLY the translated Markdown. No wrapping, no explanation, no code fences around the entire output.`;

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function stripCodeFences(text) {
    return text.replace(/^```(?:json|markdown|md)?\s*\n?/, '').replace(/\n?```\s*$/, '');
}

/**
 * Translate a single blog post by slug.
 *
 * @param {string} slug
 * @param {Function} callMetaAgent  - For title+summary (JSON response)
 * @param {Function} callBodyAgent  - For full body (Markdown response)
 * @param {Object} options
 * @returns {Object} Translation result
 */
async function translateOne(slug, callMetaAgent, callBodyAgent, options = {}) {
    const { dryRun = false, force = false } = options;
    const mdPath = join(POSTS_DIR, `${slug}.md`);
    const enPath = join(POSTS_DIR, `${slug}.en-US.md`);

    if (!existsSync(mdPath)) {
        return { slug, status: 'source_not_found' };
    }

    if (existsSync(enPath) && !force) {
        return { slug, status: 'already_translated' };
    }

    const blogIndex = loadBlogIndex();
    const entry = blogIndex.find(e => e.slug === slug);
    if (!entry) {
        return { slug, status: 'not_in_index' };
    }

    const zhTitle = entry.title?.['zh-CN'] || '';
    const zhSummary = entry.summary?.['zh-CN'] || '';
    const zhBody = readFileSync(mdPath, 'utf-8');

    if (dryRun) {
        return { slug, status: 'would_translate', titleLen: zhTitle.length, bodyLen: zhBody.length };
    }

    let enTitle = '';
    let enSummary = '';
    const metaPrompt = `Title: ${zhTitle}\n\nSummary: ${zhSummary}`;
    const metaResp = await callMetaAgent(metaPrompt);
    try {
        const parsed = JSON.parse(stripCodeFences(metaResp.trim()));
        enTitle = parsed.title || '';
        enSummary = parsed.summary || '';
    } catch {
        enTitle = metaResp.trim().slice(0, 200);
        enSummary = '';
        toStderr(`    Warning: meta response was not valid JSON, used raw text as title`);
    }

    const enBody = await callBodyAgent(zhBody);

    writeFileSync(enPath, enBody.trimEnd() + '\n', 'utf-8');

    if (entry.title && typeof entry.title === 'object') entry.title['en-US'] = enTitle;
    if (entry.summary && typeof entry.summary === 'object') entry.summary['en-US'] = enSummary;

    blogIndex.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    saveBlogIndex(blogIndex);

    return { slug, status: force ? 'retranslated' : 'translated', enTitle };
}

/**
 * Translate one or more blog posts by slug.
 *
 * @param {string[]} slugs
 * @param {Object} options
 * @param {boolean} [options.dryRun]
 * @param {boolean} [options.force]
 * @param {number}  [options.delayMs=1000]
 * @returns {Object} Results
 */
export async function blogTranslate(slugs, options = {}) {
    const { dryRun = false, force = false, delayMs = 1000 } = options;

    toStderr('\n── Blog Translate ──');
    toStderr(`  Posts to process: ${slugs.length}`);

    if (dryRun) {
        toStderr('  [dry-run] No files will be written.\n');
    }

    let callMetaAgent, callBodyAgent;
    if (!dryRun) {
        const apiConfig = loadApiConfig();
        toStderr(`  API: ${apiConfig.baseUrl} (model: ${apiConfig.model})`);

        callMetaAgent = createHttpCaller({
            ...apiConfig,
            systemPrompt: TRANSLATE_META_SYSTEM,
            maxTokens: 1024,
        });
        callBodyAgent = createHttpCaller({
            ...apiConfig,
            systemPrompt: TRANSLATE_BODY_SYSTEM,
            maxTokens: 16384,
        });
    }

    const results = [];
    for (let i = 0; i < slugs.length; i++) {
        const slug = slugs[i];
        try {
            const result = await translateOne(slug, callMetaAgent, callBodyAgent, { dryRun, force });
            results.push(result);
            toStderr(`  ${result.status}: ${slug}${result.enTitle ? ` → "${result.enTitle}"` : ''}`);
        } catch (err) {
            results.push({ slug, status: 'error', error: err.message });
            toStderr(`  error: ${slug} — ${err.message}`);
        }

        if (!dryRun && i < slugs.length - 1) {
            await sleep(delayMs);
        }
    }

    const translated = results.filter(r => r.status === 'translated' || r.status === 'retranslated').length;
    const skipped = results.filter(r => r.status === 'already_translated').length;
    const errors = results.filter(r => r.status === 'error').length;

    return { total: slugs.length, translated, skipped, errors, results };
}

/**
 * Find and translate all blog posts that don't have an en-US version yet.
 *
 * @param {Object} options  - Same as blogTranslate options
 * @returns {Object} Results
 */
export async function blogTranslateUntranslated(options = {}) {
    const blogIndex = loadBlogIndex();
    const untranslated = blogIndex
        .filter(entry => {
            const hasEnTitle = entry.title?.['en-US'] && entry.title['en-US'].trim() !== '';
            const hasEnFile = existsSync(join(POSTS_DIR, `${entry.slug}.en-US.md`));
            return !hasEnTitle || !hasEnFile;
        })
        .map(entry => entry.slug);

    if (untranslated.length === 0) {
        toStderr('\n  All posts already have en-US translations.');
        return { total: 0, translated: 0, skipped: 0, errors: 0, results: [] };
    }

    toStderr(`\n  Found ${untranslated.length} untranslated post(s).`);
    return blogTranslate(untranslated, options);
}

/**
 * List all registered sources and their import status.
 *
 * @returns {Array} Source status list
 */
export function blogSources() {
    const sources = loadSources();
    const manifest = loadManifest();
    const result = [];

    for (const [id, config] of Object.entries(sources)) {
        const absPath = resolveSourcePath(config.path);
        const available = existsSync(absPath);

        let totalFiles = 0;
        let importedFiles = 0;

        if (available) {
            try {
                const files = listSourceFiles(config);
                totalFiles = files.length;
                importedFiles = files.filter(f => manifest[`${id}/${f}`]).length;
            } catch {
                // path exists but listing failed
            }
        }

        result.push({
            id,
            path: absPath,
            available,
            totalFiles,
            importedFiles,
            pendingFiles: totalFiles - importedFiles,
            series: config.series || null,
            tags: config.defaultTags || [],
        });
    }

    return result;
}
