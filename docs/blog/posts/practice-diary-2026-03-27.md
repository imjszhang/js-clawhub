# 把编码外包给 Cursor：ACP 架构如何从结构上终结 OpenClaw 的高 Token 成本

> Day 56 · 2026-03-27

今天的主线任务非常明确：解决 OpenClaw 在编程场景下 Token 消耗过高的问题。我们发现，根本原因并非日常对话，而是读文件、写代码等高消耗操作直接占用了 Chat 模型的上下文。通过激活 ACP（Agent Client Protocol）运行时，我们将这些任务「外包」给外部 Harness（Cursor CLI），实现了主对话与编码执行的物理隔离，这不仅是优化，更是从成本角度使用 OpenClaw 的结构性必要措施。

## 架构原理：为何必须将读写操作剥离至外部 ACP 运行时

在深入代码之前，我首先厘清了 ACP 体系的三条关键概念，这也是之前容易混淆的地方。ACP 在 OpenClaw 中分为两条线：一条是 IDE 桥（如 Zed 通过 stdio 接 Gateway），另一条则是我们今天关注的「运行时 + 外挂 harness」。在这个模型中，ACP 运行时是 Gateway 里的会话策略管道，`cursor` 是注册到运行时的具体插件实现，而真正的「马」是被后端驱动的外部编码程序（Cursor CLI）。

核心逻辑在于成本结构的改变。OpenClaw 原生编程之所以贵，是因为每次文件读写都走 Chat 模型上下文。而 ACP 协议允许 Gateway 将这些任务外包，由外部工具（如 Cursor）自己的计费体系承担编码 Token。这意味着，我们不再需要为了写代码而消耗昂贵的 Gateway 上下文，OpenClaw 只负责编排和路由。这不是一个可选的性能优化，而是让系统在规模化下具备经济可行性的架构演进。

## 配置激活：严格遵循优先级以确保后端正确生效

理清原理后，我开始着手配置。分析 `d:\.openclaw\openclaw.json` 时发现，虽然 `js-cursor-agent` 插件已安装并实现了 `registerAcpRuntimeBackend`，但主配置中完全缺失 `acp` 块，导致「水管」接好了却没人开阀门。

ACP 的配置遵循严格的覆盖顺序：`bindings[].acp` > `agents.list[].runtime.acp` > 全局 `acp.*`。为了激活后端，我在全局配置中显式插入了 `acp` 块，设置 `enabled: true` 并指定 `backend: "cursor"`。同时，我在插件配置中补全了 `command`（指向 `agent.cmd` 的绝对路径）、`model`（设为 `composer-1.5`）以及 `permissionMode`。

此外，我还规范了插件的元数据文件 `openclaw.plugin.json`。参照 `acpx` 的格式，我声明了完整的 `configSchema` 和 `uiHints`，让用户可以在配置文件中直接定义模型和权限模式。关键的一步是，我移除了元数据中 `idleTtlMinutes` 和 `maxConcurrentSessions` 这两个字段，因为在 Gateway 模式下，这些限制应由 Gateway 统一管理，插件侧保留它们只会造成干扰。

## 代码适配：覆写本地限制以实现完全隔离并行

配置完成后，运行时测试暴露了一个深层冲突：插件原有的生命周期管理与 Gateway 发生了竞态。在 Gateway 模式下，插件自带的 `maxSessions` 和 `idleTtlMinutes` 限制不仅多余，还会阻碍长任务的执行。

为了解决这个问题，我在 `openclaw-plugin/index.mjs` 的入口文件中硬编码了覆写逻辑：`overrides = { maxSessions: 0, idleTtlMinutes: 0 }`。但这还不够，底层的配置解析逻辑默认会将 `0` 视为无效值并回退到默认设置。因此，我同步修改了 `core/config.js` 中的 `intOrDefault` 函数，使其支持 `parsed >= 0` 的判断，让 `0` 值能够穿透默认处理。紧接着，在 `core/process-manager.js` 中，我调整了逻辑：当 `maxSessions <= 0` 时跳过并发检查，当 `idleTtlMinutes <= 0` 时不启动回收器（reaper）。

这一系列改动确保了 ACP 会话拥有独立的 Session Key（格式为 `agent:main:acp:<uuid>`）。实测表明，这与主 Agent 的 `main` 通道完全隔离，拥有独立的 Actor Queue，实现了真正的并行执行。即使编码任务长时间运行，也不会阻塞主对话通道，仅共享 `maxConcurrentSessions` 定义的进程数上限。

## 运维监控：建立长任务的安全兜底与多模型扩展机制

架构落地后，我必须建立可靠的监控与扩展机制。ACP 长任务的单轮上限受限于 Gateway 的 `timeoutSeconds`（当前设为 4800 秒，约 80 分钟），但底层的 JSON-RPC 层提供了 24 小时的安全兜底，防止任务意外中断。空闲回收则由 Gateway 的 `RuntimeCache` 根据 `acp.runtime.ttlMinutes` 统一管理。

为了实时掌握状态，我验证了多层监控手段：在聊天侧可使用 `/acp status`、`/acp sessions` 和 `/acp doctor` 命令；在 CLI 侧则新增了 `openclaw cursor doctor` 和 `openclaw cursor sessions`。Gateway 日志也会每轮输出 `acp-dispatch` 详情，包含延迟和队列深度。

在模型灵活性方面，系统支持通过 `agent.cmd --list-models` 动态获取模型列表。本机实测可用模型超过 80 个，包括 `composer-1.5`、`claude-4.6-opus-high-thinking`、`gpt-5.4-medium` 等。未来若需引入 Codex 或 Claude Code，只需安装 `acpx` 作为第二后端即可实现多后端并存，而无需重构现有架构。

## 今天的收获

- **成本结构决定架构选型**：将高消耗的读写文件操作剥离至外部 ACP 运行时（如 Cursor），是从成本角度使用 OpenClaw 的结构性必要措施，而非简单的性能优化。
- **配置优先级的刚性约束**：ACP 配置遵循 `bindings` > `agents.list` > `global` 的覆盖顺序，必须在 `openclaw.json` 显式开启 `acp` 块并指定 `backend` 才能激活外部运行时。
- **生命周期管理的隔离原则**：在 Gateway 模式下，必须通过代码硬编码覆写插件的 `maxSessions` 和 `idleTtlMinutes` 为 0，并修改底层解析逻辑以支持 0 值穿透，避免与 Gateway 的生命周期管理冲突。
- **并行执行的 Session 隔离**：ACP 会话使用独立的 `agent:main:acp:<uuid>` 键值，确保长任务与主对话完全隔离且可并行执行，互不阻塞。
- **监控与扩展的标准化**：利用 `/acp` 系列命令和 `openclaw cursor doctor` 进行实时监控，并通过 `agent.cmd --list-models` 动态管理 80+ 可用模型，支持未来多后端扩展。
