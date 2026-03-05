Here's a pitfall: backslashes in paths must be doubled (`\\`), otherwise JSON parsing will fail. I initially copied the path directly from File Explorer, and after reloading the window, the terminal still wouldn't start. It took me a while to realize it was an escape character issue.

After saving the configuration, run `Developer: Reload Window`. When creating a new terminal, seeing the prompt change from `PS D:\...>` to `Administrator@DESKTOP-XXXXX MINGW64 /d/...$` was incredibly refreshing. Commands like `ls -la`, `grep`, and `cat` finally work normally. Even the local alias for `openclaw` was easily set up by adding a single line to `~/.bashrc`: `alias openclaw="pnpm --dir /d/github/fork/openclaw openclaw"`.

## The "Critical 5 Seconds" of WeCom Deployment: ACK First, Work Later

With the terminal sorted, it's time for the main event: deploying the WeCom plugin. WeCom's callback mechanism has an extremely strict requirement: **the server must return an HTTP 200 within 5 seconds**. Otherwise, it assumes a timeout and retries, up to 3 times. This means if you decrypt the message first, pass it to the AI for processing, wait for the AI to generate a reply, and then return the response, you will likely time out.

When writing the callback handling logic in `src/monitor.ts`, I specifically split the process into two steps:

1.  **Fast Acknowledgment (ACK)**: Upon receiving the POST request and passing the signature verification, immediately return `200 "success"`. This step must be completed in milliseconds to tell WeCom, "I received it, don't resend."
2.  **Asynchronous Processing**: After returning the response, decrypt the `Encrypt` field in the background, parse the XML, and pass the message to the AI Agent for processing.

```typescript
// ACK first (WeCom requires a response within 5 seconds, otherwise it retries)
res.statusCode = 200;
res.end("success");

// Decrypt message and process asynchronously (does not block HTTP response)
const { msg: decryptedXml } = decryptWecom({ aesKey, cipherTextBase64: encrypt });
const msgObj = parseIncomingXml(decryptedXml);
// → Hand over to processInboundMessage() to dispatch to AI Agent
```
