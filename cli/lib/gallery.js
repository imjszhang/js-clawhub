/**
 * ClawHub Gallery — manage gallery items and generate images via ComfyUI.
 *
 * Subcommands:
 *   generate  — call ComfyUI to produce an image, auto-add to gallery
 *   add       — manually add an existing image to gallery
 *   list      — list gallery items
 *   remove    — remove a gallery item by id
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, unlinkSync } from 'fs';
import { join, resolve, basename, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { toStderr } from './formatters.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..', '..');
const SRC = join(ROOT, 'src');
const GALLERY_DIR = join(SRC, 'gallery');
const DATA_FILE = join(GALLERY_DIR, 'data', 'index.json');
const IMAGES_DIR = join(GALLERY_DIR, 'images');
const THUMBS_DIR = join(IMAGES_DIR, 'thumbs');

function ensureDirs() {
    mkdirSync(join(GALLERY_DIR, 'data'), { recursive: true });
    mkdirSync(IMAGES_DIR, { recursive: true });
    mkdirSync(THUMBS_DIR, { recursive: true });
}

function readIndex() {
    if (!existsSync(DATA_FILE)) return [];
    return JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
}

function writeIndex(items) {
    ensureDirs();
    writeFileSync(DATA_FILE, JSON.stringify(items, null, 2) + '\n', 'utf-8');
}

function generateId(title) {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const slug = (title || 'untitled')
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40);
    const rand = Math.random().toString(36).slice(2, 6);
    return `${date}-${slug}-${rand}`;
}

// ── generate ─────────────────────────────────────────────────────────

export async function galleryGenerate(flags) {
    const require = createRequire(import.meta.url);
    const comfyuiPath = resolve(ROOT, 'vendor', 'js-comfyui-skill', 'scripts', 'comfyUIClient.js');

    if (!existsSync(comfyuiPath)) {
        throw new Error(
            'ComfyUIClient not found. Run: git submodule update --init'
        );
    }

    const ComfyUIClient = require(comfyuiPath);

    const workflowFile = flags.workflow;
    if (!workflowFile) {
        throw new Error('--workflow is required for gallery generate');
    }

    const resolvedWorkflow = resolve(workflowFile);
    if (!existsSync(resolvedWorkflow)) {
        throw new Error(`Workflow file not found: ${resolvedWorkflow}`);
    }

    const clientOpts = {
        workflowFile: resolvedWorkflow,
        prompt: flags.prompt || undefined,
        promptNode: flags['prompt-node'] || undefined,
        negativePrompt: flags['negative-prompt'] || undefined,
        negativePromptNode: flags['negative-prompt-node'] || undefined,
        imagePath: flags['image-path'] || undefined,
        imageNode: flags['image-node'] || undefined,
        serverUrl: flags.server || undefined,
        timeout: flags.timeout ? parseInt(flags.timeout, 10) : undefined,
    };

    toStderr('Submitting workflow to ComfyUI...');
    const client = new ComfyUIClient(clientOpts);
    const result = await client.execute();

    if (!result || !result.generatedFiles || result.generatedFiles.length === 0) {
        throw new Error('ComfyUI returned no generated files');
    }

    toStderr(`Generated ${result.generatedFiles.length} file(s)`);

    const title = flags.title || flags.prompt?.slice(0, 60) || 'Untitled';
    const tags = flags.tags ? flags.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const items = readIndex();
    const added = [];

    for (const file of result.generatedFiles) {
        const sourcePath = file.localPath;
        if (!sourcePath || !existsSync(sourcePath)) continue;

        const id = generateId(title);
        const ext = extname(sourcePath) || '.png';
        const destFilename = `${id}${ext}`;

        ensureDirs();
        cpSync(sourcePath, join(IMAGES_DIR, destFilename));

        const workflowBasename = basename(resolvedWorkflow);
        const item = {
            id,
            title: { 'zh-CN': title, 'en-US': title },
            description: { 'zh-CN': '', 'en-US': '' },
            image: `./images/${destFilename}`,
            thumbnail: `./images/${destFilename}`,
            tags,
            createdAt: new Date().toISOString().split('T')[0],
            creation: {
                prompt: flags.prompt || '',
                negativePrompt: flags['negative-prompt'] || '',
                workflow: workflowBasename,
                workflowDisplay: flags['workflow-display'] || workflowBasename.replace(/\.json$/, ''),
                model: flags.model || '',
                sampler: flags.sampler || '',
                steps: flags.steps ? parseInt(flags.steps, 10) : null,
                cfgScale: flags['cfg-scale'] ? parseFloat(flags['cfg-scale']) : null,
                seed: flags.seed ? parseInt(flags.seed, 10) : null,
                resolution: flags.resolution || '',
                extra: {},
            },
        };

        // Strip null/empty creation fields
        Object.keys(item.creation).forEach(k => {
            if (item.creation[k] === null || item.creation[k] === '') {
                delete item.creation[k];
            }
        });

        items.unshift(item);
        added.push(item);
        toStderr(`  Added: ${id}`);
    }

    writeIndex(items);
    return { added, total: items.length };
}

// ── add ──────────────────────────────────────────────────────────────

export function galleryAdd(flags) {
    const imagePath = flags.image;
    if (!imagePath || !existsSync(resolve(imagePath))) {
        throw new Error('--image is required and must point to an existing file');
    }

    const title = flags.title || 'Untitled';
    const tags = flags.tags ? flags.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const id = flags.id || generateId(title);
    const ext = extname(imagePath) || '.png';
    const destFilename = `${id}${ext}`;

    ensureDirs();
    cpSync(resolve(imagePath), join(IMAGES_DIR, destFilename));

    const item = {
        id,
        title: { 'zh-CN': title, 'en-US': flags['title-en'] || title },
        description: { 'zh-CN': flags.description || '', 'en-US': flags['description-en'] || '' },
        image: `./images/${destFilename}`,
        thumbnail: `./images/${destFilename}`,
        tags,
        createdAt: flags.date || new Date().toISOString().split('T')[0],
        creation: {
            prompt: flags.prompt || '',
            negativePrompt: flags['negative-prompt'] || '',
            workflow: flags.workflow || '',
            workflowDisplay: flags['workflow-display'] || '',
            model: flags.model || '',
            sampler: flags.sampler || '',
            steps: flags.steps ? parseInt(flags.steps, 10) : null,
            cfgScale: flags['cfg-scale'] ? parseFloat(flags['cfg-scale']) : null,
            seed: flags.seed ? parseInt(flags.seed, 10) : null,
            resolution: flags.resolution || '',
            extra: {},
        },
    };

    Object.keys(item.creation).forEach(k => {
        if (item.creation[k] === null || item.creation[k] === '') {
            delete item.creation[k];
        }
    });

    const items = readIndex();
    items.unshift(item);
    writeIndex(items);

    return { added: item, total: items.length };
}

// ── list ─────────────────────────────────────────────────────────────

export function galleryList(flags) {
    const items = readIndex();
    let filtered = items;

    if (flags.tag) {
        filtered = filtered.filter(item =>
            (item.tags || []).some(t => t.toLowerCase() === flags.tag.toLowerCase())
        );
    }

    return { items: filtered, total: items.length, shown: filtered.length };
}

// ── remove ───────────────────────────────────────────────────────────

export function galleryRemove(id) {
    if (!id) throw new Error('Item ID is required');

    const items = readIndex();
    const idx = items.findIndex(item => item.id === id);
    if (idx === -1) throw new Error(`Gallery item not found: ${id}`);

    const [removed] = items.splice(idx, 1);

    // Remove image files
    if (removed.image) {
        const imgPath = join(GALLERY_DIR, removed.image.replace(/^\.\//, ''));
        if (existsSync(imgPath)) {
            try { unlinkSync(imgPath); } catch {}
        }
    }
    if (removed.thumbnail && removed.thumbnail !== removed.image) {
        const thumbPath = join(GALLERY_DIR, removed.thumbnail.replace(/^\.\//, ''));
        if (existsSync(thumbPath)) {
            try { unlinkSync(thumbPath); } catch {}
        }
    }

    writeIndex(items);
    return { removed, total: items.length };
}
