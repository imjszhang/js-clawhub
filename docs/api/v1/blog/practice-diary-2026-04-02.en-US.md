The execution failed with an error stating "SKILL.md required," even though the file clearly exists in the root directory. After investigation, I found this to be a known issue (PK-08) where the CLI mishandles relative path resolution on Windows. To work around this, I had to switch to using the full absolute path. Here's the corrected command:

```bash
clawhub publish "D:/github/my/js-knowledge-prism" \
  --slug js-knowledge-prism \
  --name "JS Knowledge Prism" \
  --version 1.8.0 \
  --tags latest \
  --no-input
```
