# 技能开发入门

OpenClaw 的技能系统是其最强大的特性之一。技能是可复用的功能模块，可以扩展 AI 助手的能力。

## 什么是技能？

技能（Skill）本质上是一组指令和工具定义，告诉 AI 如何完成特定任务。它可以包括：

- 提示词模板
- API 调用定义
- 工作流程描述
- 配置和参数

## 技能结构

一个典型的技能目录结构：

```
my-skill/
├── SKILL.md          # 技能定义和指令
├── config.json       # 配置文件（可选）
└── tools/            # 工具脚本（可选）
    └── my-tool.js
```

## SKILL.md 编写

`SKILL.md` 是技能的核心文件，它告诉 AI 这个技能做什么以及如何使用：

```markdown
# My Skill Name

## Description
这个技能用于...

## Instructions
当用户要求...时：
1. 首先...
2. 然后...
3. 最后...

## Tools
- `my-tool`: 用于执行...

## Examples
用户: "帮我..."
助手: [执行操作并返回结果]
```

## 安装技能

```bash
# 从 ClawHub 安装
openclaw skill install skill-name

# 从 GitHub 安装
openclaw skill install github:username/skill-name

# 从本地目录安装
openclaw skill install ./path/to/skill
```

## 让 AI 创建技能

最酷的部分：你可以直接告诉 OpenClaw 创建新技能！

在聊天中说：

> "帮我创建一个技能，每天早上 8 点检查天气并发送给我"

AI 会自动：
1. 设计技能结构
2. 编写 SKILL.md
3. 创建必要的工具脚本
4. 安装并激活技能

## 分享技能

创建了好用的技能？可以分享到社区：

1. 将技能推送到 GitHub 仓库
2. 提交到 ClawHub 技能市场
3. 在 Discord 社区分享

## 最佳实践

- **单一职责**：一个技能做一件事
- **清晰指令**：SKILL.md 中的指令要明确具体
- **错误处理**：考虑各种边界情况
- **文档完善**：写好使用说明和示例
