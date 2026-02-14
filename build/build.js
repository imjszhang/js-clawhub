/**
 * JS ClawHub - Build Script
 * Copies src/ to docs/ for GitHub Pages deployment
 * 
 * Usage: node build/build.js
 */

import { cpSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const SRC = join(ROOT, 'src');
const DOCS = join(ROOT, 'docs');

// ============================================================
// Step 1: Clean docs/ directory
// ============================================================
console.log('\n🔧 JS ClawHub Build');
console.log('='.repeat(50));

console.log('\n[1/4] Cleaning docs/ ...');
if (existsSync(DOCS)) {
    rmSync(DOCS, { recursive: true, force: true });
}
mkdirSync(DOCS, { recursive: true });

// ============================================================
// Step 2: Copy src/ to docs/
// ============================================================
console.log('[2/4] Copying src/ → docs/ ...');
cpSync(SRC, DOCS, { recursive: true });

// ============================================================
// Step 3: Create .nojekyll for GitHub Pages
// ============================================================
console.log('[3/4] Creating .nojekyll ...');
writeFileSync(join(DOCS, '.nojekyll'), '');

// ============================================================
// Step 4: Validate i18n completeness in JSON data files
// ============================================================
console.log('[4/4] Validating i18n translations ...\n');

const BILINGUAL_FIELDS = {
    'data/navigation.json': {
        'featured[].desc': true,
        'featured[].jsComment': true,
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
let totalWarnings = 0;

function validateBilingualField(value, fieldPath, filePath) {
    if (value === null || value === undefined) return;

    // If it's a string, it's a non-bilingual field (e.g., names) — skip
    if (typeof value === 'string') return;

    // If it's an object, check for locale keys
    if (typeof value === 'object' && !Array.isArray(value)) {
        for (const loc of LOCALES) {
            if (!value[loc] || (typeof value[loc] === 'string' && value[loc].trim() === '')) {
                console.log(`  ⚠️  Missing "${loc}" in ${filePath} → ${fieldPath}`);
                totalWarnings++;
            }
        }
    }
}

function validateArrayField(arr, fieldName, filePath) {
    if (!Array.isArray(arr)) return;
    arr.forEach((item, idx) => {
        if (item && typeof item === 'object' && fieldName in item) {
            validateBilingualField(item[fieldName], `[${idx}].${fieldName}`, filePath);
        }
    });
}

for (const [relPath, fields] of Object.entries(BILINGUAL_FIELDS)) {
    const fullPath = join(SRC, relPath);
    if (!existsSync(fullPath)) {
        console.log(`  ⚠️  File not found: ${relPath}`);
        totalWarnings++;
        continue;
    }

    const data = JSON.parse(readFileSync(fullPath, 'utf-8'));

    for (const fieldSpec of Object.keys(fields)) {
        // Parse field spec like "featured[].desc" or "[].title"
        const parts = fieldSpec.split('.');
        let current = data;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            if (part.endsWith('[]')) {
                // Array traversal
                const key = part.slice(0, -2);
                const arr = key ? current[key] : current;
                if (Array.isArray(arr)) {
                    const remainingPath = parts.slice(i + 1).join('.');
                    if (remainingPath.includes('[]')) {
                        // Nested array - recurse items
                        arr.forEach(item => {
                            const subParts = remainingPath.split('.');
                            const subKey = subParts[0].endsWith('[]') ? subParts[0].slice(0, -2) : subParts[0];
                            const finalField = subParts[subParts.length - 1];
                            if (item[subKey]) {
                                validateArrayField(item[subKey], finalField, relPath);
                            }
                        });
                    } else {
                        // Simple array field
                        validateArrayField(arr, remainingPath, relPath);
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

// ============================================================
// Summary
// ============================================================
console.log('='.repeat(50));
if (totalWarnings > 0) {
    console.log(`⚠️  Build complete with ${totalWarnings} translation warning(s).`);
} else {
    console.log('✅ Build complete. No translation issues found.');
}
console.log(`📁 Output: docs/`);
console.log(`📄 Files copied from src/\n`);
