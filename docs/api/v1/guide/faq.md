# 常见问题 FAQ

## 基础问题

### OpenClaw 是免费的吗？

OpenClaw 本身是开源免费的（MIT 协议）。但你需要自己的 AI 模型 API Key（如 Anthropic Claude 或 OpenAI GPT），这部分需要付费。也可以使用免费的本地模型。

### 需要编程知识吗？

基础使用不需要。安装过程有交互式向导引导，日常使用就是在聊天应用中发消息。如果你想开发自定义技能，基本的编程知识会有帮助。

### 支持哪些操作系统？

macOS 14+、Windows 10+、Ubuntu 20.04+ 及其他主流 Linux 发行版。

### 数据安全吗？

所有数据都存储在你自己的机器上，不会上传到任何第三方服务。你拥有完全的数据控制权。

## 安装问题

### 安装失败怎么办？

常见原因：
1. Node.js 版本过低（需要 18+）
2. 网络问题导致依赖下载失败
3. 权限不足

建议加入 Discord 社区寻求帮助。

### 可以在服务器上运行吗？

可以。很多用户在 Mac Mini、Raspberry Pi 或云服务器上 24/7 运行 OpenClaw。

### 如何更新？

```bash
npm update -g openclaw
```

## 使用问题

### 如何切换 AI 模型？

在配置文件中修改 model 设置，或在聊天中告诉 OpenClaw 切换模型。

### 记忆功能怎么工作？

OpenClaw 使用持久化存储保存对话历史和用户偏好。它会自动提取重要信息并记住。

### 多个聊天应用可以同时使用吗？

可以。你可以同时连接 WhatsApp、Telegram、Discord 等多个通道，它们共享同一个 AI 助手和记忆。

### 如何限制 AI 的权限？

OpenClaw 支持沙箱模式，可以限制文件系统访问、网络访问等权限。在配置中设置即可。

## 技能相关

### 在哪里找到技能？

- [ClawHub 技能市场](https://clawhub.com/)
- [JS ClawHub 技能页面](/skills/)
- Discord 社区的 skills 频道

### 技能会自动更新吗？

目前需要手动更新。可以通过 `openclaw skill update` 命令检查和更新。

## 社区

### 在哪里获取帮助？

- [Discord 社区](https://discord.gg/openclaw)
- [GitHub Issues](https://github.com/openclaw/openclaw/issues)
- [Twitter @openclaw](https://x.com/openclaw)

### 如何贡献代码？

Fork 仓库，创建 PR。详见 GitHub 仓库的 CONTRIBUTING.md。
