/**
 * GitHub Pages 自定义域名 API 配置脚本
 * 通过 GitHub API 设置 js-clawhub.com 为 Pages 自定义域名
 *
 * 使用前请确保：
 * 1. .env 中配置 GITHUB_TOKEN（Personal Access Token）
 * 2. Token 需 repo 权限，或 Fine-grained 需 Pages + Administration 写权限
 * 3. 创建地址：https://github.com/settings/tokens
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DOMAIN = "js-clawhub.com";
const GITHUB_REPO = "imjszhang/js-clawhub";

function loadEnv() {
  const env = { ...process.env };
  const envPath = resolve(ROOT, ".env");
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) env[match[1].trim()] = match[2].trim();
    }
  }
  return env;
}

async function ghFetch(path, options = {}) {
  const token = loadEnv().GITHUB_TOKEN;
  if (!token) {
    throw new Error("请在 .env 中配置 GITHUB_TOKEN");
  }
  const url = `https://api.github.com${path}`;
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = data?.message || res.statusText;
    throw new Error(`GitHub API 错误: ${msg}`);
  }
  return data;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function updatePages(owner, repo, body) {
  await ghFetch(`/repos/${owner}/${repo}/pages`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function main() {
  console.log("=== GitHub Pages 自定义域名配置 ===\n");

  const [owner, repo] = GITHUB_REPO.split("/");

  // 获取当前 Pages 配置
  let source = { branch: "master", path: "/docs" };
  try {
    const pages = await ghFetch(`/repos/${owner}/${repo}/pages`);
    if (pages.source) {
      source = { branch: pages.source.branch, path: pages.source.path || "/" };
    }
  } catch (e) {
    if (e.message.includes("404")) {
      throw new Error("未找到 Pages 配置，请先在 GitHub 仓库 Settings → Pages 中启用 Pages");
    }
    throw e;
  }

  // 1. 先设置自定义域名（不启用 HTTPS）
  console.log(`设置自定义域名: ${DOMAIN} ...`);
  await updatePages(owner, repo, { cname: DOMAIN, source });
  console.log("自定义域名已设置，等待 DNS 验证...\n");

  // 2. 轮询等待域名验证通过
  const maxAttempts = 24; // 最多等 2 分钟
  const intervalMs = 5000;
  let domainVerified = false;

  for (let i = 0; i < maxAttempts; i++) {
    await sleep(intervalMs);
    const pages = await ghFetch(`/repos/${owner}/${repo}/pages`);
    const state = pages.protected_domain_state || "";
    const certState = pages.https_certificate?.state || "";

    console.log(`  [${i + 1}/${maxAttempts}] 域名状态: ${state}, 证书: ${certState}`);

    // 证书已签发即可启用 HTTPS（protected_domain_state 对用户 Pages 可能为空）
    if (certState === "approved") {
      domainVerified = true;
      break;
    }
  }

  if (!domainVerified) {
    console.log("\n域名验证超时，请稍后手动执行 npm run gh:pages 开启 HTTPS");
    return;
  }

  // 3. 域名验证通过后，启用强制 HTTPS
  console.log("\n域名已验证，启用强制 HTTPS...");
  await updatePages(owner, repo, { cname: DOMAIN, source, https_enforced: true });
  console.log("已启用强制 HTTPS");
}

main().catch((err) => {
  console.error("错误:", err.message);
  process.exit(1);
});
