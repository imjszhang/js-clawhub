
# 第 27 天：踩坑密集日——从 curl|bash 阻断到安全防线的重构

> Day 27 · 2026-02-26

今天是典型的「踩坑密集日」，原本计划推进 js-eyes 的 Agent-First 改造和自动化分发，却被 OpenClaw 底层的安全机制和路径解析逻辑连环卡住。从 `curl | bash` 被静默拒绝，到配置修改后依然无效，再到环境变量与 Workspace 路径的错位，每一个坑都暴露了系统在从「可记录」向「可教学」演进过程中，对自动化流程与安全纵深防御的严苛要求。

## 三重防线：为何 curl | bash 被直接阻断且无审批弹窗

上午在测试 js-eyes 的一键安装脚本时，Agent 尝试执行 `curl -fsSL https://js-eyes.com/install.sh | bash`，结果命令被直接拒绝，连审批弹窗都没有出现。深入排查 `src/infra/exec-approvals.ts` 和 `src/agents/bash-tools.exec-host-gateway.ts` 后发现，这是 OpenClaw 故意设计的「分段解析 + 白名单校验」机制在起作用。

系统默认将含管道符的命令拆解为独立段进行严格校验。`curl ... | bash` 被拆成了 `curl -fsSL <url>` 和 `bash` 两段。由于 `bash` 和 `curl` 均不在默认的 `safeBins`（仅包含 `jq`、`cut`、`uniq` 等低风险工具），且 `bash` 从 stdin 执行任意脚本的特性使其永远无法被归类为 safeBin，导致 `allowlistSatisfied = false`。更关键的是，当前的 `ask` 配置默认为 `off` 或因空配置回退到了 `security=deny`，导致系统在白名单未命中时直接拒绝，而非弹出审批窗口。这种设计哲学迫使开发者必须明确知晓并授权每一个高风险执行步骤，杜绝了静默执行恶意管道的可能。

## 配置陷阱：空配置回退与显式审批策略的必要性

为了解决无弹窗问题，我尝试修改 `~/.openclaw/exec-approvals.json`，起初以为只要保持默认空配置即可沿用宽松策略，结果大错特错。当 `agents` 配置为空或未显式指定 agent 时，系统并不会采用宽松策略，而是直接回退到 `security=deny`，拒绝所有请求。

正确的做法是必须在 `exec-approvals.json` 中为 `main` agent 显式设置组合策略：将 `security` 设为 `allowlist`，并将 `ask` 设为 `on-miss`。只有这样才能确保在白名单未命中时弹出审批窗口，而不是直接失败。同时，`askFallback` 应设为 `deny` 以处理审批超时或无 UI 的情况。这一发现让我意识到，在安全机制中，「未配置」绝不等于「宽松」，显式的策略声明是构建可信自动化流程的前提。

## 运行时依赖：Host 设置与 Session 持久化的隐蔽陷阱

即便修正了 `exec-approvals.json`，问题仍未解决。进一步排查发现两个更隐蔽的运行时陷阱。首先，`tools.exec.host` 的默认值是 `sandbox`，在此模式下 exec 在 Docker 沙箱内运行，根本不会读取 `exec-approvals.json`，审批逻辑仅在 `host` 显式设置为 `gateway` 或 `node` 时才会生效。我不得不在 `openclaw.json` 中显式添加 `"tools": { "exec": { "host": "gateway" } }` 配置。

其次，配置修改后必须开启新 Session 才能生效。这是因为旧 Session 的状态中可能持久化了 `/exec` 的会话级覆盖值（如 `execAsk=off` 或 `execHost=sandbox`），这些残留状态会覆盖最新的磁盘配置。此外，在排查 js-eyes 的 `read` 工具报错时，还发现了 `OPENCLAW_STATE_DIR` 与默认 Workspace 路径解析不一致的问题：即使设置了 State 目录到 D 盘，默认 Agent 的 Workspace 仍基于 `USERPROFILE` 解析到 C 盘，导致 `MEMORY.md` 读取失败（ENOENT）。最终通过在 `openclaw.json` 中显式指定 `agents.defaults.workspace` 才解决了路径错位问题。

## 今天的收获

- **安全机制的默认行为是「拒绝」而非「宽松」**：`exec-approvals.json` 中 `agents` 为空时会回退到 `security=deny`，必须显式配置 `allowlist` + `on-miss` 才能启用审批流程。
- **高风险命令需分段校验**：`curl | bash` 等管道命令会被拆解校验，`bash` 因高风险特性永不在 `safeBins` 中，必须通过审批或白名单显式放行。
- **运行时环境决定配置生效**：`tools.exec.host` 默认为 `sandbox` 会绕过审批，必须设为 `gateway` 或 `node`；且配置修改后需重启 Session 以清除持久化覆盖。
- **State 目录与 Workspace 路径解耦**：`OPENCLAW_STATE_DIR` 不影响默认 Workspace 解析，需通过 `agents.defaults.workspace` 或 `OPENCLAW_HOME` 显式统一路径，避免跨盘读取失败。
- **Agent-First 需自主可控的分发链路**：面对 VirusTotal 误报，通过 `js-eyes.com` 托管安装脚本与多源回退机制，实现了不依赖市场审核的自主安装闭环。
