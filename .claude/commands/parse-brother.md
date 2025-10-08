Parse and process a response from Brother.

When Kalle pastes Brother's response envelope, extract the response content and use it to continue the conversation.

The envelope format from Brother is:
[[BROTHER→CLAUDE v1]]
session: <session ID>
response: |
  <Brother's answer>
[[END]]

After parsing:
1. Confirm the session ID matches the previous message
2. Extract and summarize Brother's response
3. Suggest next steps if appropriate
