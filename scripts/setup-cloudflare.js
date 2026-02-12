/**
 * Cloudflare API 配置脚本
 * 为 js-clawhub.com 设置 DNS 记录，指向 GitHub Pages
 *
 * 使用前请确保：
 * 1. .env 中配置 CLOUDFARE_API_KEY（或 CLOUDFLARE_API_TOKEN）
 * 2. 若使用 Global API Key，需额外配置 CLOUDFLARE_EMAIL
 * 3. js-clawhub.com 已添加到 Cloudflare（或脚本会自动尝试创建）
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DOMAIN = "js-clawhub.com";
const GITHUB_PAGES_TARGET = "imjszhang.github.io";

// 解析 .env，并合并 process.env
function loadEnv() {
  const env = { ...process.env };
  const envPath = resolve(ROOT, ".env");
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        env[match[1].trim()] = match[2].trim();
      }
    }
  }
  return env;
}

// 获取 API 请求头
function getAuthHeaders(env) {
  const apiKey = env.CLOUDFARE_API_KEY || env.CLOUDFLARE_API_TOKEN || env.CLOUDFLARE_API_KEY;
  const email = env.CLOUDFLARE_EMAIL;

  if (!apiKey) {
    throw new Error("请在 .env 中配置 CLOUDFARE_API_KEY 或 CLOUDFLARE_API_TOKEN");
  }

  // 若配置了 Email，使用 Legacy API Key 认证
  if (email) {
    return {
      "X-Auth-Email": email,
      "X-Auth-Key": apiKey,
      "Content-Type": "application/json",
    };
  }
  // 否则使用 API Token（Bearer）
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

async function cfFetch(path, options = {}) {
  const url = `https://api.cloudflare.com/client/v4${path}`;
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    const err = data.errors?.[0] || { message: res.statusText };
    throw new Error(`Cloudflare API 错误: ${err.message} (code: ${err.code})`);
  }
  if (!data.success) {
    throw new Error(data.errors?.[0]?.message || "API 请求失败");
  }
  return data;
}

async function getAccountId(headers) {
  const data = await cfFetch("/accounts", { headers });
  const accounts = data.result || [];
  if (accounts.length === 0) throw new Error("未找到 Cloudflare 账户");
  return accounts[0].id;
}

async function getZoneId(headers) {
  const data = await cfFetch(`/zones?name=${DOMAIN}`, { headers });
  const zones = data.result || [];
  if (zones.length > 0) return zones[0].id;
  return null;
}

async function createZone(headers, accountId) {
  const data = await cfFetch("/zones", {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: DOMAIN,
      account: { id: accountId },
      jump_start: true,
      type: "full",
    }),
  });
  const zone = data.result;
  console.log(`已创建 Zone: ${zone.name}，Zone ID: ${zone.id}`);
  console.log(`请到域名注册商处将 NS 记录改为: ${zone.name_servers.join(", ")}`);
  return zone.id;
}

async function listDnsRecords(headers, zoneId) {
  const data = await cfFetch(`/zones/${zoneId}/dns_records`, { headers });
  return data.result || [];
}

async function createOrUpdateDnsRecord(headers, zoneId, record) {
  const { name, type, content, proxied = false } = record;
  const fullName = name === "@" ? DOMAIN : `${name}.${DOMAIN}`;

  const records = await listDnsRecords(headers, zoneId);
  const existing = records.find(
    (r) => r.name === fullName && r.type === type
  );

  const body = { type, content, proxied, ttl: 1, name: fullName };

  if (existing) {
    await cfFetch(`/zones/${zoneId}/dns_records/${existing.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
    console.log(`已更新 DNS: ${fullName} ${type} -> ${content}`);
  } else {
    await cfFetch(`/zones/${zoneId}/dns_records`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    console.log(`已添加 DNS: ${fullName} ${type} -> ${content}`);
  }
}

async function main() {
  console.log("=== Cloudflare 域名配置 (js-clawhub.com) ===\n");

  const env = loadEnv();
  const headers = getAuthHeaders(env);

  // 1. 获取或创建 Zone
  let zoneId = await getZoneId(headers);
  if (!zoneId) {
    console.log("未找到 Zone，尝试创建...");
    const accountId = await getAccountId(headers);
    zoneId = await createZone(headers, accountId);
  } else {
    console.log(`已找到 Zone: ${DOMAIN}`);
  }

  // 2. 添加 DNS 记录（GitHub Pages）
  const records = [
    { name: "@", type: "CNAME", content: GITHUB_PAGES_TARGET, proxied: false },
    { name: "www", type: "CNAME", content: GITHUB_PAGES_TARGET, proxied: false },
  ];

  for (const record of records) {
    await createOrUpdateDnsRecord(headers, zoneId, record);
  }

  console.log("\n配置完成。DNS 生效可能需要几分钟。");
  console.log(`请确保 GitHub Pages 已设置自定义域: ${DOMAIN}`);
}

main().catch((err) => {
  console.error("错误:", err.message);
  process.exit(1);
});
