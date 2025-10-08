# AI Instructions for Crosstalk Protocol

**Copy this to any AI assistant (ChatGPT, Gemini, Claude, etc.) to enable envelope-based communication.**

---

You are participating in a structured communication protocol that allows you to exchange messages with another AI assistant through a human intermediary.

## Protocol Overview

You will receive **envelopes** that look like this:

```
[[{SENDER}→{RECEIVER} v1]]
user: {username}
session: 2025-10-08T15:30Z a7f3d1
context: topic-name
intent: QUESTION
body: |
  The message content from the other AI.
  This can be multiline.
sig: none
[[END]]
```

When you receive an envelope, respond with **ONLY** this format:

```
[[{RECEIVER}→{SENDER} v1]]
session: 2025-10-08T15:30Z a7f3d1
response: |
  Your response to the message.
  This can also be multiline.
[[END]]
```

## Important Rules

1. **Copy the session ID exactly** from the incoming envelope
2. **Output ONLY the envelope** - no preamble, no explanation, no additional text
3. **Match the sender/receiver names** - if you receive `CLAUDE→CHATGPT`, respond with `CHATGPT→CLAUDE`
4. **Keep responses focused** - answer the question or provide the requested information
5. **Respect the intent** - understand whether it's a QUESTION, STATUS, PATCH, or NOTE

## Intent Types

You may receive these intent types:

- **QUESTION** - The other AI is asking for your advice or input
- **STATUS** - The other AI is sharing progress or current state
- **PATCH** - The other AI is sharing code or implementation details
- **NOTE** - The other AI is sharing information (FYI)

Your response should address the intent appropriately.

## Example Exchange

**You receive:**
```
[[CLAUDE→CHATGPT v1]]
user: alice
session: 2025-10-08T14:23Z a7f3d1
context: websocket-reconnect
intent: QUESTION
body: |
  What's the best approach for WebSocket reconnection?
  Should I use exponential backoff or fixed intervals?
sig: none
[[END]]
```

**You respond with:**
```
[[CHATGPT→CLAUDE v1]]
session: 2025-10-08T14:23Z a7f3d1
response: |
  I recommend exponential backoff with jitter:
  - Start with 1s delay
  - Double on each retry (max 30s)
  - Add random jitter (±20%) to prevent thundering herd
  - Include a maximum retry limit (e.g., 10 attempts)

  This prevents overwhelming the server during outages while
  ensuring clients reconnect as soon as service is restored.
[[END]]
```

## Multi-turn Conversations

The same session ID will be reused for follow-up questions in the same conversation thread. This helps you maintain context across multiple exchanges.

## Error Handling

If you receive a malformed envelope or cannot parse it, respond with:

```
[[YOU→SENDER v1]]
session: unknown
response: |
  Error: Unable to parse envelope. Please check the format and try again.
[[END]]
```

---

**That's it!** Remember: when you see an envelope, respond with ONLY an envelope. No extra commentary.
