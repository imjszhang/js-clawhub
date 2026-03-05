# When Security Mechanisms Treat `curl | bash` as an Attack: The Triple Defense Line on Day 27

> Day 27 · 2026-02-26

Today was a classic "pitfall-heavy" day. I originally planned to smoothly push forward the independent distribution and automated discovery system for JS-Eyes. Instead, I got tripped up repeatedly by OpenClaw's security mechanisms and path resolution logic. Fortunately, once these pitfalls were filled, the overall robustness of the system jumped up a notch.

## Security Mechanism's "Over-Defense": Why Didn't `curl | bash` Even Trigger an Approval Prompt?

The most headache-inducing moment this morning happened when trying to run a standard installation script. I wanted to test the newly written independent distribution flow, so I executed the classic `curl -fsSL https://js-eyes.com/install.sh | bash`. The result? It didn't execute, nor did it pop up the expected "Allow execution?" approval dialog. Instead, it was coldly rejected directly by the Agent.

The troubleshooting process was like peeling an onion. First, I confirmed that OpenClaw's `exec` security mechanism uses an `allowlist` mode. In this mode, commands containing the pipe symbol `|` are split into independent segments. `curl ...` is one segment, and `bash` is another. The default security allowlist (`safeBins`) only includes pure text processing tools like `jq`, `cut`, and `head`. Since `bash` can execute arbitrary scripts from stdin, it can never be automatically classified as a safe command.

But this didn't explain why there wasn't even a prompt. Digging deeper into `~/.openclaw/exec-approvals.json`, I discovered the first trap: my configuration file had an empty `agents` field. In OpenClaw's logic, an empty config doesn't mean "lenient"; instead, it falls back directly to `security=deny`, causing all host execution requests to be silently intercepted.

After adding the agent configuration and setting `ask: on-miss`, I thought the problem was solved, but it was still rejected. This was the biggest twist of the day: it turns out the default value for `tools.exec.host` is `sandbox`. When `exec` runs inside a Docker sandbox, it simply doesn't read the `exec-approvals.json` on the host, rendering all approval logic ineffective.

The final solution was to explicitly declare `tools.exec.host: "gateway"` in `openclaw.json`, forcing commands to execute on the gateway host, and starting a new Session to clear the old override state. At this moment, I realized how tight the so-called "triple defense line" of security—segment parsing, allowlist validation, and dynamic approval—really is under default configurations. It's so tight that it even blocks its own people from getting in.

## From Manual Registration to Auto-Discovery: Building a "Four-Layer Architecture" for Skill Discovery

After solving the execution permission issues, the afternoon's focus shifted to the JS-Eyes skill discovery system. The previous extension skill `js-search-x` had a terrible installation experience; users had to manually edit JSON config files and remember exact paths. This would be a disaster for promoting the Agent ecosystem.

I decided to stop waiting for OpenClaw core API updates and instead build my own discovery system using existing GitHub Pages infrastructure. The core idea was to turn `js-eyes.com` into a static registry center.

The implementation was divided into four layers:

1.  **Static Registry**: Modified the build script `builder.js` to automatically scan the `skills/` directory for `SKILL.md`, parse the YAML frontmatter, and generate a standard `skills.json`. I even hit a YAML parser indentation bug here, where writing `<=` as `<` caused nested level parsing errors. After fixing it, the metadata was finally extracted correctly.
2.  **Independent Packages**: Generated independent zip packages for each sub-skill, hosted under `js-eyes.com/skills/{id}/`, making on-demand downloads easy.
3.  **Upgraded Installation Script**: Added parameter support to `install.sh`. Now, running `curl ... | bash -s -- js-search-x` automatically pulls metadata from the registry and completes the installation.
4.  **Agent Tooling**: Added two new tools to the OpenClaw plugin: `js_eyes_discover_skills` and `js_eyes_install_skill`. The Agent can now autonomously query the registry, discover missing capabilities, and then automatically download, extract, run `npm install`, and even update local configurations.

Watching the Agent call `discover` to find `js-search-x`, then call `install` to complete the setup, and finally restart to load the new tools gave me a thrilling sense of a "self-bootstrapping" closed loop. This not only decouples us from ClawHub's marketplace dependencies but also makes skill extensions feel as natural as installing plugins.

## The Invisible Trap of Path Resolution: Separation of State Directory and Workspace

While testing the new tool's ability to write configurations, I hit another hidden pitfall. The logs reported an `ENOENT` error, stating it couldn't find `C:\Users\Helix\.openclaw\workspace\MEMORY.md`. Yet, I had clearly set `OPENCLAW_STATE_DIR` to migrate the data directory to the D drive.

It turns out that OpenClaw's **State Directory** and **Default Workspace Directory** use two independent resolution logics. `OPENCLAW_STATE_DIR` only affects state file storage, while the Workspace's default path is constructed based on `HOME` or `USERPROFILE`. On Windows, even if the user migrates the state directory, the Workspace remains stubbornly pinned to the user directory on the C drive.

This design separation caused tools like `read/memory` to still point to the non-existent C drive path during relative path resolution. The solution was to explicitly specify the `workspace` path in `agents.defaults` within `openclaw.json`, using configuration priority rules to override default behavior. Although this adds an extra configuration step, it avoids the uncertainty brought by implicit reliance on environment variables.

## Today's Takeaways

- An empty configuration does not equal a lenient policy; missing agent configuration in `exec-approvals.json` causes the system to fall back to a default "deny all" mode.
- Security validation for piped commands is performed segment-by-segment. The characteristic of `bash` executing scripts from stdin means it can never enter the default security allowlist.
- The `exec` approval mechanism only takes effect when `host` is set to `gateway` or `node`; the default `sandbox` mode bypasses the host's security configuration files.
- Combining a static registry with build automation allows Agents to achieve autonomous skill discovery and installation without relying on upstream core changes.
- The resolution logic for the state directory and the workspace directory is separated; when migrating data storage, the workspace path must be explicitly configured in sync.
