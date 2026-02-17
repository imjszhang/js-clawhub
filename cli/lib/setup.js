/**
 * ClawHub Setup — infrastructure setup for Cloudflare DNS and GitHub Pages.
 *
 * Extracted from scripts/setup-cloudflare.js and scripts/setup-github-pages.js
 * into the CLI as reusable async functions.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..');

const DOMAIN = 'js-clawhub.com';
const GITHUB_PAGES_TARGET = 'imjszhang.github.io';
const GITHUB_REPO = 'imjszhang/js-clawhub';

// ── Shared helpers ───────────────────────────────────────────────────

function loadEnv() {
    const env = { ...process.env };
    const envPath = join(ROOT, '.env');
    if (existsSync(envPath)) {
        const content = readFileSync(envPath, 'utf-8');
        for (const line of content.split('\n')) {
            const match = line.match(/^([^#=]+)=(.*)$/);
            if (match) {
                env[match[1].trim()] = match[2].trim();
            }
        }
    }
    return env;
}

function log(msg) {
    process.stderr.write(msg + '\n');
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

// ── Cloudflare helpers ───────────────────────────────────────────────

function getCfAuthHeaders(env) {
    const apiKey = env.CLOUDFARE_API_KEY || env.CLOUDFLARE_API_TOKEN || env.CLOUDFLARE_API_KEY;
    const email = env.CLOUDFLARE_EMAIL;

    if (!apiKey) {
        throw new Error('Missing CLOUDFARE_API_KEY or CLOUDFLARE_API_TOKEN in .env');
    }

    if (email) {
        return {
            'X-Auth-Email': email,
            'X-Auth-Key': apiKey,
            'Content-Type': 'application/json',
        };
    }
    return {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
    };
}

async function cfFetch(path, options = {}) {
    const url = `https://api.cloudflare.com/client/v4${path}`;
    const res = await fetch(url, options);
    const data = await res.json();
    if (!res.ok) {
        const err = data.errors?.[0] || { message: res.statusText };
        throw new Error(`Cloudflare API error: ${err.message} (code: ${err.code})`);
    }
    if (!data.success) {
        throw new Error(data.errors?.[0]?.message || 'Cloudflare API request failed');
    }
    return data;
}

async function getAccountId(headers) {
    const data = await cfFetch('/accounts', { headers });
    const accounts = data.result || [];
    if (accounts.length === 0) throw new Error('No Cloudflare account found');
    return accounts[0].id;
}

async function getZoneId(headers) {
    const data = await cfFetch(`/zones?name=${DOMAIN}`, { headers });
    const zones = data.result || [];
    return zones.length > 0 ? zones[0].id : null;
}

async function createZone(headers, accountId) {
    const data = await cfFetch('/zones', {
        method: 'POST',
        headers,
        body: JSON.stringify({
            name: DOMAIN,
            account: { id: accountId },
            jump_start: true,
            type: 'full',
        }),
    });
    const zone = data.result;
    log(`Zone created: ${zone.name}, Zone ID: ${zone.id}`);
    log(`Update NS records at your registrar to: ${zone.name_servers.join(', ')}`);
    return zone.id;
}

async function listDnsRecords(headers, zoneId) {
    const data = await cfFetch(`/zones/${zoneId}/dns_records`, { headers });
    return data.result || [];
}

async function createOrUpdateDnsRecord(headers, zoneId, record) {
    const { name, type, content, proxied = false } = record;
    const fullName = name === '@' ? DOMAIN : `${name}.${DOMAIN}`;

    const records = await listDnsRecords(headers, zoneId);
    const existing = records.find(r => r.name === fullName && r.type === type);

    const body = { type, content, proxied, ttl: 1, name: fullName };

    if (existing) {
        await cfFetch(`/zones/${zoneId}/dns_records/${existing.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(body),
        });
        log(`DNS updated: ${fullName} ${type} -> ${content}`);
    } else {
        await cfFetch(`/zones/${zoneId}/dns_records`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
        log(`DNS added: ${fullName} ${type} -> ${content}`);
    }
}

// ── GitHub helpers ───────────────────────────────────────────────────

function getGhAuthHeaders(env) {
    const token = env.GITHUB_TOKEN;
    if (!token) {
        throw new Error('Missing GITHUB_TOKEN in .env');
    }
    return {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
    };
}

async function ghFetch(path, headers, options = {}) {
    const url = `https://api.github.com${path}`;
    const res = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
        const msg = data?.message || res.statusText;
        throw new Error(`GitHub API error: ${msg}`);
    }
    return data;
}

async function updatePages(headers, owner, repo, body) {
    await ghFetch(`/repos/${owner}/${repo}/pages`, headers, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Set up Cloudflare DNS records pointing to GitHub Pages.
 * Reads credentials from .env (CLOUDFARE_API_KEY / CLOUDFLARE_API_TOKEN).
 */
export async function setupCloudflare() {
    log('=== Cloudflare DNS Setup (js-clawhub.com) ===\n');

    const env = loadEnv();
    const headers = getCfAuthHeaders(env);

    let zoneId = await getZoneId(headers);
    if (!zoneId) {
        log('Zone not found, creating...');
        const accountId = await getAccountId(headers);
        zoneId = await createZone(headers, accountId);
    } else {
        log(`Zone found: ${DOMAIN}`);
    }

    const records = [
        { name: '@', type: 'CNAME', content: GITHUB_PAGES_TARGET, proxied: false },
        { name: 'www', type: 'CNAME', content: GITHUB_PAGES_TARGET, proxied: false },
    ];

    for (const record of records) {
        await createOrUpdateDnsRecord(headers, zoneId, record);
    }

    log(`\nDone. DNS propagation may take a few minutes.`);
    log(`Make sure GitHub Pages custom domain is set to: ${DOMAIN}`);
}

/**
 * Configure GitHub Pages custom domain and enforce HTTPS.
 * Reads GITHUB_TOKEN from .env.
 */
export async function setupGithubPages() {
    log('=== GitHub Pages Custom Domain Setup ===\n');

    const env = loadEnv();
    const headers = getGhAuthHeaders(env);
    const [owner, repo] = GITHUB_REPO.split('/');

    let source = { branch: 'master', path: '/docs' };
    try {
        const pages = await ghFetch(`/repos/${owner}/${repo}/pages`, headers);
        if (pages.source) {
            source = { branch: pages.source.branch, path: pages.source.path || '/' };
        }
    } catch (e) {
        if (e.message.includes('404')) {
            throw new Error('Pages not enabled. Enable it in GitHub repo Settings -> Pages first.');
        }
        throw e;
    }

    log(`Setting custom domain: ${DOMAIN} ...`);
    await updatePages(headers, owner, repo, { cname: DOMAIN, source });
    log('Custom domain set. Waiting for DNS verification...\n');

    const maxAttempts = 24;
    const intervalMs = 5000;
    let verified = false;

    for (let i = 0; i < maxAttempts; i++) {
        await sleep(intervalMs);
        const pages = await ghFetch(`/repos/${owner}/${repo}/pages`, headers);
        const state = pages.protected_domain_state || '';
        const certState = pages.https_certificate?.state || '';

        log(`  [${i + 1}/${maxAttempts}] domain: ${state}, cert: ${certState}`);

        if (certState === 'approved') {
            verified = true;
            break;
        }
    }

    if (!verified) {
        log('\nDNS verification timed out. Run this command again later to enable HTTPS.');
        return;
    }

    log('\nDomain verified. Enforcing HTTPS...');
    await updatePages(headers, owner, repo, { cname: DOMAIN, source, https_enforced: true });
    log('HTTPS enforced successfully.');
}
