/**
 * ClawHub Data Writer — write layer for Pulse data editing.
 *
 * Handles backup, validation, and atomic writes to items.json.
 * Keeps read/write concerns separated from data-reader.js.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DOCS = join(__dirname, '..', '..', 'src');
const PULSE_ITEMS = join(DOCS, 'pulse', 'data', 'items.json');
const BACKUP_DIR = join(DOCS, 'pulse', 'data', '.backups');

const MAX_BACKUPS = 20;

const VALID_COMMENT_TYPES = [
    'add_insight',
    'agree_and_extend',
    'ask_question',
    'share_experience',
    'recommend_resource',
];

const BILINGUAL_FIELDS = ['title', 'summary', 'js_take'];

// ── Internal helpers ─────────────────────────────────────────────────

function readJson(filepath) {
    if (!existsSync(filepath)) return null;
    try {
        return JSON.parse(readFileSync(filepath, 'utf-8'));
    } catch {
        return null;
    }
}

/**
 * Create a timestamped backup of the target file.
 * Keeps at most MAX_BACKUPS files; oldest are pruned.
 */
function backupFile(filepath) {
    if (!existsSync(filepath)) return;

    if (!existsSync(BACKUP_DIR)) {
        mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(BACKUP_DIR, `items-${ts}.json`);
    copyFileSync(filepath, backupPath);

    // Prune old backups
    const files = readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('items-') && f.endsWith('.json'))
        .sort();

    while (files.length > MAX_BACKUPS) {
        const oldest = files.shift();
        unlinkSync(join(BACKUP_DIR, oldest));
    }
}

/**
 * Backup then write pretty-printed JSON to filepath.
 */
function writeJson(filepath, data) {
    backupFile(filepath);
    writeFileSync(filepath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

/**
 * Validate a patch object before applying it.
 * Throws on invalid values.
 */
function validatePatch(patch) {
    if ('id' in patch) {
        throw new Error('Cannot modify the "id" field.');
    }

    if ('score' in patch) {
        const s = patch.score;
        if (typeof s !== 'number' || s < 0 || s > 1) {
            throw new Error(`Invalid score "${s}": must be a number between 0 and 1.`);
        }
    }

    if ('comment_type' in patch) {
        if (!VALID_COMMENT_TYPES.includes(patch.comment_type)) {
            throw new Error(
                `Invalid comment_type "${patch.comment_type}". ` +
                `Must be one of: ${VALID_COMMENT_TYPES.join(', ')}`
            );
        }
    }
}

/**
 * Merge a bilingual field: only overwrite the language keys present in
 * the incoming value, preserving the other language.
 *
 * @param {Object} existing - Current bilingual object, e.g. {"en-US":"…","zh-CN":"…"}
 * @param {Object} incoming - Partial update, e.g. {"zh-CN":"new text"}
 * @returns {Object} Merged bilingual object
 */
function mergeBilingual(existing, incoming) {
    const base = (existing && typeof existing === 'object') ? { ...existing } : {};
    if (incoming && typeof incoming === 'object') {
        if ('en-US' in incoming) base['en-US'] = incoming['en-US'];
        if ('zh-CN' in incoming) base['zh-CN'] = incoming['zh-CN'];
    }
    return base;
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Update a single Pulse item by ID.
 *
 * @param {string} id    - Tweet ID to locate
 * @param {Object} patch - Fields to update (validated before apply)
 * @returns {Object} The updated item
 */
export function updatePulseItem(id, patch) {
    validatePatch(patch);

    const items = readJson(PULSE_ITEMS);
    if (!items) throw new Error('Could not read items.json');

    const idx = items.findIndex(it => it.id === id);
    if (idx === -1) throw new Error(`Item not found: "${id}"`);

    const item = items[idx];

    // Apply patch with bilingual-aware merging
    for (const [key, val] of Object.entries(patch)) {
        if (BILINGUAL_FIELDS.includes(key)) {
            item[key] = mergeBilingual(item[key], val);
        } else {
            item[key] = val;
        }
    }

    writeJson(PULSE_ITEMS, items);
    return item;
}

/**
 * Delete a single Pulse item by ID.
 *
 * @param {string} id - Tweet ID to remove
 * @returns {Object} The deleted item
 */
export function deletePulseItem(id) {
    const items = readJson(PULSE_ITEMS);
    if (!items) throw new Error('Could not read items.json');

    const idx = items.findIndex(it => it.id === id);
    if (idx === -1) throw new Error(`Item not found: "${id}"`);

    const [removed] = items.splice(idx, 1);
    writeJson(PULSE_ITEMS, items);
    return removed;
}
