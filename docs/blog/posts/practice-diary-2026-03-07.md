
# 从单库手动到多库自动：构建无人值守的知识生产流水线

> Day 36 · 2026-03-07

今天的核心任务是打破 `js-knowledge-prism` 插件的单库瓶颈，将其从“按需手动触发”升级为“多库 Cron 自动轮询”的无人值守模式。面对素材规模指数级增长，我参考了 `js-knowledge-collector` 的三层协作架构，但针对 Prism 的幂等特性做了关键剪裁，最终通过注册表机制与 `process_all` 工具封装，实现了低开销的自动化闭环。

## 突破单库限制：注册表驱动与 Cron 批量调度

原有的插件配置仅支持单一 `baseDir`，且缺乏定时调度能力，这在管理多个知识库时成为了明显的效率瓶颈。为了解决这个问题，我参考了 `link-collector` 的"CLI 注册 → Cron 触发 → Skill 执行”三层模式，但在设计之初就明确了一个关键差异：Prism 的 `runPipeline` 本身通过对比 journal 和 atoms 目录来实现增量处理，天然具备幂等性，因此无需像 collector 那样设计复杂的 inbox/batch/archive 轮转机制。

基于此，我在 `<workspace>/.openclaw/prism-processor/` 下引入了 `registry.json` 注册表，用于存储多个知识库的元数据（包括 `baseDir`、`enabled` 状态及 `lastProcessedAt`）。写入操作严格采用 `tmp + rename` 原子策略以防并发冲突。在调度层面，我新增了 `setup-cron` CLI 命令和 `prism-auto-process` 定时任务（默认每 60 分钟触发），一旦启动，隔离会话中的 Agent 会自动加载 `prism-processor` 技能，遍历注册表中所有启用的库并执行检查，真正实现了从“单点手动”到“批量自动”的架构跃迁。

## 坚守核心边界：原子操作与职责分离的安全防线

在扩展功能的同时，我严格恪守了核心层与插件层的职责边界。`registry.json` 及其相关的注册、注销逻辑完全属于 OpenClaw 插件层（`openclaw-plugin/`），而底层的 `lib/` 核心库始终保持面向单个 `baseDir` 工作的纯粹性，未做任何侵入式修改。这种分离确保了核心逻辑的稳定性，即便上层注册表出现异常，也不会污染底层的数据处理流程。

为了保障多库并发场景下的数据一致性，我在实现中复用了 `runPipeline` 的天然幂等机制，并强化了容错设计：在 `process_all` 的执行循环中，单个知识库的处理失败不会中断整个流程，系统会跳过错误项继续处理下一个，最后统一回写 `lastProcessedAt` 和 `lastSummary` 到注册表。此外，所有对注册表的写操作都强制通过原子文件操作完成，杜绝了因进程意外终止导致配置文件损坏的风险。

## 落地无人值守：路径解析陷阱与低开销部署流

在将设计转化为可运行的代码时，我遇到了一个隐蔽的路径解析陷阱。最初我假设 workspace 路径位于 `api.config.agents.defaults.workspace`，但在实际调试 Cron 隔离会话时发现该字段并未设置，导致路径解析失败。经过排查，我确立了三级 fallback 策略：优先读取 `defaults.workspace`，若不存在则降级读取 `agents.list[0].workspace`，最后兜底至 `process.cwd()`。这一调整确保了 CLI、Gateway AI 工具及 Cron 会话三种场景下都能正确命中 `D:/.openclaw/workspace`。

为了优化 Token 效率，我没有让 Cron 任务逐库调用工具（那样会导致 5 个库产生 11+ 次 LLM 往返），而是封装了单一的 `knowledge_prism_process_all` 工具，一次性完成所有库的遍历与处理。部署验证阶段，得益于插件通过 `plugins.load.paths` 进行路径链接安装的特性，我只需执行 `gateway stop` 和 `gateway start` 重启网关，代码改动即刻生效。随后通过 `openclaw prism register` 注册知识库并配置 Cron，成功观察到 `link-collector-process` 与 `prism-auto-process` 两个任务并行运行，标志着自动化闭环的正式落地。

## 今天的收获

- **复用优于重构**：Prism 的 `runPipeline` 天然支持增量幂等，直接复用该机制比重新设计 inbox/batch 轮转更简单且可靠。
- **Token 效率优先**：在 Cron 自动化场景中，将多次工具调用封装为单次 `process_all` 能显著减少 LLM round-trip 开销，比代码结构的“优雅”更重要。
- **配置解析需防御性编程**：OpenClaw 的 workspace 配置位置不固定，必须实现 `defaults → list[0] → cwd` 的多级 fallback 解析逻辑。
- **职责分离是扩展基石**：将多库注册逻辑限制在插件层，保持核心 `lib/` 仅关注单库处理，能有效降低系统耦合度与维护成本。
- **路径链接加速迭代**：利用源码路径链接安装插件，仅需重启网关即可验证代码变更，极大提升了开发调试效率。
