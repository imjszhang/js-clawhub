# From "Asking for Permission at Every Step" to "Full Trust": Regaining Control After a Gateway Restart

> Day 27 · 2026-02-27

After making the changes, I casually ran `pnpm openclaw gateway restart`. Once it came back up, those previously stuck `curl | bash` one-two punches finally executed smoothly in one go. This shift from "asking for permission at every step" to "full trust" might only apply locally, but that sense of control instantly returned. That said, I'm well aware that `full` mode is basically running naked; there's no way I'd dare take this config into production.

## The "Trap" of Channel Access: `open` Policy Must Be Paired with a Whitelist

This afternoon, I fell into a logical trap while configuring the Feishu channel. Wanting the bot to respond to all direct messages, I casually set `channels.feishu.dmPolicy` to `open`. Thinking everything was sorted, I was surprised when the gateway failed to start due to a validation error.

Digging into the docs, I discovered that setting `dmPolicy` to `open` comes with a strict dependency: you must explicitly configure `allowFrom: ["*"]` at the same time. The system logic is straightforward: if you're opening up the policy, you have to explicitly state "everyone" in the whitelist; otherwise, it's treated as a configuration conflict.

```bash
pnpm openclaw config set channels.feishu.dmPolicy open
pnpm openclaw config set channels.feishu.allowFrom '["*"]'
```
