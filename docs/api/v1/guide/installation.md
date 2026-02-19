# 安装与配置

## 系统要求

- **操作系统**：macOS 14+、Windows 10+、Ubuntu 20.04+
- **Node.js**：18.0 或更高版本
- **内存**：建议 8GB 以上
- **AI 模型**：需要 Anthropic/OpenAI API Key，或本地模型

## 快速安装

### 方式一：一键安装（推荐）

适用于 macOS 和 Linux：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

这个脚本会自动安装 Node.js 和所有依赖。

### 方式二：npm 安装

如果你已经有 Node.js 环境：

```bash
npm i -g openclaw
```

### 方式三：从源码安装

适合想要深入了解和修改代码的开发者：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm run build
```

## 初始配置

安装完成后，运行 onboard 命令：

```bash
openclaw onboard
```

这个交互式向导会帮你：

1. 选择 AI 模型（Claude、GPT、本地模型）
2. 配置 API Key
3. 选择通讯渠道（WhatsApp、Telegram 等）
4. 设置个人偏好

## 推荐部署方案

### Mac Mini（最推荐）

在 Mac Mini 上 24/7 运行，是目前最佳的部署方案：

- 低功耗、无噪音
- 足够的计算能力
- 通过 SSH 远程管理

### Raspberry Pi

低成本方案，搭配 Cloudflare Tunnel 实现外网访问。

### 云服务器

也可以部署在 VPS 上，但注意数据安全。

## 下一步

安装完成后，你可以：

- 通过聊天应用发送第一条消息
- 浏览 [技能市场](/skills/) 安装有用的技能
- 查看 [技能开发入门](#skill-development) 创建自己的技能
