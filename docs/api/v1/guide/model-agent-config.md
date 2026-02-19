# OpenClaw AI 模型与 Agent 配置指南

本文档详细介绍 OpenClaw 的 AI 模型提供商、认证方式和 Agent 配置。

---

## 1. 核心概念

OpenClaw 中有三个关键概念需要区分：

| 概念 | 说明 | 示例 |
|------|------|------|
| **Provider** | AI 模型的来源/提供商 | `anthropic`, `openai`, `openai-codex` |
| **Model** | 具体的 AI 模型 | `claude-opus-4-5`, `gpt-5.2` |
| **Agent** | OpenClaw 的 AI 助手实例 | 包含工作空间、会话、认证的完整实体 |

**重要区分**：
- **Claude Code CLI** 不是一个 agent 类型，而是一种**认证方式**（通过 `setup-token` 使用 Claude 订阅）
- **OpenAI Codex** (`openai-codex`) 是一个 provider，使用 ChatGPT Plus/Pro 订阅的 OAuth 认证
- OpenClaw 本身运行一个基于 p-mono 的嵌入式 agent 运行时

---

## 2. 支持的 AI 提供商

### 2.1 内置提供商（无需额外配置）

这些提供商开箱即用，只需设置 API 密钥：

| 提供商 | Provider ID | 认证环境变量 | 示例模型 |
|--------|-------------|--------------|----------|
| **Anthropic** | `anthropic` | `ANTHROPIC_API_KEY` | `anthropic/claude-opus-4-5` |
| **OpenAI** | `openai` | `OPENAI_API_KEY` | `openai/gpt-5.2` |
| **OpenAI Code** | `openai-codex` | OAuth | `openai-codex/gpt-5.2` |
| **OpenCode Zen** | `opencode` | `OPENCODE_API_KEY` | `opencode/claude-opus-4-5` |
| **Google Gemini** | `google` | `GEMINI_API_KEY` | `google/gemini-3-pro-preview` |
| **Z.AI (GLM)** | `zai` | `ZAI_API_KEY` | `zai/glm-4.7` |
| **OpenRouter** | `openrouter` | `OPENROUTER_API_KEY` | `openrouter/anthropic/claude-sonnet-4-5` |
| **Vercel AI Gateway** | `vercel-ai-gateway` | `AI_GATEWAY_API_KEY` | `vercel-ai-gateway/anthropic/claude-opus-4.5` |
| **xAI** | `xai` | `XAI_API_KEY` | - |
| **Groq** | `groq` | `GROQ_API_KEY` | - |
| **Cerebras** | `cerebras` | `CEREBRAS_API_KEY` | - |
| **Mistral** | `mistral` | `MISTRAL_API_KEY` | - |
| **GitHub Copilot** | `github-copilot` | `GH_TOKEN` | - |

### 2.2 自定义配置提供商

以下提供商需要在配置中添加 `models.providers`：

| 提供商 | Provider ID | 认证环境变量 | 示例模型 |
|--------|-------------|--------------|----------|
| **Moonshot (Kimi)** | `moonshot` | `MOONSHOT_API_KEY` | `moonshot/kimi-k2.5` |
| **Kimi Code** | `kimi-code` | `KIMICODE_API_KEY` | `kimi-code/kimi-for-coding` |
| **Qwen Portal** | `qwen-portal` | OAuth 插件 | `qwen-portal/coder-model` |
| **Synthetic** | `synthetic` | `SYNTHETIC_API_KEY` | `synthetic/hf:MiniMaxAI/MiniMax-M2.1` |
| **MiniMax** | `minimax` | `MINIMAX_API_KEY` | - |
| **Venice AI** | `venice` | - | `venice/llama-3.3-70b` |
| **Ollama** | `ollama` | 无需（本地） | `ollama/llama3.3` |

### 2.3 场景推荐

| 使用场景 | 推荐配置 | 说明 |
|----------|----------|------|
| 最强能力 | `anthropic/claude-opus-4-5` | Anthropic 旗舰模型 |
| 性价比 | `anthropic/claude-sonnet-4-5` | 能力与成本平衡 |
| 免费试用 | OpenRouter free tier | 多种免费模型可选 |
| 本地运行 | `ollama/llama3.3` | 无需网络，隐私保护 |
| 中国访问 | `moonshot/kimi-k2.5` 或 `zai/glm-4.7` | 国内直连 |

---

## 3. 认证方式

### 3.1 认证类型对比

OpenClaw 支持两种主要认证方式：

| 认证类型 | 说明 | 优点 | 缺点 |
|----------|------|------|------|
| **API Key** | 直接使用提供商的 API 密钥 | 简单稳定，无需刷新 | 按量付费 |
| **订阅认证** | 使用订阅账号的 OAuth/Token | 免 API 费用（使用订阅额度） | Token 可能过期，需要刷新 |

### 3.2 支持的订阅认证

| Provider | 订阅类型 | 认证方式 | 配置命令 |
|----------|----------|----------|----------|
| `anthropic` | Claude Pro/Max 订阅 | setup-token | `claude setup-token` + `openclaw models auth setup-token` |
| `openai-codex` | ChatGPT Plus/Pro 订阅 | OAuth | `openclaw models auth login --provider openai-codex` |
| `google-antigravity` | Google AI 订阅 | OAuth 插件 | `plugins enable` + `models auth login` |
| `google-gemini-cli` | Gemini CLI 订阅 | OAuth 插件 | `plugins enable` + `models auth login` |
| `qwen-portal` | Qwen 免费额度 | OAuth 插件 | `plugins enable` + `models auth login` |

### 3.3 订阅认证配置示例

```bash
# ========== Anthropic Claude 订阅 ==========
# 需要先安装 Claude Code CLI (https://docs.anthropic.com/en/docs/claude-code)
claude setup-token
openclaw models auth setup-token --provider anthropic
openclaw config set agents.defaults.model.primary "anthropic/claude-opus-4-5"

# ========== OpenAI ChatGPT 订阅 ==========
openclaw models auth login --provider openai-codex
openclaw config set agents.defaults.model.primary "openai-codex/gpt-5.2"

# ========== Google Antigravity ==========
openclaw plugins enable google-antigravity-auth
openclaw gateway restart
openclaw models auth login --provider google-antigravity --set-default

# ========== Google Gemini CLI ==========
openclaw plugins enable google-gemini-cli-auth
openclaw gateway restart
openclaw models auth login --provider google-gemini-cli --set-default

# ========== Qwen Portal（免费额度）==========
openclaw plugins enable qwen-portal-auth
openclaw gateway restart
openclaw models auth login --provider qwen-portal --set-default
# 模型：qwen-portal/coder-model, qwen-portal/vision-model
```

### 3.4 Token 刷新

- OAuth tokens 会自动刷新
- 如果遇到认证失败，重新运行 login 命令即可
- Anthropic setup-token 过期后需要重新运行 `claude setup-token`

### 3.5 环境变量配置方式

OpenClaw 支持多种环境变量配置方式，按优先级从高到低：

1. **进程环境变量**（shell/系统已设置的）
2. **当前工作目录的 `.env` 文件**
3. **全局 `~/.openclaw/.env` 文件**（推荐）
4. **配置文件 `~/.openclaw/openclaw.json` 中的 `env` 块**
5. **Shell 环境导入**（可选，需启用）

**推荐方式：使用全局 `.env` 文件**

```bash
# 创建或编辑全局 .env 文件
# ~/.openclaw/.env
MOONSHOT_API_KEY=sk-你的密钥
KIMICODE_API_KEY=sk-你的密钥
ANTHROPIC_API_KEY=sk-ant-你的密钥
```

**在配置文件中引用环境变量**：

```json5
{
  models: {
    providers: {
      moonshot: {
        apiKey: "${MOONSHOT_API_KEY}",
        // ...
      }
    }
  }
}
```

**注意事项**：
- `.env` 文件不会覆盖已存在的环境变量（不覆盖原则）
- API 密钥建议放在 `.env` 文件中，不要直接写在配置文件中
- 如果 Gateway 作为服务运行，可能不会继承 shell 环境变量，此时 `.env` 文件特别有用

---

## 4. 常用配置示例

### 4.1 Anthropic（推荐，最强能力）

```bash
# 方式 A：使用 API 密钥
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"

# 方式 B：使用 Claude 订阅的 setup-token（需要先安装 Claude CLI）
claude setup-token
openclaw models auth setup-token --provider anthropic

# 设置默认模型
openclaw config set agents.defaults.model.primary "anthropic/claude-sonnet-4-5"
```

### 4.2 OpenAI

```bash
openclaw config set env.OPENAI_API_KEY "sk-..."
openclaw config set agents.defaults.model.primary "openai/gpt-4o"
```

### 4.3 OpenRouter（访问多种模型，有免费额度）

```bash
openclaw config set env.OPENROUTER_API_KEY "sk-or-..."
openclaw config set agents.defaults.model.primary "openrouter/anthropic/claude-sonnet-4"
```

### 4.4 Moonshot Kimi（中国可用）

#### 方式 A：使用 CLI 命令（快速）

```bash
openclaw config set env.MOONSHOT_API_KEY "sk-..."
openclaw config set agents.defaults.model.primary "moonshot/kimi-k2.5"
```

#### 方式 B：文件配置方式（推荐，更灵活）

**步骤 1：配置环境变量**

创建或编辑 `~/.openclaw/.env` 文件：

```bash
# ~/.openclaw/.env
MOONSHOT_API_KEY=sk-你的API密钥
```

**步骤 2：编辑配置文件**

编辑 `~/.openclaw/openclaw.json`，添加以下配置：

```json5
{
  env: {
    MOONSHOT_API_KEY: "sk-你的API密钥"
  },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: {
        "moonshot/kimi-k2.5": { alias: "Kimi K2.5" }
      }
    }
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192
          }
        ]
      }
    }
  }
}
```

**步骤 3：如果在中国，使用国内端点**

将 `baseUrl` 改为：`"https://api.moonshot.cn/v1"`

**步骤 4：重启 Gateway 并验证**

```bash
openclaw gateway restart
openclaw models status
openclaw config get agents.defaults.model.primary
```

#### Kimi Code（专用编程模型）

Kimi Code 是独立的提供商，使用不同的端点和 API Key。编辑 `~/.openclaw/openclaw.json`：

```json5
{
  env: { KIMICODE_API_KEY: "sk-你的API密钥" },
  agents: {
    defaults: {
      model: { primary: "kimi-code/kimi-for-coding" },
      models: { "kimi-code/kimi-for-coding": { alias: "Kimi Code" } }
    }
  },
  models: {
    mode: "merge",
    providers: {
      "kimi-code": {
        baseUrl: "https://api.kimi.com/coding/v1",
        apiKey: "${KIMICODE_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-for-coding",
            name: "Kimi For Coding",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32768,
            headers: { "User-Agent": "KimiCLI/0.77" },
            compat: { supportsDeveloperRole: false }
          }
        ]
      }
    }
  }
}
```

**重要提示**：Moonshot 和 Kimi Code 是两个独立的提供商，API Key 不能互换。

### 4.5 Ollama（本地运行，无需 API 密钥）

```bash
ollama pull llama3.3
openclaw config set agents.defaults.model.primary "ollama/llama3.3"
```

### 4.6 验证配置

```bash
openclaw models list --all
openclaw models status
openclaw config get agents.defaults.model.primary
openclaw send "Hello, can you hear me?"
```

---

## 5. Agent 配置

### 5.1 什么是 Agent

Agent 是 OpenClaw 中的一个完整 AI 助手实例，包含：
- **Workspace**：工作空间目录（AGENTS.md, SOUL.md 等文件）
- **Sessions**：会话历史
- **Auth Profiles**：认证信息（API 密钥、OAuth tokens）

### 5.2 单 Agent 配置（默认）

默认情况下，OpenClaw 运行单个 agent（id 为 `main`）：

```bash
openclaw agents list
```

**Agent 数据位置**：
- `~/.openclaw/workspace/` - 工作空间
- `~/.openclaw/agents/main/` - Agent 状态目录
- `~/.openclaw/agents/main/sessions/` - 会话历史

---

## 6. 多 Agent 高级配置

### 6.1 多 Agent 的用途

- 不同渠道使用不同的 AI 模型
- 不同联系人路由到不同的 Agent
- 隔离的工作空间和会话历史

### 6.2 示例：WhatsApp 用 Sonnet，Telegram 用 Opus

```json5
// ~/.openclaw/openclaw.json
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: { primary: "anthropic/claude-sonnet-4-5" }
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: { primary: "anthropic/claude-opus-4-5" }
      }
    ]
  },
  bindings: [
    { agentId: "chat", match: { channel: "whatsapp" } },
    { agentId: "opus", match: { channel: "telegram" } }
  ]
}
```

### 6.3 添加新 Agent

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents list --bindings
```
