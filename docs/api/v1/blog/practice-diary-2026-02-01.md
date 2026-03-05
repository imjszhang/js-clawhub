# 用一条命令生成标准 Skill：从目录结构到打包发布

> Day 2 · 2026-02-01

这个命令很智能，直接生成了标准的目录结构：`SKILL.md`、`scripts/` 和 `references/`。

在编写 `SKILL.md` 的 Frontmatter 时，我特意加上了 `metadata.openclaw` 字段，声明它依赖 Python 和一个特定的环境变量 `LOCAL_API_KEY`。这里有个细节，`name` 必须是小写且用连字符，否则后续的打包脚本会报错。

写完内容后，我试着运行了打包命令：

```bash
python3 skills/skill-creator/scripts/package_skill.py skills/my-local-search ./dist
```
