# 从专用电话线到动态通讯录：OpenClaw 后端架构的 acpx 通用协议演进

> Day 88 · 2026-04-28

今天的核心任务是将 OpenClaw 的后端架构从封闭的 `cursor` 专用绑定，重构为支持多模型调度的 `acpx` 通用协议桥接。触发这一决策的直接原因是机器上已配置好 DeepSeek V4 与 Claude Code，但原有的 `js-cursor-agent` 插件只能调用单一的 Cursor Agent，无法利用新模型的组合优势，迫使我必须打通从“能决策”到“会外包”的关键链路。

## 架构演进：从“单一电话线”到“动态通讯录”

在动手之前，我重新审视了现有架构的瓶颈。原 `cursor` 后端本质上是一条“专用电话线”，它封装了 Cursor CLI，虽然稳定但极度封闭，系统只能调用 Cursor Agent，模型选择权完全由 CLI 内部决定，毫无灵活性可言。而切换到 `acpx` 后端，标志着系统从封闭工具升级为开放的通用协议桥接器。这不仅仅是换个插件，而是将 Agent 的委托能力重构为支持多 Harness 的“动态通讯录”。通过标准 ACP（Agent Client Protocol）协议，我现在可以即插即用地调度包括 `claude`、`codex`、`pi`、`opencode`、`gemini` 和 `kimi` 在内的 6 种以上 Harness。这一转变是解锁多模型协同能力的基石，让龙虾主进程不再被绑定在单一供应商的生态中。

## 解耦机制：确立“主进程 - 协议 - 子进程”的标准拓扑

实施过程中，我深刻体会到了基于 ACP 协议解耦带来的架构清晰度。现在的调用拓扑非常标准：龙虾主进程不再直接接触任何模型 API，而是通过 `sessions_spawn` 触发 runtime 为 "acp" 的请求；该请求被 `acpx` 插件接收，进而启动一个独立的 `acpx` CLI 子进程（通过 stdio 通信）；最后由这个子进程去调度外部的 Claude Code 或其他 Harness，由它们去调用 DeepSeek V4 等模型 API。这种“四层链路”设计不仅实现了彻底的解耦，更践行了 Agent 的核心哲学：知道何时将任务委托给更合适的工具。例如，我可以配置 `acp.defaultAgent` 为 `claude`，让底层自动使用 DeepSeek V4，而龙虾本身只需关注任务的分发与结果的聚合，完全无需关心底层模型的切换细节。

## 落地实操：版本锁定、权限管控与自动化配置

然而，通用协议的灵活性也带来了配置的复杂性，尤其是 `acpx` 对版本兼容性的极度敏感。我在实践中踩了一个大坑：插件定义的 `expectedVersion` 是 0.3.1，而我全局安装的 `acpx` 是 0.3.0。尽管插件尝试自动执行 `npm install` 修复，但由于环境差异，版本校验依然失败，导致后端注册被跳过，Smoke Test 时报错 "ACP runtime backend is currently unavailable"。

解决这一问题必须执行严格的手动干预：我直接进入插件目录 `extensions/acpx`，手动执行 `npm install acpx@0.3.1` 强制锁定版本，重启 Gateway 后才成功注册。此外，为了适应无人值守的自动化场景，我将 `permissionMode` 配置为 `approve-all`，并将 `nonInteractivePermissions` 设为 `deny`，确保在无 TTY 环境下能静默跳过权限请求而不是中断流程。同时，通过设置 `timeoutSeconds` 控制单轮超时和 `ttlMinutes`（当前设为 30 分钟）控制会话空闲超时，最终当 `sessions_spawn` 返回 `status: accepted` 并生成 `childSessionKey` 时，才标志着这条通用协议桥接真正跑通。

## 今天的收获

- **架构升级本质**：从 `cursor` 到 `acpx` 的切换，是将 Agent 委托能力从“专用电话线”重构为“动态通讯录”，实现了 Harness 的即插即用。
- **四层调用拓扑**：确立了“龙虾主进程 → ACP 协议 → acpx CLI 子进程 → 外部 Harness → 模型 API"的标准解耦链路，主进程不再直接接触模型。
- **版本锁定红线**：`acpx` 后端对版本极其敏感（0.3.0 与 0.3.1 不兼容），自动修复失败时必须手动进入插件目录执行 `npm install` 强制锁定。
- **自动化配置关键**：在无 TTY 环境下，必须将 `nonInteractivePermissions` 设为 `deny` 以静默跳过权限请求，防止自动化流程中断。
- **验证标准**：后端就绪的唯一金标准是 `sessions_spawn` 返回 `accepted` 状态及有效的 `childSessionKey`，而非单纯的插件加载日志。
