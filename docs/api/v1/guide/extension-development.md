# OpenClaw 扩展开发指南

本指南介绍如何为 OpenClaw 开发自定义扩展（插件）。扩展系统允许你在不修改核心代码的情况下添加新功能，包括消息渠道、AI 工具、CLI 命令、HTTP 端点、生命周期钩子等。

---

## 1. 扩展架构概述

OpenClaw 的扩展系统基于以下核心概念：

1. **发现机制**：系统自动扫描多个位置查找扩展
2. **清单注册**：通过 `openclaw.plugin.json` 声明扩展元数据
3. **运行时加载**：使用 jiti 动态加载 TypeScript/JavaScript 模块
4. **Plugin API**：提供统一的 API 注册各类功能

### 扩展发现顺序

1. **config** - 配置文件中 `plugins.loadPaths` 指定的路径
2. **workspace** - 工作区 `.openclaw/extensions/` 目录
3. **global** - 全局 `~/.openclaw/extensions/` 目录
4. **bundled** - 内置扩展（`extensions/` 目录）

---

## 2. 扩展类型

| 类型 | 说明 | 示例 |
|------|------|------|
| **Channel** | 消息渠道 | `telegram`, `twitch`, `matrix` |
| **Provider** | AI 模型提供商（认证流程） | `google-antigravity-auth` |
| **Tool** | AI Agent 可调用的工具 | `llm-task`, `voice-call` |
| **Memory** | 长期记忆存储 | `memory-lancedb` |
| **Service** | 后台服务 | `diagnostics-otel` |

---

## 3. 快速开始

### 最小扩展示例

```typescript
// extensions/my-plugin/index.ts
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";

const plugin = {
  id: "my-plugin",
  name: "My Plugin",
  description: "A simple example plugin",
  configSchema: emptyPluginConfigSchema(),
  
  register(api: OpenClawPluginApi) {
    api.logger.info("my-plugin: loaded successfully");
    
    api.registerTool({
      name: "hello_world",
      description: "Says hello",
      parameters: { type: "object", properties: {} },
      async execute() {
        return {
          content: [{ type: "text", text: "Hello from my plugin!" }],
        };
      },
    });
  },
};

export default plugin;
```

### openclaw.plugin.json

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

### package.json

```json
{
  "name": "@openclaw/my-plugin",
  "version": "1.0.0",
  "type": "module",
  "devDependencies": {
    "openclaw": "workspace:*"
  },
  "openclaw": {
    "extensions": ["./index.ts"]
  }
}
```

---

## 4. 目录结构

```
extensions/my-plugin/
├── index.ts                 # 主入口文件
├── openclaw.plugin.json     # 插件清单（必需）
├── package.json             # NPM 包配置
├── README.md                # 文档
└── src/                     # 源代码目录
    ├── channel.ts
    ├── config.ts
    └── *.test.ts
```

---

## 5. Plugin API 主要方法

| 方法 | 说明 |
|------|------|
| `registerTool(tool, opts?)` | 注册 AI 可调用的工具 |
| `registerChannel(registration)` | 注册消息渠道 |
| `registerProvider(provider)` | 注册 AI 提供商 |
| `registerCli(registrar, opts?)` | 注册 CLI 命令 |
| `registerHttpRoute(params)` | 注册 HTTP 端点 |
| `registerGatewayMethod(method, handler)` | 注册 Gateway RPC 方法 |
| `registerService(service)` | 注册后台服务 |
| `registerCommand(command)` | 注册自定义命令（绕过 LLM） |
| `on(hookName, handler, opts?)` | 注册生命周期钩子 |

---

## 6. 生命周期钩子

使用类型安全的 `api.on()` 注册钩子：

| 钩子名称 | 触发时机 | 可修改返回值 |
|---------|---------|-------------|
| `before_agent_start` | Agent 开始前 | 是（注入上下文） |
| `agent_end` | Agent 结束后 | 否 |
| `message_received` | 收到消息时 | 否 |
| `message_sending` | 发送消息前 | 是（修改/取消） |
| `message_sent` | 消息发送后 | 否 |
| `before_tool_call` | 工具调用前 | 是（修改参数/阻止） |
| `after_tool_call` | 工具调用后 | 否 |
| `session_start` | 会话开始 | 否 |
| `session_end` | 会话结束 | 否 |
| `gateway_start` | Gateway 启动 | 否 |
| `gateway_stop` | Gateway 停止 | 否 |

### 示例：自动记忆注入

```typescript
api.on("before_agent_start", async (event, ctx) => {
  if (!event.prompt || event.prompt.length < 5) return;
  
  const memories = await searchMemories(event.prompt);
  if (memories.length === 0) return;
  
  const context = memories.map((m) => `- ${m.text}`).join("\n");
  
  return {
    prependContext: `<relevant-memories>\n${context}\n</relevant-memories>`,
  };
});
```

---

## 7. 注册工具示例

```typescript
import { Type } from "@sinclair/typebox";
import { stringEnum } from "openclaw/plugin-sdk";

api.registerTool(
  {
    name: "my_tool",
    label: "My Tool",
    description: "Does something useful",
    parameters: Type.Object({
      query: Type.String({ description: "Search query" }),
      limit: Type.Optional(Type.Number({ description: "Max results" })),
      category: Type.Optional(stringEnum(["a", "b", "c"])),
    }),
    async execute(toolCallId, params) {
      const { query, limit = 10 } = params as { query: string; limit?: number };
      const results = await doSomething(query, limit);
      return {
        content: [{ type: "text", text: `Found ${results.length} items` }],
        details: { count: results.length, results },
      };
    },
  },
  { name: "my_tool", optional: true }
);
```

---

## 8. 最佳实践

### 配置验证

始终使用 `configSchema` 验证配置，或使用 Zod 进行运行时验证。

### 错误处理

优雅处理错误，提供有用的错误信息：

```typescript
try {
  const result = await riskyOperation();
  return { content: [{ type: "text", text: result }] };
} catch (err) {
  api.logger.error(`Operation failed: ${String(err)}`);
  return {
    content: [{ type: "text", text: "Operation failed" }],
    details: { error: err instanceof Error ? err.message : String(err) },
  };
}
```

### 延迟初始化

对于重型资源，使用延迟初始化，只在需要时创建连接。

### 清理资源

使用 Service 生命周期管理资源：

```typescript
api.registerService({
  id: "connection-pool",
  start: async () => { /* 初始化 */ },
  stop: async () => { /* 清理 */ },
});
```

---

## 9. 调试与测试

```bash
openclaw plugins list
openclaw plugins validate
```

在扩展目录运行 `pnpm test` 执行测试。

---

## 10. 参考扩展

- `extensions/telegram/` - 简单渠道示例
- `extensions/twitch/` - 复杂渠道示例
- `extensions/voice-call/` - 完整功能示例（工具、CLI、HTTP、服务、钩子）
- `extensions/memory-lancedb/` - 内存插件示例
- `extensions/google-antigravity-auth/` - Provider 示例

自定义 Channel 开发详见 [自定义 Channel 开发](/guide/#custom-channel)。
