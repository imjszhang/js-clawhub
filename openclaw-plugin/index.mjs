import nodePath from "node:path";
import nodeFs from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = nodePath.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = nodePath.resolve(__dirname, "..");
const SRC_DIR = nodePath.join(PROJECT_ROOT, "src");

const ROUTE_PREFIX = "/plugins/js-clawhub";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function applyEnv(pluginCfg) {
  if (pluginCfg.llmApiBaseUrl) {
    process.env.LLM_API_BASE_URL = pluginCfg.llmApiBaseUrl;
    process.env.CLAWHUB_API_BASE_URL = pluginCfg.llmApiBaseUrl;
  }
  if (pluginCfg.llmApiKey) {
    process.env.LLM_API_KEY = pluginCfg.llmApiKey;
    process.env.CLAWHUB_API_KEY = pluginCfg.llmApiKey;
  }
  if (pluginCfg.llmApiModel) {
    process.env.LLM_API_MODEL = pluginCfg.llmApiModel;
    process.env.CLAWHUB_API_MODEL = pluginCfg.llmApiModel;
  }
  if (pluginCfg.cloudflareApiToken) process.env.CLOUDFLARE_API_TOKEN = pluginCfg.cloudflareApiToken;
  if (pluginCfg.cloudflareEmail) process.env.CLOUDFLARE_EMAIL = pluginCfg.cloudflareEmail;
  if (pluginCfg.githubToken) process.env.GITHUB_TOKEN = pluginCfg.githubToken;
  if (pluginCfg.gaId) process.env.GA_ID = pluginCfg.gaId;
}

function textResult(text) {
  return { content: [{ type: "text", text }] };
}

function jsonResult(data) {
  return textResult(JSON.stringify(data, null, 2));
}

function sendJson(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  });
  res.end(payload);
}

function serveStaticFile(res, filePath) {
  const ext = nodePath.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || "application/octet-stream";
  const stream = nodeFs.createReadStream(filePath);
  stream.on("error", () => {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  });
  res.writeHead(200, { "Content-Type": mime });
  stream.pipe(res);
}

// ---------------------------------------------------------------------------
// Plugin entry
// ---------------------------------------------------------------------------

export default function register(api) {
  const pluginCfg = api.pluginConfig ?? {};
  applyEnv(pluginCfg);

  // ---------------------------------------------------------------------------
  // Tools
  // ---------------------------------------------------------------------------

  api.registerTool({
    name: "clawhub_search",
    label: "ClawHub: Search",
    description:
      "在 ClawHub 中跨源搜索。覆盖 pulse（社区动态）、project（项目）、skill（技能）、blog（博客）、guide（指南）五个数据源。",
    parameters: {
      type: "object",
      properties: {
        keyword: { type: "string", description: "搜索关键词" },
        type: {
          type: "string",
          description: "限定搜索源：pulse | project | skill | blog | guide（留空搜索全部）",
        },
      },
      required: ["keyword"],
    },
    async execute(_toolCallId, params) {
      try {
        const { search } = await import("../cli/lib/search.js");
        const results = search(params.keyword, params.type);
        if (!results || results.length === 0) {
          return textResult(`未找到包含「${params.keyword}」的结果。`);
        }
        return jsonResult(results);
      } catch (err) {
        return textResult(`搜索失败: ${err.message}`);
      }
    },
  });

  api.registerTool({
    name: "clawhub_projects",
    label: "ClawHub: Projects",
    description:
      "列出 OpenClaw 生态项目目录。支持按分类和标签筛选。",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "按分类筛选（如 messaging、ai-models、productivity 等）",
        },
        tag: {
          type: "string",
          description: "按标签筛选（如 official、community 等）",
        },
      },
    },
    async execute(_toolCallId, params) {
      try {
        const { readProjects } = await import("../cli/lib/data-reader.js");
        const results = readProjects({
          category: params.category,
          tag: params.tag,
        });
        if (!results || results.length === 0) {
          return textResult("未找到匹配的项目。");
        }
        return jsonResult(results);
      } catch (err) {
        return textResult(`查询失败: ${err.message}`);
      }
    },
  });

  api.registerTool({
    name: "clawhub_skills",
    label: "ClawHub: Skills",
    description: "列出 ClawHub 技能市场中的技能。支持按分类筛选。",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "按分类筛选（如 productivity、development 等）",
        },
      },
    },
    async execute(_toolCallId, params) {
      try {
        const { readSkills } = await import("../cli/lib/data-reader.js");
        const results = readSkills({ category: params.category });
        if (!results || results.length === 0) {
          return textResult("未找到匹配的技能。");
        }
        return jsonResult(results);
      } catch (err) {
        return textResult(`查询失败: ${err.message}`);
      }
    },
  });

  api.registerTool({
    name: "clawhub_blog",
    label: "ClawHub: Blog",
    description:
      "列出 ClawHub 博客文章，或获取某篇文章的完整 Markdown 内容。不传 slug 时返回文章列表，传 slug 时返回正文。",
    parameters: {
      type: "object",
      properties: {
        slug: { type: "string", description: "文章 slug（传入则返回完整 Markdown 正文）" },
        tag: { type: "string", description: "按标签筛选列表" },
        latest: { type: "number", description: "只返回最新 N 篇" },
      },
    },
    async execute(_toolCallId, params) {
      try {
        if (params.slug) {
          const { readBlogPost } = await import("../cli/lib/data-reader.js");
          const content = readBlogPost(params.slug);
          if (!content) {
            return textResult(`未找到 slug 为「${params.slug}」的博客文章。`);
          }
          return textResult(content);
        }
        const { readBlog } = await import("../cli/lib/data-reader.js");
        const results = readBlog({ tag: params.tag, latest: params.latest });
        if (!results || results.length === 0) {
          return textResult("暂无博客文章。");
        }
        return jsonResult(results);
      } catch (err) {
        return textResult(`查询失败: ${err.message}`);
      }
    },
  });

  api.registerTool({
    name: "clawhub_guide",
    label: "ClawHub: Guide",
    description:
      "列出 ClawHub 入门指南，或获取某篇指南的完整 Markdown 内容。不传 slug 时返回指南列表，传 slug 时返回正文。",
    parameters: {
      type: "object",
      properties: {
        slug: { type: "string", description: "指南 slug（传入则返回完整 Markdown 正文）" },
      },
    },
    async execute(_toolCallId, params) {
      try {
        if (params.slug) {
          const { readGuideArticle } = await import("../cli/lib/data-reader.js");
          const content = readGuideArticle(params.slug);
          if (!content) {
            return textResult(`未找到 slug 为「${params.slug}」的指南文章。`);
          }
          return textResult(content);
        }
        const { readGuide } = await import("../cli/lib/data-reader.js");
        const results = readGuide();
        if (!results || results.length === 0) {
          return textResult("暂无指南文章。");
        }
        return jsonResult(results);
      } catch (err) {
        return textResult(`查询失败: ${err.message}`);
      }
    },
  });

  api.registerTool({
    name: "clawhub_pulse",
    label: "ClawHub: Pulse",
    description:
      "列出 ClawHub 社区 Pulse（X/Twitter 精选动态）。支持按天数、评分、作者筛选。",
    parameters: {
      type: "object",
      properties: {
        days: { type: "number", description: "只返回最近 N 天的动态" },
        minScore: { type: "number", description: "最低评分阈值（0-1）" },
        author: { type: "string", description: "按作者筛选（如 @username）" },
        limit: { type: "number", description: "最多返回条数" },
      },
    },
    async execute(_toolCallId, params) {
      try {
        const { readPulse } = await import("../cli/lib/data-reader.js");
        const results = readPulse({
          days: params.days,
          minScore: params.minScore,
          author: params.author,
          limit: params.limit,
        });
        if (!results || results.length === 0) {
          return textResult("暂无 Pulse 动态。");
        }
        return jsonResult(results);
      } catch (err) {
        return textResult(`查询失败: ${err.message}`);
      }
    },
  });

  api.registerTool({
    name: "clawhub_stats",
    label: "ClawHub: Stats",
    description: "获取 ClawHub 站点的汇总统计信息（各数据源条目数、最新日期等）。",
    parameters: { type: "object", properties: {} },
    async execute() {
      try {
        const { getStats } = await import("../cli/lib/data-reader.js");
        const stats = getStats();
        const lines = [
          "## ClawHub 统计",
          `  Pulse 动态: ${stats.pulse_count}`,
          `  项目: ${stats.projects_count}`,
          `  技能: ${stats.skills_count}`,
          `  博客: ${stats.blog_count}`,
          `  指南: ${stats.guide_count}`,
        ];
        if (stats.pulse_latest_date) lines.push(`  Pulse 最新日期: ${stats.pulse_latest_date}`);
        if (stats.blog_latest_date) lines.push(`  博客最新日期: ${stats.blog_latest_date}`);
        return textResult(lines.join("\n"));
      } catch (err) {
        return textResult(`统计查询失败: ${err.message}`);
      }
    },
  });

  api.registerTool({
    name: "clawhub_featured",
    label: "ClawHub: Featured",
    description: "获取 ClawHub 首页精选内容（推荐项目、指南、博客）。",
    parameters: { type: "object", properties: {} },
    async execute() {
      try {
        const { listFeatured } = await import("../cli/lib/featured.js");
        const featured = listFeatured();
        return jsonResult(featured);
      } catch (err) {
        return textResult(`查询失败: ${err.message}`);
      }
    },
  });

  // ---------------------------------------------------------------------------
  // Tool: clawhub_blog_auto_sync (cron target)
  // ---------------------------------------------------------------------------

  api.registerTool({
    name: "clawhub_blog_auto_sync",
    label: "ClawHub: Blog Auto Sync",
    description:
      "自动同步博客：从所有已注册源导入新文章、翻译未翻译文章、构建站点、提交并推送。" +
      "供 cron 定时任务调用，也可手动触发。",
    parameters: {
      type: "object",
      properties: {
        dryRun: {
          type: "boolean",
          description: "预览模式，不实际写入/提交。默认 false。",
        },
        skipTranslate: {
          type: "boolean",
          description: "跳过翻译步骤。默认 false。",
        },
        skipBuild: {
          type: "boolean",
          description: "跳过构建步骤。默认 false。",
        },
        skipPush: {
          type: "boolean",
          description: "跳过推送步骤。默认 false。",
        },
      },
    },
    async execute(_toolCallId, params) {
      const dryRun = params.dryRun ?? false;
      const skipTranslate = params.skipTranslate ?? false;
      const skipBuild = params.skipBuild ?? false;
      const skipPush = params.skipPush ?? false;

      const lines = [];
      const log = (msg) => lines.push(msg);

      try {
        // Step 0: Pull latest from GitHub
        log("── 同步仓库 ──");
        try {
          const { gitPullRebase, gitStatus } = await import("../cli/lib/git.js");
          const status = gitStatus();
          const pullResult = gitPullRebase("origin", status.branch);
          log(`  已拉取 origin/${pullResult.branch} (rebase, autostash)`);
        } catch (err) {
          log(`  拉取失败: ${err.message}`);
        }

        const { blogImport, blogSources, blogTranslateUntranslated } =
          await import("../cli/lib/blog-importer.js");

        // Step 1: Import from all sources
        log("── 博客导入 ──");
        const sources = blogSources();
        let totalImported = 0;
        let totalSkipped = 0;

        for (const src of sources) {
          if (!src.available) {
            log(`  ${src.id}: 源路径不可用，跳过`);
            continue;
          }
          if (src.pendingFiles === 0) {
            log(`  ${src.id}: 无新文件`);
            totalSkipped += src.importedFiles;
            continue;
          }
          try {
            const result = blogImport(src.id, { dryRun });
            totalImported += result.imported;
            totalSkipped += result.skipped;
            log(`  ${src.id}: 导入 ${result.imported}, 跳过 ${result.skipped}`);
          } catch (err) {
            log(`  ${src.id}: 导入失败 — ${err.message}`);
          }
        }
        log(`  合计: 导入 ${totalImported}, 跳过 ${totalSkipped}`);

        // Step 2: Translate
        let translateResult = null;
        if (!skipTranslate && totalImported > 0 && !dryRun) {
          log("");
          log("── 博客翻译 ──");
          try {
            translateResult = await blogTranslateUntranslated({ dryRun });
            log(`  翻译 ${translateResult.translated}, 跳过 ${translateResult.skipped}, 错误 ${translateResult.errors}`);
          } catch (err) {
            log(`  翻译失败: ${err.message}`);
          }
        } else if (skipTranslate) {
          log("\n── 博客翻译 ── 已跳过");
        } else if (totalImported === 0) {
          log("\n── 博客翻译 ── 无新导入，跳过");
        }

        // Step 3: Build
        let buildResult = null;
        if (!skipBuild && totalImported > 0 && !dryRun) {
          log("");
          log("── 构建站点 ──");
          try {
            const { build } = await import("../cli/lib/builder.js");
            buildResult = build({ clean: true });
            log(`  构建完成: ${buildResult.filesCopied ?? 0} 个文件`);
          } catch (err) {
            log(`  构建失败: ${err.message}`);
          }
        } else if (skipBuild) {
          log("\n── 构建站点 ── 已跳过");
        } else if (totalImported === 0) {
          log("\n── 构建站点 ── 无新导入，跳过");
        }

        // Step 4: Commit + Push
        let commitResult = null;
        if (totalImported > 0 && !dryRun) {
          log("");
          log("── 提交推送 ──");
          try {
            const {
              gitStatus, gitAddAll, gitDiffStat, gitCommit, gitPush,
              generateCommitMessage,
            } = await import("../cli/lib/git.js");

            gitAddAll();
            const { files } = gitDiffStat();
            if (files.length === 0) {
              log("  无变更，跳过提交");
            } else {
              const message = generateCommitMessage(files);
              const { hash } = gitCommit(message);
              commitResult = { hash, message, files: files.length };
              log(`  已提交: ${message} (${hash.slice(0, 7)})`);

              if (!skipPush) {
                const status = gitStatus();
                gitPush("origin", status.branch);
                log(`  已推送到 origin/${status.branch}`);
              } else {
                log("  推送已跳过");
              }
            }
          } catch (err) {
            log(`  提交/推送失败: ${err.message}`);
          }
        }

        // Summary
        log("");
        log("── 完成 ──");
        const summary = {
          imported: totalImported,
          translated: translateResult?.translated ?? 0,
          built: !!buildResult,
          committed: !!commitResult,
          dryRun,
        };
        log(JSON.stringify(summary));

        return textResult(lines.join("\n"));
      } catch (err) {
        return textResult(`自动同步失败: ${err.message}`);
      }
    },
  });

  // ---------------------------------------------------------------------------
  // CLI: openclaw hub {search|stats|projects|skills|blog|pulse|build|pull|sync}
  // ---------------------------------------------------------------------------

  api.registerCli(
    ({ program }) => {
      const hub = program
        .command("hub")
        .description("JS ClawHub — OpenClaw 生态导航与内容中心");

      hub
        .command("search <keyword>")
        .description("跨源搜索（pulse/project/skill/blog/guide）")
        .option("--type <type>", "限定搜索源")
        .action(async (keyword, opts) => {
          const { search } = await import("../cli/lib/search.js");
          const results = search(keyword, opts.type);
          console.log(JSON.stringify(results, null, 2));
        });

      hub
        .command("stats")
        .description("查看站点统计")
        .action(async () => {
          const { getStats } = await import("../cli/lib/data-reader.js");
          const stats = getStats();
          console.log("\n=== ClawHub 统计 ===");
          console.log(`  Pulse 动态: ${stats.pulse_count}`);
          console.log(`  项目: ${stats.projects_count}`);
          console.log(`  技能: ${stats.skills_count}`);
          console.log(`  博客: ${stats.blog_count}`);
          console.log(`  指南: ${stats.guide_count}`);
          if (stats.pulse_latest_date) console.log(`  Pulse 最新: ${stats.pulse_latest_date}`);
          if (stats.blog_latest_date) console.log(`  博客最新: ${stats.blog_latest_date}`);
          console.log("");
        });

      hub
        .command("projects")
        .description("列出项目目录")
        .option("--category <id>", "按分类筛选")
        .option("--tag <tag>", "按标签筛选")
        .action(async (opts) => {
          const { readProjects } = await import("../cli/lib/data-reader.js");
          console.log(JSON.stringify(readProjects(opts), null, 2));
        });

      hub
        .command("skills")
        .description("列出技能市场")
        .option("--category <cat>", "按分类筛选")
        .action(async (opts) => {
          const { readSkills } = await import("../cli/lib/data-reader.js");
          console.log(JSON.stringify(readSkills(opts), null, 2));
        });

      hub
        .command("blog")
        .description("列出博客文章")
        .option("--tag <tag>", "按标签筛选")
        .option("--latest <n>", "只返回最新 N 篇")
        .action(async (opts) => {
          const { readBlog } = await import("../cli/lib/data-reader.js");
          const o = {};
          if (opts.tag) o.tag = opts.tag;
          if (opts.latest) o.latest = parseInt(opts.latest, 10);
          console.log(JSON.stringify(readBlog(o), null, 2));
        });

      hub
        .command("pulse")
        .description("列出 Pulse 动态")
        .option("--days <n>", "最近 N 天")
        .option("--min-score <n>", "最低评分")
        .option("--author <handle>", "按作者筛选")
        .option("--limit <n>", "最多返回条数")
        .action(async (opts) => {
          const { readPulse } = await import("../cli/lib/data-reader.js");
          const o = {};
          if (opts.days) o.days = parseInt(opts.days, 10);
          if (opts.minScore) o.minScore = parseFloat(opts.minScore);
          if (opts.author) o.author = opts.author;
          if (opts.limit) o.limit = parseInt(opts.limit, 10);
          console.log(JSON.stringify(readPulse(o), null, 2));
        });

      hub
        .command("build")
        .description("构建站点：src/ → docs/")
        .option("--skip-ga", "跳过 GA 注入")
        .option("--skip-i18n", "跳过 i18n 校验")
        .option("--dry-run", "仅校验不写入")
        .option("--no-clean", "不清空 docs/")
        .action(async (opts) => {
          const { build } = await import("../cli/lib/builder.js");
          const result = build({
            clean: opts.clean !== false,
            skipGa: !!opts.skipGa,
            skipI18n: !!opts.skipI18n,
            dryRun: !!opts.dryRun,
          });
          console.log(JSON.stringify(result, null, 2));
        });

      hub
        .command("pull")
        .description("从 js-moltbook 拉取数据")
        .option("--source <path>", "moltbook publisher 输出路径")
        .option("--type <type>", "拉取类型: pulse|weekly|all", "all")
        .option("--dry-run", "预览模式")
        .action(async (opts) => {
          const { pull } = await import("../cli/lib/puller.js");
          const source = opts.source || pluginCfg.moltbookPath || undefined;
          const result = pull({
            source,
            type: opts.type,
            dryRun: !!opts.dryRun,
          });
          console.log(JSON.stringify(result, null, 2));
        });

      hub
        .command("sync")
        .description("构建 + 提交 + 推送")
        .option("--no-build", "跳过构建")
        .option("--no-push", "跳过推送")
        .option("--message <msg>", "自定义 commit message")
        .option("--dry-run", "预览模式")
        .action(async (opts) => {
          const { build } = await import("../cli/lib/builder.js");
          const {
            gitStatus, gitAddAll, gitDiffStat, gitCommit, gitPush, generateCommitMessage,
          } = await import("../cli/lib/git.js");

          const dryRun = !!opts.dryRun;
          const noBuild = opts.build === false;
          const noPush = opts.push === false;
          const result = { build: null, commit: null, push: null };
          const status = gitStatus();

          if (!noBuild) {
            console.log("── Build ──");
            result.build = build({ clean: true, dryRun });
          }
          if (dryRun) {
            console.log("[dry-run] Skipping commit and push.");
            console.log(JSON.stringify({ ...result, dryRun: true }, null, 2));
            return;
          }

          gitAddAll();
          const { files } = gitDiffStat();
          if (files.length === 0) {
            console.log("Nothing to commit.");
            console.log(JSON.stringify({ ...result, commit: { committed: false } }, null, 2));
            return;
          }

          const message = opts.message || generateCommitMessage(files);
          console.log(`── Commit: ${message} ──`);
          const { hash } = gitCommit(message);
          result.commit = { committed: true, hash, message, files };

          if (!noPush) {
            console.log(`── Push → origin/${status.branch} ──`);
            result.push = gitPush("origin", status.branch);
          }
          console.log(JSON.stringify(result, null, 2));
        });

      hub
        .command("setup-cloudflare")
        .description("配置 Cloudflare DNS 指向 GitHub Pages")
        .action(async () => {
          try {
            const { setupCloudflare } = await import("../cli/lib/setup.js");
            await setupCloudflare();
          } catch (err) {
            console.error(`配置失败: ${err.message}`);
          }
        });

      hub
        .command("setup-github-pages")
        .description("配置 GitHub Pages 自定义域名 + HTTPS")
        .action(async () => {
          try {
            const { setupGithubPages } = await import("../cli/lib/setup.js");
            await setupGithubPages();
          } catch (err) {
            console.error(`配置失败: ${err.message}`);
          }
        });

      hub
        .command("setup-cron")
        .description("配置博客自动同步的 cron 定时任务（导入 + 翻译 + 构建 + 推送）")
        .option("--every <minutes>", "执行间隔（分钟）", String(pluginCfg.cron?.defaultInterval ?? 120))
        .option("--tz <timezone>", "时区（IANA）", pluginCfg.cron?.timezone ?? "Asia/Shanghai")
        .option("--remove", "移除定时任务")
        .action(async (opts) => {
          const JOB_NAME = "clawhub-blog-sync";
          const openclawBin = process.argv[0];
          const openclawEntry = process.argv[1];

          function runOcCron(args) {
            return execFileSync(openclawBin, [openclawEntry, "cron", ...args], {
              encoding: "utf-8",
              timeout: 30_000,
              windowsHide: true,
            }).trim();
          }

          try {
            if (opts.remove) {
              const listJson = runOcCron(["list", "--json"]);
              const { jobs } = JSON.parse(listJson);
              const existing = jobs.find((j) => j.name === JOB_NAME);
              if (!existing) {
                console.log(`\n  未找到名为 "${JOB_NAME}" 的定时任务，无需移除。\n`);
                return;
              }
              runOcCron(["rm", existing.id]);
              console.log(`\n  已移除定时任务 "${JOB_NAME}" (${existing.id})\n`);
              return;
            }

            const listJson = runOcCron(["list", "--json"]);
            const { jobs } = JSON.parse(listJson);
            const existing = jobs.find((j) => j.name === JOB_NAME);
            if (existing) {
              console.log(`\n  定时任务 "${JOB_NAME}" 已存在 (${existing.id})。`);
              console.log(`  如需重新配置，请先执行: openclaw hub setup-cron --remove\n`);
              return;
            }

            const minutes = parseInt(opts.every, 10);
            if (isNaN(minutes) || minutes < 1) {
              console.error("  错误: --every 必须为正整数（分钟）");
              return;
            }

            const cronExpr = `*/${minutes} * * * *`;
            const result = runOcCron([
              "add",
              "--name", JOB_NAME,
              "--cron", cronExpr,
              "--tz", opts.tz,
              "--session", "isolated",
              "--message", "执行 ClawHub 博客自动同步：导入所有源的新文章，翻译未翻译文章，构建并推送站点。",
              "--thinking", "minimal",
              "--json",
            ]);

            const job = JSON.parse(result);
            console.log(`\n  定时任务已创建`);
            console.log(`    名称: ${job.name}`);
            console.log(`    ID:   ${job.id}`);
            console.log(`    调度: 每 ${minutes} 分钟`);
            console.log(`    时区: ${opts.tz}\n`);
          } catch (err) {
            console.error(`  配置失败: ${err.message}`);
            if (err.stderr) console.error(err.stderr);
          }
        });
    },
    { commands: ["hub"] },
  );

  // ---------------------------------------------------------------------------
  // HTTP Routes: static site + API
  // ---------------------------------------------------------------------------

  api.registerHttpRoute({
    path: `${ROUTE_PREFIX}/`,
    auth: "plugin",
    match: "prefix",
    async handler(req, res) {
      const parsed = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const subPath = decodeURIComponent(
        parsed.pathname.slice(ROUTE_PREFIX.length + 1),
      );

      if (subPath.startsWith("api/")) {
        return false;
      }

      let filePath = nodePath.normalize(nodePath.join(SRC_DIR, subPath));
      if (filePath !== SRC_DIR && !filePath.startsWith(SRC_DIR + nodePath.sep)) {
        res.writeHead(403, { "Content-Type": "text/plain" });
        res.end("Forbidden");
        return true;
      }

      if (nodeFs.existsSync(filePath) && nodeFs.statSync(filePath).isDirectory()) {
        filePath = nodePath.join(filePath, "index.html");
      }

      if (!nodeFs.existsSync(filePath)) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
        return true;
      }
      serveStaticFile(res, filePath);
      return true;
    },
  });

  api.registerHttpRoute({
    path: `${ROUTE_PREFIX}/api/v1/projects.json`,
    auth: "plugin",
    async handler(req, res) {
      if (req.method === "OPTIONS") {
        res.writeHead(204, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
        });
        res.end();
        return;
      }
      try {
        const { readProjects } = await import("../cli/lib/data-reader.js");
        sendJson(res, 200, { status: "success", data: readProjects() });
      } catch (err) {
        sendJson(res, 500, { status: "error", message: err.message });
      }
    },
  });

  api.registerHttpRoute({
    path: `${ROUTE_PREFIX}/api/v1/stats.json`,
    auth: "plugin",
    async handler(_req, res) {
      try {
        const { getStats } = await import("../cli/lib/data-reader.js");
        sendJson(res, 200, { status: "success", data: getStats() });
      } catch (err) {
        sendJson(res, 500, { status: "error", message: err.message });
      }
    },
  });

  api.registerHttpRoute({
    path: `${ROUTE_PREFIX}/api/v1/featured.json`,
    auth: "plugin",
    async handler(_req, res) {
      try {
        const { listFeatured } = await import("../cli/lib/featured.js");
        sendJson(res, 200, { status: "success", data: listFeatured() });
      } catch (err) {
        sendJson(res, 500, { status: "error", message: err.message });
      }
    },
  });

  api.registerHttpRoute({
    path: `${ROUTE_PREFIX}/api/v1/skills.json`,
    auth: "plugin",
    async handler(_req, res) {
      try {
        const { readSkills } = await import("../cli/lib/data-reader.js");
        sendJson(res, 200, { status: "success", data: readSkills() });
      } catch (err) {
        sendJson(res, 500, { status: "error", message: err.message });
      }
    },
  });

  api.registerHttpRoute({
    path: `${ROUTE_PREFIX}/api/v1/blog/index.json`,
    auth: "plugin",
    async handler(_req, res) {
      try {
        const { readBlog } = await import("../cli/lib/data-reader.js");
        sendJson(res, 200, { status: "success", data: readBlog() });
      } catch (err) {
        sendJson(res, 500, { status: "error", message: err.message });
      }
    },
  });

  api.registerHttpRoute({
    path: `${ROUTE_PREFIX}/api/v1/guide/index.json`,
    auth: "plugin",
    async handler(_req, res) {
      try {
        const { readGuide } = await import("../cli/lib/data-reader.js");
        sendJson(res, 200, { status: "success", data: readGuide() });
      } catch (err) {
        sendJson(res, 500, { status: "error", message: err.message });
      }
    },
  });

  api.registerHttpRoute({
    path: `${ROUTE_PREFIX}/api/v1/pulse/latest.json`,
    auth: "plugin",
    async handler(req, res) {
      try {
        const { readPulse } = await import("../cli/lib/data-reader.js");
        const parsed = new URL(req.url, `http://${req.headers.host || "localhost"}`);
        const limit = parseInt(parsed.searchParams.get("limit"), 10) || 20;
        sendJson(res, 200, { status: "success", data: readPulse({ limit }) });
      } catch (err) {
        sendJson(res, 500, { status: "error", message: err.message });
      }
    },
  });

}
