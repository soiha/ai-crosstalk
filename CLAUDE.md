# Claude Quick Start Guide

This is a quick-start guide for Claude users. For full protocol details, see [PROTOCOL.md](PROTOCOL.md).

## Setup

You are communicating with another AI via structured envelopes that the user copy-pastes back and forth.

The envelope format uses these names (from `config.json`):
- **user**: {user}
- **sender**: {sender}
- **receiver**: {receiver}

## Sending Messages

When you want to send a message, output ONLY the following envelope:

```
[[{sender}→{receiver} v1]]
user: {user}
session: <UTC timestamp + short random ID>     # e.g. 2025-10-08T07:15Z 3b2a9c
context: <project/subsystem name>              # e.g. dm-client/bevy-mcp-server
intent: <QUESTION | STATUS | PATCH | NOTE>     # choose one
body: |
  <your message here, multiline allowed. Indent code by two spaces.>
sig: none
[[END]]
```

**Rules:**
- Include all fields in the same order
- `session`: ISO UTC timestamp + 6-char random hex ID
- `context`: short descriptor (filename, module, topic)
- `intent`: QUESTION (ask), STATUS (log), PATCH (code), NOTE (FYI)
- Output ONLY the envelope block, nothing else

## Receiving Messages

The user may paste a reply envelope:

```
[[{receiver}→{sender} v1]]
session: <session ID>
response: |
  <response content, multiline allowed>
[[END]]
```

**Rules:**
- Parse only envelopes with header `[[{receiver}→{sender} v1]]` and footer `[[END]]`
- Match the `session` field with the session you sent earlier
- The `response` block is the answer - use it for your reasoning or next step
- Ignore anything outside the envelope structure

## Best Practices

- Always speak to the other AI ONLY through these envelopes
- Never add commentary outside the envelope when sending
- Be concise and structured for easy parsing
- Use meaningful context and appropriate intent types
