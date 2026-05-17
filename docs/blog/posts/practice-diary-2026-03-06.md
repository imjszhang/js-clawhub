
# 从 URL 到知识库：构建无人值守的知识收集器闭环

> Day 35 · 2026-03-06

今天的主线任务是将 `js-knowledge-collector` 从一个独立的 CLI 工具彻底改造为 OpenClaw 插件，并解决长链路自动化中的主会话阻塞问题。面对日益增长的素材规模，我意识到必须通过架构分层与 inbox/batch 轮转机制，将散乱的时间线笔记转化为高可用、可自我进化的结构化知识资产。

## 采用 inbox/batch 轮转与专用 Scraper 架构，彻底解决主会话阻塞

在早期的测试中，我发现直接调用 `knowledge_collect` 工具会导致主会话长时间无响应。单次抓取加 LLM 总结（生成概要、摘要、推荐理由）耗时往往在 10 到 30 秒之间，这在交互式对话中是不可接受的阻塞。为了解决这个问题，我确立了“主会话只入队，Cron 隔离处理”的核心策略。

具体实现上，我设计了 `inbox/batch` 轮转机制。用户在对话中发送链接时，Agent 仅执行毫秒级的写入操作，将 URL 追加到 `inbox.jsonl` 文件中。随后，通过每 30 分钟触发一次的 Cron 任务，原子化地将 `inbox.jsonl` 重命名为 `batch-{timestamp}.jsonl`，并立即创建一个新的空 `inbox.jsonl` 以接收新链接。这种文件层面的隔离确保了收集侧与处理侧互不干扰。

针对不同平台的差异化处理，我在 `cli/lib` 目录下构建了专用的 Scraper 架构。对于微信公众号、知乎等服务端渲染页面，使用基于 Cheerio 的 `web-scraper.js` 进行直接抓取；而对于小红书、X.com 等强依赖 JavaScript 或需登录的 SPA 页面，则通过 WebSocket 调用 `JS-Eyes` 插件控制真实浏览器进行自动化抓取。特别是针对 Bilibili 和 YouTube，我编写了专用解析器以提取视频信息及字幕。这一套组合拳最终实现了从 URL 到 SQLite 入库再到 Flomo 推送的全链路无人值守闭环。

## 构建基于 CLI 显式注册与数据隔离的 Link-Collector 技能

为了将上述架构落地为可复用的能力，我开发了 `link-collector` 技能。在设计之初，我面临一个关键决策：是将技能硬编码在插件中自动运行，还是交给用户显式控制？考虑到 Cron 任务每次触发都会消耗 LLM Token，我最终选择了后者。

我在插件的 `index.mjs` 中新增了 `setup-collector` CLI 子命令。用户只需执行 `openclaw knowledge setup-collector` 即可注册定时任务，同时也支持 `--every` 参数自定义频率或 `--remove` 移除任务。这种设计遵循了“代码只读共享、数据 Workspace 独立”的原则：技能定义文件（`SKILL.md` 和 `references/`）随插件分发，所有 Workspace 共享同一套逻辑；而运行时数据（`inbox.jsonl`、`batch` 文件及 `archive/` 归档目录）则严格存储在各自 Workspace 的 `.openclaw/link-collector/` 目录下。

在并发安全方面，我利用 JSONL 格式的特性，确保单行损坏不影响其他记录，并设计了完善的状态流转机制：处理失败的条目若重试次数小于 3 次会自动回写至 `inbox.jsonl` 等待下一轮重试，超过 3 次则标记为永久失败。这种容错设计保证了即使在 Agent 崩溃或网络波动的情况下，知识收集流程也能自动恢复，不会丢失任何有价值的链接。

## 改造 js-knowledge-collector 为纯 ESM 插件架构，实现 Web UI 无缝集成

项目的最后一块拼图是将原有的独立 HTTP 服务器整合进 OpenClaw Gateway。参照 `JS-Eyes` 插件的结构，我在项目根目录创建了 `openclaw-plugin/` 子目录，包含 `openclaw.plugin.json`、`package.json` 和入口文件 `index.mjs`。

在开发过程中，我踩了一个典型的 ESM 兼容坑。起初我照搬旧例，试图使用 `createRequire(import.meta.url)` 来加载项目内部的 `.js` 模块，结果抛出了 `ERR_REQUIRE_ESM` 错误。这是因为本项目已全面转向 `"type": "module"`，所有内部模块均为 ESM 格式。解决方案非常干脆：移除 `createRequire`，全面改用动态 `import()`。这不仅解决了兼容性问题，还带来了懒加载的额外收益，减少了插件启动时的内存占用。

另一个挑战是 Web UI 的路由暴露。原前端代码中的 API 请求使用的是相对路径（如 `fetch('api/v1/articles.json')`），这反而成了优势。通过在 `index.mjs` 中注册 `/plugins/knowledge/` 前缀下的 HTTP 路由，浏览器自动将相对路径解析为完整的 Gateway 地址，无需修改任何前端代码。为了适应 Gateway 环境，我将数据库连接模式从“长连接”改为“按请求开关”，即在每个 HTTP 请求 handler 中动态 `import` 数据库模块、连接、查询并立即关闭，避免了长期持有 SQLite 文件句柄导致的锁定问题。同时，通过 `applyEnv()` 函数将 `pluginConfig` 中的配置注入 `process.env`，实现了业务代码零改动下的双模式（CLI 与插件）运行。

## 今天的收获

- **架构解耦是自动化的前提**：通过 `inbox/batch` 文件轮转机制，将耗时的 LLM 处理从主会话剥离，既保证了交互流畅度，又实现了 cron 任务的原子化与容错重试。
- **ESM 项目严禁混用 require**：在纯 ESM 项目中加载内部模块必须使用动态 `import()`，`createRequire` 仅适用于加载 CJS 依赖，混用会导致 `ERR_REQUIRE_ESM`。
- **相对路径前端天然适配网关**：前端 API 调用若使用无前导斜杠的相对路径，可天然兼容 Gateway 的路由前缀，无需硬编码 host 或修改 fetch 逻辑。
- **数据库连接需按需开关**：在 Serverless 或网关路由场景下，数据库连接应在请求级别建立与关闭，防止文件句柄长期占用引发并发冲突。
- **用户显式控制资源消耗**：对于涉及 Token 消耗的自动化任务（如 Cron），应提供 CLI 命令供用户显式注册与管理，而非插件安装时自动静默执行。

- [G52-knowledge-collector-automation.md](./G52-knowledge-collector-automation.md)
- [G45-link-collector-skill-design.md](./G45-link-collector-skill-design.md)
- [G46-js-knowledge-collector-plugin.md](./G46-js-knowledge-collector-plugin.md)
