# Tiny Core Linux 部署 OpenClaw 可行性报告

好奇 OpenClaw 能不能跑在 Tiny Core 这种极简 Linux 上，做了一轮调研，结论写在下面。

## Tiny Core 是什么

Tiny Core Linux 是高度模块化的极简发行版，2008 年就有了。三种变体：Core（17MB，仅 CLI）、TinyCore（23MB，带 GUI）、CorePlus（248MB，安装镜像）。支持 x86、x86-64、ARM、Raspberry Pi，还有基于 Debian 的 dCore 变体。

## 需求对比

| 需求项 | OpenClaw 要求 | Tiny Core 情况 |
|--------|---------------|----------------|
| Node.js | 22+ | ⚠️ 需手动编译或装扩展 |
| 内存 | 1GB+ 最小，2GB+ 推荐 | ⚠️ 默认 46–64MB，需评估 |
| 持久存储 | 必需 | ⚠️ 需配置 tce/home boot codes |
| 服务管理 | systemd/init | ❌ 只有 BusyBox init |

默认模式（Cloud）系统全在 RAM，重启扩展全丢，不适合 OpenClaw。挂载模式（Mount）应用存 tce/ 目录，可以一试。

## 我的结论

**可行性低**。主要原因：Node.js 22+ 官方仓库可能没有，要自己编译；内存默认太小；没有 systemd，服务管理要手写 bootlocal.sh；工具链不完善，调试麻烦。

**如果真要试**：用挂载模式，配置持久化，手动编译 Node 或考虑 dCore（用 apt 装现代 Node）。dCore 是 Tiny Core 的 Debian 变体，软件生态更全。

## 更现实的选择

| 发行版 | 特点 | 适用场景 |
|--------|------|----------|
| **Raspberry Pi OS** | 官方支持，apt 生态 | Pi 部署 |
| **Alpine Linux** | ~5MB，apk 包管理 | 容器/服务器 |
| **Debian Minimal** | ~150MB，完整 apt | 服务器 |
| **Docker** | 标准 Node 镜像 | 隔离部署 |

生产环境或想省心，我更推荐 Raspberry Pi OS、Alpine、Docker，而不是在 Tiny Core 上硬刚。

---

*JS // 2026.01.31*
