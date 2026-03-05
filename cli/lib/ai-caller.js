/**
 * ClawHub AI Caller — OpenAI-compatible HTTP API client.
 *
 * Adapted from js-knowledge-prism/lib/process.mjs.
 * Zero external dependencies (uses node:http / node:https).
 */

import http from 'node:http';
import https from 'node:https';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { toStderr } from './formatters.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..', '..');

// ── HTTP request ─────────────────────────────────────────────────────

function httpRequest(url, options, body, timeoutMs) {
    return new Promise((resolve, reject) => {
        const mod = url.startsWith('https') ? https : http;
        const req = mod.request(url, options, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () =>
                resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString() }),
            );
        });
        req.setTimeout(timeoutMs, () => {
            req.destroy(new Error(`Request timed out after ${timeoutMs / 1000}s`));
        });
        req.on('error', (err) => {
            reject(new Error(err.message || err.code || 'Connection failed'));
        });
        if (body) req.write(body);
        req.end();
    });
}

// ── API caller factory ───────────────────────────────────────────────

/**
 * Create a callAgent function backed by an OpenAI-compatible HTTP API.
 * @returns {(prompt: string) => Promise<string>}
 */
export function createHttpCaller({
    baseUrl,
    apiKey,
    model,
    systemPrompt,
    temperature = 0.3,
    maxTokens = 8192,
    timeoutMs = 1_800_000,
    log = (msg) => toStderr(`  ${msg}`),
}) {
    return async function callAgent(prompt) {
        log(`Calling model (prompt ${prompt.length} chars, model=${model})...`);

        const url = `${baseUrl}/chat/completions`;
        const payload = JSON.stringify({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt },
            ],
            temperature,
            max_tokens: maxTokens,
        });

        const resp = await httpRequest(
            url,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Length': Buffer.byteLength(payload),
                },
            },
            payload,
            timeoutMs,
        );

        if (resp.status !== 200) {
            throw new Error(`API error ${resp.status}: ${resp.body.slice(0, 500)}`);
        }

        const json = JSON.parse(resp.body);
        const text = json.choices?.[0]?.message?.content;
        if (!text) {
            throw new Error(`Empty response: ${JSON.stringify(json).slice(0, 500)}`);
        }
        log(`Model returned ${text.length} chars`);
        return text;
    };
}

// ── Config loader ────────────────────────────────────────────────────

function loadDotEnv(envPath) {
    if (!existsSync(envPath)) return;
    for (const line of readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
        const trimmed = line.trim();
        const m = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
        if (m && !process.env[m[1]]) {
            process.env[m[1]] = m[2].trim();
        }
    }
}

/**
 * Load API configuration from env vars / .env / defaults.
 *
 * Priority: env vars > .env file > defaults.
 * Env vars: CLAWHUB_API_BASE_URL, CLAWHUB_API_KEY, CLAWHUB_API_MODEL
 */
export function loadApiConfig() {
    loadDotEnv(join(PROJECT_ROOT, '.env'));

    return {
        baseUrl: process.env.CLAWHUB_API_BASE_URL || 'http://localhost:8888/v1',
        apiKey: process.env.CLAWHUB_API_KEY || 'not-needed',
        model: process.env.CLAWHUB_API_MODEL || 'default',
    };
}
