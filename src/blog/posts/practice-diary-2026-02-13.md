
# 从配置隔离到实例衍生：真正厘清 OpenClaw 的 Agent 边界

> Day 14 · 2026-02-13

今天终于捅破了那层窗户纸：为什么我在尝试让 Agent 自我进化时总是遭遇配置冲突，以及为什么“子 Agent"并不是我想象中那种可以独立配置的新实体。在梳理 `agents.list` 与 `sessions_spawn` 的底层逻辑后，我才真正理解了 OpenClaw 五层架构中关于“隔离”与“衍生”的严格红线。

## 构建"Channel-Agent-Workspace-Session"五层抽象，用物理隔离换取并发安全

此前我总纠结于如何在代码层面处理高并发下的消息路由，直到今天重新审视 `openclaw-core-concepts-pyramid.md` 中的金字塔结构，才意识到系统早已通过物理路径的解耦解决了这个问题。OpenClaw 并非简单的逻辑分层，而是强制实施了 **Channel → Account → Agent → Workspace + Session** 的五层抽象。

在实际操作中，这意味着消息从 WhatsApp 的 `personal` 账号进入（Channel+Account），通过 `bindings` 路由规则精准命中 `home` Agent，随后加载其专属的 `Workspace`（包含 `SOUL.md`、`MEMORY.md` 等人设文件）并在独立的 `Session` 桶中维护上下文。最关键的收获在于理解了其四层隔离机制：Agent 目录完全独立，Session 通过 `sessionKey` 配合文件锁实现串行化，Channel 拥有独立监控进程，而 Account 凭证则通过路由严格隔离。这种设计让我明白，所谓的“并发安全”不是靠复杂的锁算法，而是靠 `~/.openclaw/agents/<agentId>/` 这种严格的目录隔离和 `CommandLane` 队列机制天然保障的。

## 严守 Agent 配置边界：子 Agent 只是临时衍生，严禁跨实例复用配置

今天的另一个重大踩坑源于我对“子 Agent"的误解。在查阅 `openclaw-core-concepts-qa-and-usage.md` 之前，我曾试图让主 Agent 通过对话动态创建一个拥有新 Workspace 的独立 Agent，结果发现 `agents.create` 工具根本未对 Agent 开放。

事实是，**子 Agent（Sub-agent）绝非独立实体**。当我调用 `sessions_spawn` 工具时，系统只是派生了一个临时的后台执行实例。这个子实例必须共用主 Agent 的 `Workspace` 和 `agentDir`（默认位于 `~/.openclaw/agents/<agentId>/agent/`），它没有自己的人设文件（仅注入 `AGENTS.md` 和 `TOOLS.md`），也没有独立的认证配置。文档中明确警告：**严禁在不同 Agent 间复用同一 `agentDir`**，否则会导致 `auth-profiles.json` 冲突和会话历史混乱。如果需要共享凭证，正确的做法是手动复制配置文件，而非共享目录。这一认知修正了我之前的架构设想：Agent 的“大脑”是静态且独立的，而“子 Agent"只是该大脑在独立 Session 中进行的并行思考，任务完成后通过 `announce` 回传结果，生命周期默认仅维持 60 分钟。

## 今天的收获

- **五层架构即安全防线**：不要试图用代码逻辑去解决并发冲突，应依赖 Channel/Account/Agent/Workspace/Session 的物理路径隔离和 `CommandLane` 串行机制。
- **子 Agent 的本质是任务实例**：`sessions_spawn` 创建的只是同一 Agent 下的后台线程，共用配置目录，不具备独立的人设和记忆存储空间。
- **配置目录的绝对排他性**：`agentDir` 是 Agent 的私有领地，跨 Agent 复用会导致认证和会话数据污染，共享凭证必须通过文件复制而非目录挂载。
- **记忆存储的层级归属**：长期记忆（`MEMORY.md`）属于 Workspace 层，是 Agent 的持久化资产；而 Session 仅负责短期对话上下文，两者在物理存储和生命周期上严格分离。
- **创建独立 Agent 的唯一路径**：Agent 自身无法通过工具创建新的独立 Agent，必须通过 CLI (`openclaw agents add`) 或 RPC (`agents.create`) 由外部触发，以确保 Workspace 和引导文件的完整初始化。

- [G28-openclaw-core-architecture.md](./G28-openclaw-core-architecture.md)
- [G29-openclaw-agent-usage-patterns.md](./G29-openclaw-agent-usage-patterns.md)
