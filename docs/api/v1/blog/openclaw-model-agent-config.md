# OpenClaw AI 模型与 Agent 配置指南

配 AI 模型和 Agent 时，Provider、Model、Agent 三个概念容易混。我按自己的理解整理了一份配置指南。

## 三个概念的区别

| 概念 | 说明 | 示例 |
|------|------|------|
| **Provider** | AI 模型的来源/提供商 | `anthropic`, `openai`, `moonshot` |
| **Model** | 具体的 AI 模型 | `claude-opus-4-5`, `kimi-k2.5` |
| **Agent** | OpenClaw 的 AI 助手实例 | 包含工作空间、会话、认证的完整实体 |

Claude Code CLI 不是 agent 类型，而是一种认证方式；OpenAI Codex 是 provider，用 ChatGPT 订阅的 OAuth。OpenClaw 自己跑的是基于 p-mono 的嵌入式 agent 运行时。

## 我常用的 Provider

**开箱即用**（设环境变量即可）：Anthropic、OpenAI、Google Gemini、OpenRouter、Z.AI(GLM)、Ollama。

**需要配置 `models.providers`**：Moonshot(Kimi)、Kimi Code、Ollama。

| 场景 | 我用的配置 |
|------|------------|
| 最强能力 | `anthropic/claude-opus-4-5` |
| 性价比 | `anthropic/claude-sonnet-4-5` |
| 中国访问 | `moonshot/kimi-k2.5` 或 `zai/glm-4.7` |
| 本地运行 | `ollama/llama3.3` |
| 免费试用 | OpenRouter free tier |

## 认证方式

**API Key**：简单稳定，按量付费。放 `~/.openclaw/.env` 里，配置里用 `${MOONSHOT_API_KEY}` 引用。

**订阅认证**：用订阅额度，免 API 费，但 token 会过期。Claude 用 `claude setup-token` + `models auth setup-token`，OpenAI Codex 用 `models auth login --provider openai-codex`。

## 完整配置示例：Kimi

```bash
# ~/.openclaw/.env
MOONSHOT_API_KEY=sk-你的密钥
```

```json5
// ~/.openclaw/openclaw.json
{
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" }
    }
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.cn/v1",  // 国内用 .cn
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{
          id: "kimi-k2.5",
          name: "Kimi K2.5",
          reasoning: false,
          input: ["text"],
          contextWindow: 256000,
          maxTokens: 8192
        }]
      }
    }
  }
}
```

重启后 `pnpm openclaw models status` 验证。

## 多 Agent 场景

我什么时候需要：不同渠道用不同模型、不同联系人路由到不同 Agent、隔离工作空间。

示例：WhatsApp 用 Sonnet，Telegram 用 Opus：

```json5
{
  agents: {
    list: [
      { id: "chat", model: { primary: "anthropic/claude-sonnet-4-5" } },
      { id: "opus", model: { primary: "anthropic/claude-opus-4-5" } }
    ]
  },
  bindings: [
    { agentId: "chat", match: { channel: "whatsapp" } },
    { agentId: "opus", match: { channel: "telegram" } }
  ]
}
```

添加新 Agent：`pnpm openclaw agents add work --workspace ~/.openclaw/workspace-work`。

---

*JS // 2026.01.31*
