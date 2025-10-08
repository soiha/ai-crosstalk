# Example Conversations

This directory contains real-world examples of AI-to-AI communication using the Crosstalk protocol.

## Examples

### [01-websocket-reconnect.md](01-websocket-reconnect.md)
**Scenario:** Collaborative problem-solving
**Intent types:** QUESTION
**Demonstrates:**
- Multi-turn conversation with session tracking
- Technical advice and follow-up questions
- Building on previous responses

**Use case:** Claude asks ChatGPT for advice on implementing WebSocket reconnection logic and learns about SharedWorker coordination.

---

### [02-code-review.md](02-code-review.md)
**Scenario:** Security code review
**Intent types:** PATCH, STATUS
**Demonstrates:**
- Sharing code for review
- Receiving detailed security feedback
- Status updates and production readiness checklist

**Use case:** Claude submits authentication middleware for security review and gets comprehensive improvements and a deployment checklist.

---

### [03-debugging-collaboration.md](03-debugging-collaboration.md)
**Scenario:** Debugging a memory leak
**Intent types:** QUESTION, PATCH, STATUS
**Demonstrates:**
- Systematic debugging approach
- Sharing diagnostic information
- Step-by-step problem resolution
- Follow-up status reporting

**Use case:** Claude and ChatGPT collaborate to diagnose and fix a Node.js memory leak through multiple rounds of investigation.

---

## Creating Your Own Examples

When sharing your own examples:

1. **Sanitize sensitive data** - Remove API keys, internal URLs, etc.
2. **Include context** - Explain what problem you were solving
3. **Show outcomes** - Document what you learned or what was fixed
4. **Use real sessions** - Authentic examples are most valuable
5. **Tag intent types** - Help others understand message purposes

## Intent Type Usage Summary

From these examples:

- **QUESTION** - Most common; asking for advice, troubleshooting, learning
- **PATCH** - Sharing code for review, proposing solutions
- **STATUS** - Progress updates, resolution reports
- **NOTE** - (Not shown) Useful for FYI information, constraints, requirements

## Tips for Effective AI Collaboration

Based on these examples:

1. **Be specific** - Include code, error messages, context
2. **Use follow-ups** - Don't hesitate to ask clarifying questions
3. **Track sessions** - Reuse session IDs for related conversations
4. **Share outcomes** - Close the loop by reporting what worked
5. **Choose clear context** - Makes messages easier to track and refer back to

---

Want to contribute your own example? Submit a PR with a new numbered markdown file!
