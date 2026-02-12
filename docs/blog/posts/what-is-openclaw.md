# What is OpenClaw: The Open Source Personal AI Assistant

OpenClaw 是一个开源的个人 AI 助手，运行在你自己的机器上，通过你已有的聊天应用与你交互。

## 核心概念

OpenClaw 不是又一个聊天机器人。它是一个有持久记忆、能操作你电脑的 AI 助手：

- **运行在你的机器上**：Mac、Windows 或 Linux，数据完全私有
- **通过聊天应用交互**：WhatsApp、Telegram、Discord、Slack、Signal、iMessage
- **持久记忆**：记住你的偏好、上下文，变得越来越了解你
- **浏览器控制**：能浏览网页、填表单、提取数据
- **完整系统访问**：读写文件、运行命令、执行脚本

## 为什么它如此特别？

用社区用户的话说：

> "Everything Siri was supposed to be. And it goes so much further." — @crossiBuilds

> "It's running my company." — @therno

> "OpenClaw is a 24/7 assistant with access to its own computer." — @nickvasiles

## 技能系统

OpenClaw 最强大的特性之一是技能系统。技能是可复用的功能模块：

- 社区创建的技能可以通过 ClawHub 下载
- AI 可以自己编写新技能
- 技能可以热加载，无需重启

```bash
# 安装社区技能
openclaw skill install gmail-manager

# AI 也能自己创建技能
"帮我创建一个自动签到的技能"
```

## 部署方式

最推荐的方式是在 Mac Mini 上 24/7 运行：

```bash
# 一键安装
curl -fsSL https://openclaw.ai/install.sh | bash

# 或者通过 npm
npm i -g openclaw
openclaw onboard
```

也支持 Raspberry Pi、Docker 等部署方案。

## 社区生态

OpenClaw 的社区非常活跃，仅上线 19 天就产生了大量创意用法：

- 自动管理空气净化器
- 批量退订垃圾邮件
- 用澳洲口音打电话
- 自动生成冥想音频
- 从手机上控制电脑写代码

这就是为什么我创建了 ClawHub——帮你发现这些精彩的社区创造。

---

*JS // 2026.02.10*
