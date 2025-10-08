# AI Crosstalk Protocol Specification

Version 1.0

## Overview

This protocol enables structured communication between two AI assistants via a human intermediary who copy-pastes messages between them. It uses versioned envelope structures to ensure reliable parsing and session tracking.

## Configuration

Before using the protocol, create a `config.json` file (see `config.example.json`):

```json
{
  "user": "your-name",
  "sender": "AI-A",
  "receiver": "AI-B",
  "version": "1"
}
```

- `user`: The human intermediary's name
- `sender`: Name/identifier for the first AI
- `receiver`: Name/identifier for the second AI
- `version`: Protocol version (currently "1")

## Envelope Format

### Sending a Message (AI-A → AI-B)

```
[[{SENDER}→{RECEIVER} v{VERSION}]]
user: {USERNAME}
session: <UTC timestamp + short random ID>     # e.g. 2025-10-08T07:15Z 3b2a9c
context: <project/subsystem name>              # e.g. api-design/authentication
intent: <QUESTION | STATUS | PATCH | NOTE>     # choose one
body: |
  <your message here, multiline allowed. Indent code by two spaces.>
sig: none
[[END]]
```

**Field Descriptions:**

- **session**: ISO 8601 UTC timestamp (truncated to minutes) + 6-character random hex ID
- **context**: Short descriptor of what the message relates to (project, file, module, etc.)
- **intent**: Message type
  - `QUESTION` - Asking for advice, information, or input
  - `STATUS` - Logging current state or progress updates
  - `PATCH` - Sharing code changes, diffs, or implementations
  - `NOTE` - Sharing information for awareness (FYI)
- **body**: The actual message content (multiline allowed, indent code blocks by 2 spaces)
- **sig**: Signature field (currently unused, set to "none")

### Receiving a Response (AI-B → AI-A)

```
[[{RECEIVER}→{SENDER} v{VERSION}]]
session: <session ID from original message>
response: |
  <response content, multiline allowed>
[[END]]
```

**Field Descriptions:**

- **session**: Must match the session ID from the original message
- **response**: The reply content (multiline allowed)

## Protocol Rules

### For Sending AI

1. Include ALL fields in the exact order specified
2. Generate a unique session ID for each new conversation thread
3. Keep context descriptive but concise (typically 1-4 words)
4. Choose the appropriate intent type
5. Output ONLY the envelope block when sending (no additional commentary)

### For Receiving AI

1. Parse only envelopes with the correct header format: `[[{YOUR_NAME}→... v{VERSION}]]`
2. Verify the session ID matches previous context if continuing a conversation
3. Extract and process the response/body content
4. Ignore any text outside the envelope structure

### For Human Intermediary

1. Copy the entire envelope block (including `[[...]]` markers)
2. Paste it to the receiving AI without modification
3. Copy the response envelope back
4. Session IDs help track conversation threads

## Example Exchange

### Claude asks ChatGPT a question:

```
[[CLAUDE→CHATGPT v1]]
user: alice
session: 2025-10-08T14:23Z a7f3d1
context: websocket-reconnect
intent: QUESTION
body: |
  What's your recommended approach for WebSocket reconnection logic?
  Should I use exponential backoff or fixed intervals?
sig: none
[[END]]
```

### ChatGPT responds:

```
[[CHATGPT→CLAUDE v1]]
session: 2025-10-08T14:23Z a7f3d1
response: |
  I recommend exponential backoff with jitter:
  - Start with 1s delay
  - Double on each retry (max 30s)
  - Add random jitter (±20%) to prevent thundering herd
  - Include a maximum retry limit (e.g., 10 attempts)
[[END]]
```

## Design Principles

- **Structured**: Predictable format for reliable parsing
- **Versioned**: Protocol can evolve while maintaining compatibility
- **Session-tracked**: Conversation threads are identifiable
- **Context-aware**: Each message includes scope/topic information
- **Intent-driven**: Message purpose is explicit
- **Minimal**: No unnecessary fields or complexity
- **Human-mediated**: Designed for copy-paste workflow

## Extensions

The protocol can be extended in future versions by:
- Adding new intent types
- Including optional fields (backward compatible)
- Creating domain-specific envelope types
- Implementing signature verification (using the `sig` field)

## Best Practices

1. **Keep context specific**: Use filenames, module names, or clear topic identifiers
2. **Match intent to purpose**: Choose the intent that best describes your message
3. **Format code clearly**: Indent code blocks by 2 spaces for readability
4. **Track sessions**: Reuse session IDs for follow-up questions in the same thread
5. **Be concise**: AIs should communicate efficiently without unnecessary preamble
