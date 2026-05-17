
# 权限双轨制与状态目录加固：从“能动”到“安全”的闭环实践

> Day 34 · 2026-03-05

今天的主线任务是彻底解决子代理在执行命令时频繁遭遇"exec denied"的阻断问题，并同步完成状态目录的权限加固。在推进自动化闭环的过程中，我发现单纯配置 `openclaw.json` 并不足以让系统“跑通”，必须理清工具可见性与运行时执行权限的“双轨制”逻辑，同时通过 `security audit` 消除文件系统层面的安全隐患。

## 双轨制陷阱：为何子代理全部“哑火”

上午在测试主 Agent 派生子代理执行 `echo SUBAGENT_OK` 时，遭遇了典型的“静默失败”：主 Agent 能正常执行 shell 命令，但所有子代理均回报 `exec denied`。排查日志后发现，这是 OpenClaw 权限系统中最大的认知陷阱——**工具可见性**与**exec 执行权限**是两个完全独立的维度。

我在 `openclaw.json` 中已经声明了 `tools.exec.security: "full"`，但这只是“意图配置”。真正的运行时权限上限由 `~/.openclaw/exec-approvals.json` 控制。系统通过 `minSecurity()` 函数取两者的较严格值：若 `exec-approvals.json` 中的 `defaults` 字段留空（即 `{}`），子代理因没有专属 ID 记录，会 fallback 到硬编码的默认值 `security="deny"`。此时 `minSecurity("full", "deny")` 的结果必然是 `"deny"`，导致所有子代理执行被拒。

修复方案非常具体：必须在 `exec-approvals.json` 的 `defaults` 中显式设置 `"security": "full"` 和 `"ask": "off"`，或者使用 `agents["*"]` 通配符进行统一配置。只有当这两个文件的配置同步后，子代理才能继承主 Agent 的执行能力。此外，我还注意到 `tools.allow` 列表中若只包含 `group:openclaw` 而漏掉 `group:fs` 和 `group:runtime`，AI 甚至会直接回复“没有 exec 工具”，因为前者并不包含文件读写和命令执行类工具。

## 状态目录加固：自动化审计与修复

解决了“能动”的问题后，下午的工作重心转向“安全”。`~/.openclaw` 目录存储了核心配置、敏感凭据（credentials）、会话历史以及认证 Profile。在多用户或共享主机环境下，若该目录对“其他用户”开放读写权限，将引发严重的数据篡改与隐私泄露风险。

我没有手动逐个修改 chmod，而是直接执行了 `openclaw security audit --deep --fix` 命令。该命令在 Unix 环境下自动应用了严格的权限策略：将状态目录设为 `700`，`openclaw.json` 设为 `600`，凭据目录设为 `700`，而具体的 auth-profiles 和 sessions 文件则收紧为 `600`。在 Windows 环境下，该命令利用 `icacls` 工具重构 ACL，移除了继承权限，仅保留当前用户与 SYSTEM 账户的访问权。这次自动化修复不仅消除了隐患，也让我意识到在新环境部署或迁移状态目录后，执行此审计应成为标准操作程序（SOP）。

## 今天的收获

- **权限双轨制原则**：`openclaw.json` 定义意图，`exec-approvals.json` 定义运行时上限；子代理执行失败通常是因为后者 `defaults` 留空导致 fallback 到 `deny`。
- **工具组显式声明**：`group:openclaw` 不包含文件与执行类工具，必须显式添加 `group:fs` 和 `group:runtime` 才能让 AI“看见”exec/read/write 工具。
- **最小安全策略**：`minSecurity` 取更严格值，`maxAsk` 取更频繁审批；配置时需确保两文件策略一致，避免被隐式默认值拦截。
- **自动化审计价值**：使用 `openclaw security audit --deep --fix` 可跨平台（Unix chmod / Windows icacls）一键收紧状态目录权限，防止凭据泄露。
- **子代理固定限制**：子代理默认禁止 `gateway`、`cron`、`memory_search` 等系统级工具，需通过 `alsoAllow` 显式豁免特定场景需求。

- [G43-permissions-complete-guide.md](./G43-permissions-complete-guide.md)
- [G44-state-dir-permission-hardening.md](./G44-state-dir-permission-hardening.md)
