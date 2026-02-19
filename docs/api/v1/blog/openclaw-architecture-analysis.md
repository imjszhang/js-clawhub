# OpenClaw 项目架构分析

花了一天时间把 OpenClaw 的代码和文档捋了一遍，整理成这篇架构分析。如果你也想搞清楚它到底怎么运作、怎么部署，这篇是我的学习笔记。

## 我眼中的 OpenClaw

OpenClaw 是一个**个人 AI 助手平台**，跑在你自己的设备上。它通过你已有的消息渠道（WhatsApp、Telegram、Slack、Discord、飞书等）交互，支持语音和实时 Canvas 界面。

核心特性我总结为这几条：

- **本地优先 Gateway**：单一控制平面，管理会话、通道、工具和事件
- **多通道收件箱**：支持 13+ 消息通道
- **多代理路由**：路由到隔离的代理，每个代理有独立工作区和会话
- **Voice Wake + Talk Mode**：macOS/iOS/Android 上的语音唤醒
- **Live Canvas**：代理驱动的可视化工作区
- **技能系统**：可热加载的扩展，社区技能可下载

技术栈：TypeScript (ESM)、Node.js 22+、pnpm，原生应用用 Swift/Kotlin。

## 部署逻辑

| 渠道 | 目标 | 触发方式 |
|------|------|----------|
| NPM 包 | CLI 工具 | 手动发布 |
| macOS 应用 | Sparkle 自动更新 | 手动发布 |
| Docker 镜像 | GitHub Container Registry | push/tag 自动 |
| 移动应用 | iOS/Android | CI 测试 |

NPM 发布流程：版本更新 → `pnpm plugins:sync` → `pnpm build` → `pnpm release:check` → `npm publish`。Docker 在推 main 或打 v* 标签时自动构建多平台镜像。

## 核心组件关系

```
Channels (消息通道) → Gateway (控制平面 18789) → Agents / Nodes / Web UI
                                                      ↓
                                            Tools & Automation
```

- **Gateway**：WebSocket 服务器，管理通道、路由、事件
- **Channels**：WhatsApp(Baileys)、Telegram(grammY)、Slack、Discord、Signal、iMessage 等
- **Agents**：基于 p-mono 的嵌入式代理运行时，有工作区、会话、工具
- **Sessions**：会话管理，支持 main、per-peer、per-channel-peer 等隔离级别
- **Tools**：exec、browser、canvas、cron、sessions_* 等

## 设备要求

| 组件 | 要求 |
|------|------|
| Node.js | ≥ 22 |
| 架构 | 64 位 ARM64 或 x86_64 |

**最小配置**（单通道）：1 vCPU、1GB RAM、~500MB 磁盘  
**推荐配置**（多通道+浏览器）：1-2 vCPU、2GB+ RAM、16GB+ 磁盘

**Raspberry Pi**：Pi 5 最佳，Pi 4 4GB 良好，Pi 4 2GB 需 swap，Pi Zero 2 W 不推荐。

## 我的结论

**适合**：想自己掌控 AI 助手、数据本地化、多通道统一收件箱、24/7 运行的个人或小团队。

**不适合**：需要企业级 SLA、大规模多租户、或不想折腾部署的用户。

官方文档入口：https://docs.openclaw.ai/start/getting-started

---

*JS // 2026.01.31*
