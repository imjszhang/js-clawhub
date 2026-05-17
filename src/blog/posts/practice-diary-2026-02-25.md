
# 爆发日：五件事同时发生，从可记录迈向可教学

> Day 26 · 2026-02-25

今天是一个典型的“爆发日”，五件关键任务同时推进：插件安全规范落地、知识棱镜自动化闭环、JS-Eyes 浏览器能力扩展、独立分发架构构建以及底层路径解析修复。这不仅是功能的堆叠，更是系统从“可记录”向“可教学”智能体演进的关键转折点，我们必须通过架构分层与安全防线的双重加固，将散乱的时间线笔记转化为高可用的结构化资产。

## 插件开发的安全基石：SDK 隔离与全生命周期规范

在深入源码分析后，我确立了 OpenClaw 插件开发必须遵循的“铁律”：严格的 SDK 隔离。插件代码只能导入 `openclaw/plugin-sdk`，严禁直接触碰 `src/**` 内部模块，所有运行时能力必须通过 `api.runtime` 注入。这一设计确立了编译时稳定与运行时注入的双层架构，配合 `jiti` 动态加载机制，无需预编译即可直接运行 TypeScript。

全生命周期的安全流程包含十个关键步骤：从清单验证、ID 冲突检查，到拒绝世界可写路径（`mode & 0o002`）和验证文件所有者 UID。特别是在非 Windows 环境下，系统会严格检查文件权限，防止符号链接逃逸。这种“清单驱动 + 安全加载”的规范，确保了我们在扩展系统能力时，不会因第三方代码的不可控而破坏核心稳定性。

## 知识棱镜的自动化闭环：从手动繁琐到 AI 工具调用

随着 `docs/githubforker/journal/` 下积累超过 20 篇笔记，手动提取 atoms、归组 groups 和收敛 synthesis 的流程已成为瓶颈。今天，我将原本独立的 `js-knowledge-prism` CLI 工具正式封装为 OpenClaw 插件。通过 `openclaw plugins install --link` 模式，我将本地路径直接链接到系统中，避免了复制导致的路径断裂。

插件注册了 `knowledge_prism_process` 和 `knowledge_prism_status` 等核心 AI 工具。现在，我只需在飞书对话中对 Agent 说“执行增量处理”，它就能自动调用管线完成从 atoms 提取到 synthesis 收敛的全流程，支持分阶段执行（如仅执行阶段 1 提取 atoms 供人工审查）。这一转变消除了终端切换的上下文成本，并建立了 git commit 前审查 diff 的自动化维护工作流，真正实现了“写完笔记 → 告诉 Agent → 自动处理”的短反馈循环。

## 填补能力空白：JS-Eyes 复用用户浏览器登录态

内置的 CDP 浏览器虽然适合沙箱任务，但无法继承用户的登录态，这在需要操作已登录的 GitHub 或 Gmail 场景下是致命缺陷。今天落地的 JS-Eyes 插件通过 WebSocket 复用用户日常浏览器（Chrome/Edge/Firefox）的现有会话，完美填补了这一空白。

架构上，我们采用了单端口复用策略（HTTP/WS 共用 18080 端口），OpenClaw 启动时自动拉起内置服务器。插件封装了 `js_eyes_get_tabs`、`js_eyes_execute_script`、`js_eyes_get_cookies` 等 7 个核心工具。在实战中，Agent 可以注入脚本自动填写表单或提取价格数据，甚至检查跨站登录状态。针对 Windows 平台，我们还内置了 `windowsHide` 猴子补丁，消除了子进程执行时弹出 CMD 窗口的干扰。

## 解耦市场依赖：构建自主安装脚本与静态注册表

在尝试将 JS-Eyes 发布到 ClawHub 时，我遭遇了 VirusTotal 的误报拦截——本地自动化代码的网络特征被标记为可疑，且无法通过声明消除。这迫使我重新思考分发策略：真正的 Agent-First 必须掌握全链路控制权。

我构建了基于 `curl` 和 `PowerShell` 的自主安装脚本，实现了“自有域名→GitHub→jsDelivr"的多源回退链，每个下载源设置 10-15 秒超时以确保快速切换。同时，演进出了基于 GitHub Pages 的静态 `skills.json` 注册表作为唯一真相来源，配合 `js_eyes_discover_skills` 等 AI 工具，实现了从手动配置到 Agent 自主感知的架构升级。这不仅规避了市场审核的不确定性，也解决了国内网络访问的限制。

## 底层修复：显式对齐 State 与 Workspace 目录

在跨盘符部署测试中，系统频繁报出 `ENOENT` 错误。排查源码发现，OpenClaw 的 State 目录由 `OPENCLAW_STATE_DIR` 控制，而 Workspace 目录默认解析逻辑（`OPENCLAW_HOME` > `HOME`）完全独立于 State 变量。这意味着仅设置 State 目录会导致 read/memory 等工具仍访问 C 盘默认路径。

修复方案是显式对齐：要么设置 `OPENCLAW_HOME` 环境变量一次性迁移所有基于 home 的路径，要么在 `openclaw.json` 的 `agents.defaults.workspace` 字段中强制指定路径。这一底层机制的厘清，避免了未来在复杂部署环境下的隐性故障。

## 今天的收获

- **插件安全红线**：开发插件必须严格依赖 `openclaw/plugin-sdk`，禁止导入内部模块，且需通过清单驱动和权限检查确保运行时安全。
- **自动化缩短反馈**：将繁琐的手动流程（如知识棱镜处理）封装为 AI 可调用的工具，能显著消除上下文切换成本，实现“对话即操作”。
- **分发自主权**：面对第三方市场的安全误报和网络限制，构建“自主安装脚本 + 多源回退链 + 静态注册表”是保障 Agent-First 项目可用性的必要架构。
- **路径解析陷阱**：OpenClaw 的 State 与 Workspace 目录解析机制分离，跨盘符部署时必须通过环境变量或配置文件显式对齐，否则会导致文件找不到错误。
- **增量演化优于一步到位**：从笔记难用到架构设计，再到工具化、插件化，每一步都是由前一步的痛点自然推动，这种演化链比预先规划更稳健。

- [G32-plugin-creation-lifecycle](./G32-plugin-creation-lifecycle.md)
- [G33-knowledge-prism-automation](./G33-knowledge-prism-automation.md)
- [G34-js-eyes-integration](./G34-js-eyes-integration.md)
- [G35-clawhub-skill-publishing](./G35-clawhub-skill-publishing.md)
- [G36-agent-first-distribution](./G36-agent-first-distribution.md)
- [G37-skill-discovery-automation](./G37-skill-discovery-automation.md)
- [G38-openclaw-path-resolution](./G38-openclaw-path-resolution.md)
