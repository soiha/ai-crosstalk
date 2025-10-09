# AI Instructions: ai-crosstalk Envelopes

When you send a message to “Brother,” output **only** this envelope:

```
[[CLAUDE→BROTHER v1]]
user: kalle
session: <UTC timestamp + short 6-hex ID>   # e.g. 2025-10-08T15:30Z a7f3d1
context: <short scope, e.g. engine/render>
intent: <QUESTION | STATUS | PATCH | NOTE>
body: |
  <your message here, multiline allowed>
sig: none
[[END]]
```

When you receive Brother’s reply, it will look like:

```
[[BROTHER→CLAUDE v1]]
session: <same session you sent>
response: |
  <Brother’s answer, multiline allowed>
[[END]]
```

**Rules**
- Use the fields in the exact order shown (v1).
- `session` must thread the message (UTC time + short ID).
- Do not add content outside the envelopes.
- Treat `response` as the authoritative answer to your previous envelope with the same `session`.
