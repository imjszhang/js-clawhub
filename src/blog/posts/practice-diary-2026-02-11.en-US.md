# Letting AI Take Over My Chrome: A Browser Relay Field Log

> Day 12 · 2026-02-11

Yesterday, I was still wrestling with isolated managed browsers. Today, it's finally time to get serious: letting AI directly operate my daily-driver Chrome, inheriting all existing login sessions. This is what a true "intelligent assistant" should look like.

## Installing a "Remote Control" for Chrome

While the previous managed browsers were secure, having to log in every time and solve CAPTCHAs just to start an automation task was a huge pain. Today's core mission was deploying Browser Relay, enabling the AI to directly control my existing tabs.

The installation process was smoother than expected. A single command, `openclaw browser extension install`, dropped the extension files into `~/.openclaw/browser/chrome-extension`. Next came the standard Chrome developer workflow: open `chrome://extensions`, enable Developer Mode, and load the unpacked extension.

What surprised me most was its "badge" mechanism. After loading, the extension icon didn't immediately show a status. Only when I manually clicked the icon to attach the current tab did the badge turn red with `ON`. This means the AI won't randomly hijack the page I'm viewing; control remains entirely in my hands. However, I did hit a small snag: initially, the icon showed a red `!`. After troubleshooting for a while, I realized the Gateway wasn't fully started, and the local relay server (default port 18792) wasn't running. I tested it with `curl -I http://127.0.0.1:18792/`, confirmed it was unreachable, and after restarting the Gateway, it immediately turned green. This kind of visual feedback is far more intuitive than staring at dry logs.

## The Agent Finally "Understands" My Login State

Installing the extension was just step one; the real magic happened when the agent invoked the `browser` tool for the first time.

Previously, with managed browsers, I had to export/import cookies or let the agent re-login on a blank page. Today, I simply said in the chat, "Help me operate on the already open GitHub page," and ensured the target tab's badge was `ON`. The agent automatically recognized and used the `profile="chrome"` parameter, issuing commands directly to my browser via the CDP protocol.

Watching the AI automatically click, type, and even read content on my already logged-in GitHub page gave me a strong sense that "it's really using my browser." The link drawn in the architecture diagram—Agent → Gateway → Local Relay → Extension → Tab—is now running in reality. I also tried the "Attach all tabs in this window" option in the right-click menu, instantly bringing the entire window's tabs under control. Even newly created tabs automatically attached. This seamless integration experience is exactly what a productivity tool should be.

Of course, with great power comes great responsibility. The repeated security warnings in the documentation sent a chill down my spine: once attached, the AI can read everything in that tab, including sensitive information and cookies. Therefore, I specifically attached only work-related tabs and immediately right-clicked "Detach all tabs" to disconnect after finishing. This "use and leave" caution is likely an essential skill for using Browser Relay.

## Today's Takeaways

- Browser Relay achieves non-intrusive tab control through collaboration between a local relay server (port 18792) and a Chrome extension.
- Badge status (ON/!/...) is the most intuitive debugging basis for judging relay connection and attachment status, far more efficient than checking logs.
- The agent operates on "attached" tabs rather than "currently active" tabs; defining clear control boundaries prevents accidental operations.
- Inheriting the existing browser's login state significantly boosts automation efficiency but also introduces security risks regarding sensitive data access. The scope of attachment must be minimized.
