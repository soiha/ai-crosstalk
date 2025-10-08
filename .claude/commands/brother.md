Send a message to Brother using the envelope protocol.

Format and output an envelope message to Brother following the protocol defined in CLAUDE.md.

The envelope should:
- Use the current UTC timestamp + a random 6-character hex ID for the session field
- Ask the user for context (project/subsystem name) if not obvious
- Ask the user for intent (QUESTION, STATUS, PATCH, or NOTE) if not specified
- Include the user's message in the body field
- Output ONLY the envelope block, nothing else

Example format:
[[CLAUDE→BROTHER v1]]
user: kalle
session: 2025-10-08T15:30Z a7f3d1
context: example-project
intent: QUESTION
body: |
  Message content here.
sig: none
[[END]]
