# Intent Registry v1.1

**Status:** Draft
**Version:** 1.1
**Purpose:** Formalized vocabulary for AI Crosstalk Protocol intents

---

## Design Principles

1. **Keep the set tiny** (≤10 core intents)
2. **Orthogonal verbs** (no overlap in meaning)
3. **Human-friendly** (easy to hand-write)
4. **Richness via META** (intents stay simple, details in META blocks)
5. **Backward compatible** (legacy intents supported but deprecated)

---

## Core Intent Vocabulary

### REQUEST

**Purpose:** Ask for information, action, or decision

**Replaces:** QUESTION (v1.0)

**Usage:**
- Questions requiring answers
- Requests for action
- Requests for decisions
- Consultations

**Expects:** RESPOND

**Examples:**
```
intent: REQUEST
body: |
  What's your recommended approach for authentication?
```

```
intent: REQUEST
meta: action
Action: deploy
Environment: production
body: |
  Please deploy version 2.3.1 to production.
```

---

### RESPOND

**Purpose:** Answer a REQUEST

**Replaces:** ANSWER (v1.0)

**Usage:**
- Answers to questions
- Results of requested actions
- Decisions in response to consultations

**Requires:** `parent` header (message being responded to)

**Examples:**
```
intent: RESPOND
parent: 01J9J3D9C2V8M4...
body: |
  Use JWT tokens with refresh token rotation.
```

```
intent: RESPOND
parent: 01J9J3D9C2V8M4...
meta: action
Status: completed
Environment: production
Deployment-ID: d2025-10-09-001
body: |
  Deployment successful. Version 2.3.1 live in production.
```

---

### ESCALATE

**Purpose:** Request human intervention with full context

**New in:** v1.1

**Usage:**
- AI cannot handle request
- Human judgment required
- Confidence threshold not met
- Policy requires human review

**Context preserved:** Original conversation, decisions made, confidence levels

**Examples:**
```
intent: ESCALATE
meta: routing
X-Routing-To: human://support.acme.com/queue/billing
X-Priority: high
meta: privacy
PII: redacted
Consent: explicit_yes_2025-10-09T16:00Z
body: |
  Customer reports double charge on order #12345.

  Context:
  - Verified: duplicate charge exists ($49.99)
  - Customer: 3-year member, no prior disputes
  - Bot confidence: HIGH
  - Recommended action: Refund $49.99

  Escalating for human verification and execution.
```

---

### HANDOFF

**Purpose:** Transfer conversation stewardship to another agent/human

**New in:** v1.1

**Usage:**
- Agent capabilities exhausted
- Specialist required
- Shift change (human agents)
- Language/domain switch

**Includes:** Required capabilities, consent status, conversation history

**Examples:**
```
intent: HANDOFF
meta: routing
X-Routing-To: spanish-support@acme.com
X-Capabilities-Required: language=es,domain=billing
meta: privacy
Consent: transferred_with_customer_approval
body: |
  Customer prefers Spanish language support.

  Context transferred:
  - Billing inquiry about invoice #INV-2025-10-09-842
  - Issue: unclear line item descriptions
  - Customer: premium tier, prefers detailed explanations

  Handing off to Spanish-speaking billing specialist.
```

---

### POLL

**Purpose:** Query multiple recipients for consensus or diverse perspectives

**New in:** v1.1

**Usage:**
- Multi-AI consultation
- Voting/consensus building
- Gathering diverse perspectives
- Distributed decision-making

**Expects:** Multiple RESPOND messages

**Examples:**
```
intent: POLL
meta: routing
Targets: ["claude://session/abc", "chatgpt://thread/xyz", "gemini://session/def"]
X-Reply-To: human://coordinator@project.com
meta: poll
Type: consensus
Quorum: 2-of-3
Deadline: 2025-10-09T18:00Z
body: |
  Architecture decision: Microservices or monolith for MVP?

  Requirements:
  - 3-person team
  - 6-month timeline
  - Unknown scale (could be 100 or 100k users)
  - Must support rapid iteration

  Please vote: MICROSERVICES | MONOLITH | ABSTAIN
  Include reasoning.
```

---

### ACK / NACK

**Purpose:** Acknowledge receipt (ACK) or refuse (NACK)

**New in:** v1.1

**Usage:**
- Delivery confirmation
- Acceptance of terms
- Rejection with reason
- Simple yes/no semantics

**Examples:**

**ACK:**
```
intent: ACK
parent: 01J9J3D9C2V8M4...
body: |
  Message received. Processing started.
```

**NACK:**
```
intent: NACK
parent: 01J9J3D9C2V8M4...
meta: refusal
Reason: insufficient-permissions
Policy: requires-manager-approval
body: |
  Cannot process deployment request.
  Reason: Production deployments require manager approval.
```

---

### ERROR

**Purpose:** Report failure, problem, or exception

**New in:** v1.1

**Usage:**
- Routing failures
- Processing errors
- Validation failures
- System problems

**Requires:** `meta: error` block with error code

**Error Code Taxonomy:**
- `E-ROUTE` - Routing/delivery failed
- `E-CONSENT` - Consent denied or expired
- `E-FORMAT` - Malformed envelope
- `E-TOO-LARGE` - Message exceeds limits
- `E-PERM` - Permission denied
- `E-UNSUPPORTED` - Feature not supported
- `E-TIMEOUT` - Response timeout
- `E-RATE` - Rate limit exceeded

**Examples:**
```
intent: ERROR
parent: 01J9J3D9C2V8M4...
meta: error
Code: E-ROUTE
Reason: Destination unreachable
Original-Intent: REQUEST
body: |
  Could not deliver to chatgpt://thread/xyz789.

  Attempted routes:
  1. Direct connection: failed (timeout)
  2. Relay via http://relay.example.com: failed (503)

  Suggestion: Verify recipient address or try again later.
```

---

### BROADCAST

**Purpose:** One-way announcement, no response expected

**Replaces:** NOTE (v1.0 - partially), STATUS (v1.0 - partially)

**Usage:**
- Status updates
- Notifications
- Announcements
- Informational messages (FYI)

**No response expected**

**Examples:**
```
intent: BROADCAST
context: system-maintenance
body: |
  Scheduled maintenance window: 2025-10-10 02:00-04:00 UTC.
  All services will be unavailable during this period.
```

```
intent: BROADCAST
context: project-milestone
body: |
  Version 2.0 released to production.
  - 15 new features
  - 42 bug fixes
  - Performance improved 3x
```

---

### REVOKE

**Purpose:** Withdraw consent, keys, or permissions

**New in:** v1.1

**Usage:**
- Revoke consent for data processing
- Revoke API keys or tokens
- Revoke access permissions
- Security-relevant withdrawals

**Requires:** Signature verification (security-critical)

**Examples:**
```
intent: REVOKE
meta: revocation
Type: consent
Consent-ID: patient-842-consent-2025-10-09
Reason: patient-request
Effective: immediate
body: |
  Patient requests immediate revocation of data processing consent.

  Actions required:
  - Stop all processing
  - Delete or anonymize PHI
  - Confirm completion within 48 hours
sig: ed25519:pkid=patient-842;sig=AbC123...
```

---

### CLOSE

**Purpose:** Terminate thread or session

**New in:** v1.1

**Usage:**
- End of conversation
- Session timeout
- Explicit closure
- Final message in thread

**No further messages expected after CLOSE**

**Examples:**
```
intent: CLOSE
thread: 01J9J3D3M6A4M3WQX8G1ZQ0S7K
meta: closure
Reason: resolved
Resolution: customer-satisfied
Duration: 14m23s
body: |
  Issue resolved. Customer confirmed satisfaction.
  Closing ticket #842918.
```

```
intent: CLOSE
thread: 01J9J3D3M6A4M3WQX8G1ZQ0S7K
meta: closure
Reason: timeout
Inactive-Duration: 30m
body: |
  No response received for 30 minutes. Closing session due to inactivity.
```

---

## Legacy Intents (Deprecated)

### QUESTION → REQUEST

**Migration:** Replace `intent: QUESTION` with `intent: REQUEST`

**Backward compatibility:** v1.1 parsers accept QUESTION and treat as REQUEST

### ANSWER → RESPOND

**Migration:** Replace `intent: ANSWER` with `intent: RESPOND`

**Backward compatibility:** v1.1 parsers accept ANSWER and treat as RESPOND

### STATUS → BROADCAST or REQUEST

**Migration:**
- If informational with no response needed: Use BROADCAST
- If requesting status from another: Use REQUEST

**Backward compatibility:** v1.1 parsers accept STATUS and treat as BROADCAST

### PATCH → REQUEST with meta: patch

**Migration:**
```
intent: REQUEST
meta: patch
Type: code-change
Format: unified-diff
body: |
  [patch content]
```

**Backward compatibility:** v1.1 parsers accept PATCH and treat as REQUEST

### NOTE → BROADCAST

**Migration:** Replace `intent: NOTE` with `intent: BROADCAST`

**Backward compatibility:** v1.1 parsers accept NOTE and treat as BROADCAST

---

## Intent Selection Guide

| Want to... | Use Intent | Add META |
|------------|------------|----------|
| Ask a question | REQUEST | - |
| Request an action | REQUEST | `meta: action` |
| Answer something | RESPOND | - |
| Need human help | ESCALATE | `meta: routing`, `meta: privacy` |
| Transfer conversation | HANDOFF | `meta: routing`, capabilities |
| Ask multiple AIs | POLL | `meta: poll` |
| Confirm receipt | ACK | - |
| Refuse/reject | NACK | `meta: refusal` |
| Report error | ERROR | `meta: error` (required) |
| Announce something | BROADCAST | - |
| Cancel consent/access | REVOKE | `meta: revocation` + signature |
| End conversation | CLOSE | `meta: closure` |

---

## Intent Workflow Patterns

### Simple Request-Response
```
Human → AI: REQUEST
AI → Human: RESPOND
```

### Escalation
```
Human → AI: REQUEST
AI → AI: REQUEST (internal consultation)
AI → AI: RESPOND
AI → Human: ESCALATE (confidence low, needs human)
Human → Customer: RESPOND
```

### Multi-AI Poll
```
Human → [AI1, AI2, AI3]: POLL
AI1 → Human: RESPOND
AI2 → Human: RESPOND
AI3 → Human: RESPOND
Human: (collates, makes decision)
```

### Handoff Chain
```
Customer → Bot: REQUEST
Bot → Specialist1: HANDOFF
Specialist1 → Specialist2: HANDOFF
Specialist2 → Customer: RESPOND
```

### Error Recovery
```
Human → AI: REQUEST
AI → Human: ERROR (E-ROUTE)
Human: (tries alternative route)
Human → AI: REQUEST (via different path)
AI → Human: RESPOND
```

---

## Extension Guidelines

### Adding New Intents

**Process:**
1. Propose to community
2. Demonstrate use case not covered by existing intents
3. Show orthogonality (doesn't overlap existing)
4. Draft specification
5. Community review
6. Add to registry

**Avoid:**
- Intents that duplicate existing (use META instead)
- Over-specific intents (too narrow)
- Under-specific intents (too vague)

### Domain-Specific Intents

For specialized domains, use META blocks instead:

**Bad:**
```
intent: MEDICAL-CONSULT
```

**Good:**
```
intent: REQUEST
meta: medical
Type: consultation
Specialty: cardiology
Urgency: routine
```

---

## Implementation Notes

### Parser Requirements

v1.1 parsers MUST:
- Accept all core intents
- Map legacy intents to core intents
- Validate intent is in registry (optional warning)
- Preserve unknown intents when relaying (forward compat)

### Generator Requirements

v1.1 generators SHOULD:
- Use core intents only (avoid legacy)
- Include appropriate META blocks
- Validate intent matches use case
- Document intent choice in context

---

## Testing Checklist

- [ ] Parse all core intents
- [ ] Parse all legacy intents and map correctly
- [ ] Generate examples for each intent
- [ ] Test intent + META combinations
- [ ] Validate error intent includes error code
- [ ] Test POLL workflow with multiple responders
- [ ] Test ESCALATE preserves context
- [ ] Test HANDOFF includes capabilities
- [ ] Test REVOKE requires signature
- [ ] Test CLOSE terminates thread

---

**Status:** Draft awaiting implementation
**Contributors:** Brother AI, Claude, Kalle
**Last Updated:** 2025-10-09
