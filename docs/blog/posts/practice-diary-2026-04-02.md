CLI 立即报错提示 "SKILL.md required"，尽管该文件明明存在于当前目录。经过排查，确认这是 Windows 环境下 CLI 对相对路径 `.` 解析的缺陷。解决方案是改用完整的绝对路径：
```bash
clawhub publish "D:/github/my/js-knowledge-prism" --slug js-knowledge-prism --name "JS Knowledge Prism" --version 1.8.0 --tags latest --no-input
