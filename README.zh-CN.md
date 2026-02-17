<h1 align="center">JS ClawHub</h1>

<p align="center">
  <strong>JS 精选的 OpenClaw 生态项目导航</strong>
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License: MIT" />
  </a>
  <a href="https://github.com/imjszhang/js-clawhub">
    <img src="https://img.shields.io/badge/Version-1.0.0-blue.svg?style=flat-square" alt="Version" />
  </a>
  <a href="https://imjszhang.github.io/js-clawhub/">
    <img src="https://img.shields.io/badge/Demo-GitHub%20Pages-FCD228?style=flat-square" alt="Demo" />
  </a>
</p>

<p align="center">
  <a href="./README.md">English</a> | <a href="#特性">中文文档</a>
</p>

---

## 这是什么？

一个由 JS 策展的 [OpenClaw](https://openclaw.ai/) 生态聚合导航站，收录优质技能、集成、教程与社区资源。

| | 其他目录站 | JS ClawHub |
|--|-----------|------------|
| **策展** | 自动抓取或无筛选 | ✅ JS 人工精选，附编辑点评 |
| **内容** | 仅外链 | ✅ 教程、指南、评测、社区动态 |
| **国际化** | 单语言 | ✅ 中英双语支持 |
| **成本** | 不一定 | ✅ 免费、开源、纯静态 |

## 特性

- **项目导航** — 分类浏览 OpenClaw 生态的精选项目和集成
- **技能市场** — 发现和探索社区创建的技能，附详细文档
- **博客系统** — 深度教程、架构分析与部署指南
- **入门指南** — 从安装到高级配置的分步文档
- **Pulse 动态** — AI 筛选的 OpenClaw 社区 X/Twitter 热点，每日更新
- **中英双语 (i18n)** — 完整的中英文支持，一键切换语言

## 技术栈

| 技术 | 用途 |
|-----|------|
| **纯静态站点** | 零服务器成本，部署在 GitHub Pages |
| **Neo-Brutalism 设计** | 大胆现代的 UI，JS 品牌视觉系统 |
| **Tailwind CSS** | 实用优先的响应式样式 |
| **Three.js** | 动态 3D 背景 |
| **marked.js + highlight.js** | 客户端 Markdown 渲染 + 代码高亮 |
| **自研 I18nManager** | 轻量级客户端国际化方案 |

## 项目结构

```
js-clawhub/
├── src/                          # 源码目录
│   ├── index.html                # 首页
│   ├── shared/
│   │   ├── js/
│   │   │   ├── i18n/             # i18n 系统
│   │   │   │   ├── index.js      # I18nManager 核心
│   │   │   │   └── locales/      # zh-CN.js, en-US.js
│   │   │   ├── nav.js            # 导航栏（含语言切换）
│   │   │   ├── footer.js         # 页脚组件
│   │   │   └── search.js         # 搜索过滤
│   │   └── css/brutal.css        # 设计系统
│   ├── blog/                     # 博客系统
│   ├── skills/                   # 技能市场
│   ├── guide/                    # 入门指南
│   └── pulse/                    # 社区动态
├── build/build.js                # 构建脚本（src/ → docs/）
├── docs/                         # 构建产物（GitHub Pages 部署）
└── scripts/                      # 工具脚本
```

## 快速开始

```bash
# 克隆
git clone https://github.com/imjszhang/js-clawhub.git
cd js-clawhub

# 开发（直接 serve src/）
npm run dev

# 构建（复制 src/ → docs/ 并校验翻译）
npm run build

# 预览构建产物
npm run preview
```

## 命令列表

| 命令 | 说明 |
|-----|------|
| `npm run dev` | 启动开发服务器（serve `src/`） |
| `npm run build` | 构建到 `docs/`，含 i18n 翻译校验 |
| `npm run preview` | 在 3000 端口预览构建产物 |
| `npm run setup` | 配置 Cloudflare + GitHub Pages |

## 国际化 (i18n)

JS ClawHub 支持中文（默认）和英文双语。i18n 系统包含：

- **UI 翻译** — 所有静态文案通过 `data-i18n` 属性和语言包文件管理
- **双语 JSON 数据** — 内容字段使用 `{"zh-CN": "...", "en-US": "..."}` 对象
- **双语 Markdown** — `article.md`（中文默认）+ `article.en-US.md`（英文版）
- **语言切换** — 导航栏一键切换 EN / 中
- **偏好持久化** — 用户语言选择保存在 localStorage

## 部署

站点通过 GitHub Pages 从 `docs/` 目录部署。

```bash
# 构建并部署
npm run build
git add docs/
git commit -m "build: 更新站点"
git push
```

GitHub Pages 会自动提供更新后的内容。

## 贡献

欢迎 PR！Fork → 修改 → 提交。

要添加新项目到导航站，请创建 issue 或提交包含项目信息的 PR。

## 许可证

MIT

## 致谢

- [OpenClaw](https://openclaw.ai/) — 开源个人 AI 助手
- [DeepSeek Cowork](https://github.com/imjszhang/deepseek-cowork) — i18n 和部署架构参考
- [Tailwind CSS](https://tailwindcss.com/) — 实用优先的 CSS 框架
- [Three.js](https://threejs.org/) — 3D 图形库

---

<div align="center">

**Curated by JS — 让 OpenClaw 生态触手可及**

[![X](https://img.shields.io/badge/X-@imjszhang-000000?logo=x)](https://x.com/imjszhang)

</div>
