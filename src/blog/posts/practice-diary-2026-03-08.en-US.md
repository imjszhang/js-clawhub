# From Static Navigation to Programmable Plugins: The "Shell" Upgrade of ClawHub

> Day 37 · 2026-03-08

Yesterday, I finished merging the upstream main branch. Today, striking while the iron is hot, I completely plugin-ized ClawHub, this "ecosystem navigation station," and filled in the lingering gaps left by the Gateway upgrade. The goal is to transform ClawHub from a static site that you can only look at into a "memory bank" within the OpenClaw brain that can be invoked at any time.

## Putting a "Plugin Shell" on ClawHub

ClawHub has been running for nearly two months. The data is comprehensive, but it's been a "mute": either relying on human eyes to browse the webpage or depending on the CLI to spit out JSON. Today, I decided to give it a "mouth" so it can converse with the Agent.

Following the template of `js-knowledge-collector`, I created a new `openclaw-plugin` directory in the project root. The core idea is "adding a shell without changing the core": the entry file `index.mjs` directly reuses existing business logic via `await import('../cli/lib/...')`. This was a bit risky because the original CLI follows CommonJS thinking, while plugins must be ESM. Fortunately, `package.json` had already declared `"type": "module"`. I just needed to change the original `require` statements to dynamic `import()`. This not only solved compatibility issues but also unexpectedly gained the benefit of "lazy loading"—the search module won't load into memory unless the Agent calls the search tool.

The most纠结 (tricky) part was the data source for HTTP routes. Should I directly serve the built static JSON in `docs/`, or read `src/` in real-time? I chose the latter. Although it requires reading files on every request, it guarantees that the API, CLI, and webpage always see consistent data, eliminating the need to run `build` every time a Markdown file is changed. For security, I added a path normalization check in the wildcard route to prevent anyone from peeking at files outside the project root directory via `../../`.

After registering 8 Agent Tools and 10 HTTP routes, I restarted the Gateway. I asked "What new projects are there recently?" in the chat box. Watching the Agent skillfully call `clawhub_projects` and spit out a structured list gave me a great feeling of "dead data coming alive."

## "Mine Sweeping" After the Gateway Upgrade

The plugins are working, but the Gateway itself is still raising alarms. After merging the upstream `2026.3.7` version, `gateway status` kept提示 (prompting) that the configuration was outdated, and even warned about `OPENCLAW_GATEWAY_TOKEN` being embedded in scheduled task environment variables.

Checking the changelog revealed that the new version forcibly requires reading the Token from the configuration file, no longer allowing it to be hardcoded in system environment variables. I tried explicitly adding `"mode": "token"` in `openclaw.json` and then ran `openclaw gateway install --force` to reinstall the service. The first attempt failed directly: `schtasks create failed: Access is denied`. I forgot about this—modifying scheduled tasks under Windows requires elevated privileges.

I quickly launched a PowerShell window with administrator privileges using `Start-Process -Verb RunAs`, ran the command again, and finally saw `Installed Scheduled Task: OpenClaw Gateway`.

Another small hiccup occurred during restart: port 18789 was occupied. It turned out the old process wasn't killed cleanly and was stuck in the TCP TimeWait state. I manually `stop`ped the service, used PowerShell to force-kill the residual processes, waited a few seconds, and then `start`ed it again. Finally, the status lights turned all green.

I also took a quick scan of the security audit, which reported 6 CRITICAL/WARN items. Things like "Open Group Chat Policy" and "Privilege Escalation Tool Wildcard Whitelist." Looking closely, these were all targeted at multi-user group chat scenarios. Since I'm running a local single-chat personal assistant with no group chat features enabled, these alerts are essentially "false positives" for me. However, for peace of mind, I still changed `groupPolicy` to `allowlist` (even though the list is empty) to prevent any chaos if I accidentally slip up and pull the bot into a group someday.

## Automated Sync: Let Cron Do the Work

Although the ClawHub blog import process is perfect, it still requires manually typing `clawhub blog-import`. Today, I went ahead and integrated Cron as well.

Referencing the pattern of `js-knowledge-prism`, I wrote a `clawhub_blog_auto_sync` tool and registered a `setup-cron` subcommand. The logic is simple: trigger once every 2 hours. Upon receiving the message, the Agent automatically checks the sources in `sources.json`; if there are new articles, it imports, translates, builds, and pushes them.

Here's a detailed optimization: I added a gate control condition `totalImported > 0` inside the tool. If there are no new articles, it skips translation and building entirely, not even generating a Git Commit. This way, even if it runs every two hours, the cost of an empty run is nearly zero. After configuring `openclaw hub setup-cron`, watching the terminal output the next execution time, I feel like I never have to worry about "whether there are new articles to sync today" ever again.

## Today's Takeaways

- The core of the plugin upgrade is "adding a shell without changing the core." By reusing existing CLI logic through ESM dynamic imports, we retain standalone running capabilities while接入 (integrating) into the Agent ecosystem.
- HTTP routes reading directly from the source directory (`src/`) instead of build artifacts (`docs/`) trades a tiny performance cost for real-time data consistency.
- Reinstalling the service after a Gateway upgrade must be executed with elevated privileges, and one must be wary of the security debt of hardcoding Tokens in system environment variables in older versions.
- Security audit alerts need to be evaluated based on specific usage scenarios (e.g., single chat vs. group chat) to avoid being scared by generic CRITICAL labels into over-configuring.
- Cron automated tasks must design an "empty run optimization" mechanism, using gate conditions to skip translation, building, and commit steps when there are no changes.
