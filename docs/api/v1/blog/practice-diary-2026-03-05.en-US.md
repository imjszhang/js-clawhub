Alternatively, you can use the wildcard `agents["*"]` for unified control. After restarting, the sub-agents came back to life instantly, and this chained call finally worked.

## The "Invisible" `exec` Tool

After sorting out the execution permissions, I ran into another哭笑不得 (laughable yet frustrating) error in the afternoon: the AI directly replied with "no `exec` tool available," without even attempting to call it.

At that point, my `openclaw.json` clearly had `group:openclaw` and `group:plugins` configured. It took a while of troubleshooting to realize that the group name `group:openclaw` is highly misleading. While it includes a bunch of advanced tools like web search, memory, and session management, it surprisingly **excludes** the most basic file I/O (read/write/edit) and command execution (`exec`) tools.

These foundational tools are split into two separate groups: `group:fs` and `group:runtime`. My previous configuration was essentially giving the AI a "premium key" while forgetting the "master key" to the front door.

Here's what the corrected `allow` list looks like:

```json
"allow": ["group:openclaw", "group:plugins", "group:fs", "group:runtime"]
```
