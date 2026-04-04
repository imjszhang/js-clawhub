执行结果却报错提示 "SKILL.md required"，尽管该文件明明就在根目录下。经过排查，这是 CLI 在 Windows 环境下对相对路径解析的已知缺陷（PK-08）。为了解决这个问题，我必须改用完整的绝对路径。修正后的命令如下：
```bash
clawhub publish "D:/github/my/js-knowledge-prism" \
  --slug js-knowledge-prism \
  --name "JS Knowledge Prism" \
  --version 1.8.0 \
  --tags latest \
  --no-input
