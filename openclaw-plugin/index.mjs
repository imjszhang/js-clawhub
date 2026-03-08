import nodePath from "node:path";
import nodeFs from "node:fs";
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
  if (pluginCfg.llmApiBaseUrl) process.env.LLM_API_BASE_URL = pluginCfg.llmApiBaseUrl;
  if (pluginCfg.llmApiKey) process.env.LLM_API_KEY = pluginCfg.llmApiKey;
  if (pluginCfg.llmApiModel) process.env.LLM_API_MODEL = pluginCfg.llmApiModel;
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
    },
    { commands: ["hub"] },
  );

  // ---------------------------------------------------------------------------
  // HTTP Routes: static site + API
  // ---------------------------------------------------------------------------

  api.registerHttpRoute({
    path: `${ROUTE_PREFIX}`,
    auth: "plugin",
    async handler(req, res) {
      res.writeHead(301, { Location: `${ROUTE_PREFIX}/` });
      res.end();
    },
  });

  api.registerHttpRoute({
    path: `${ROUTE_PREFIX}/`,
    auth: "plugin",
    async handler(_req, res) {
      serveStaticFile(res, nodePath.join(SRC_DIR, "index.html"));
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

  api.registerHttpRoute({
    path: `${ROUTE_PREFIX}/{filePath}`,
    auth: "plugin",
    async handler(req, res) {
      const parsed = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const subPath = decodeURIComponent(
        parsed.pathname.slice(ROUTE_PREFIX.length + 1),
      );

      if (subPath.startsWith("api/")) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
        return;
      }

      const filePath = nodePath.normalize(nodePath.join(SRC_DIR, subPath));
      if (!filePath.startsWith(SRC_DIR)) {
        res.writeHead(403, { "Content-Type": "text/plain" });
        res.end("Forbidden");
        return;
      }
      if (!nodeFs.existsSync(filePath)) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
        return;
      }
      serveStaticFile(res, filePath);
    },
  });
}
