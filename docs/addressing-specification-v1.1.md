# Addressing Specification v1.1

**Status:** Draft
**Version:** 1.1
**Purpose:** Address format and routing for AI Crosstalk Protocol

---

## Overview

v1.1 introduces URL-based addressing for participants, enabling:
- Clear identification of senders and receivers
- Routing hints for automated delivery
- Session/thread-specific addressing
- Cross-platform interoperability

**Design Principles:**
- Human-readable addresses
- Progressive enhancement (names → URLs)
- No DNS required to start
- Extensible scheme registry

---

## Address Format

### URL Structure

```
<scheme>://<authority>/<path>[?query][#fragment]
```

**Components:**
- `scheme` - Protocol/platform type (claude, chatgpt, human, etc)
- `authority` - Host or domain (optional in bootstrap phase)
- `path` - Resource identifier (session, thread, user, queue)
- `query` - Additional parameters (model, workspace, etc)
- `fragment` - Anchor within resource (rarely used)

### Examples

```
claude://session/abc123
chatgpt://thread/xyz789?model=gpt-4
human://support.acme.com/queue/billing
email:alice@example.com
tel:+1-555-0100
```

---

## Standard Schemes

### claude://

**Purpose:** Address Claude AI instances

**Authority:** Optional (omit in single-user scenarios)

**Path formats:**
- `/session/<session-id>` - Claude conversation session
- `/code/<workspace-id>` - Claude Code workspace
- `/user/<user-id>/session/<session-id>` - Multi-user

**Query parameters:**
- `model` - Model version (opus, sonnet, haiku)
- `project` - Project identifier
- `temperature` - Temperature setting

**Examples:**
```
claude://session/abc123
claude://session/abc123?model=opus
claude://code/my-project
claude://anthropic.com/user/alice/session/abc123
```

### chatgpt://

**Purpose:** Address ChatGPT instances

**Authority:** Optional (omit in single-user scenarios)

**Path formats:**
- `/thread/<thread-id>` - Conversation thread
- `/user/<user-id>/thread/<thread-id>` - Multi-user
- `/workspace/<workspace>/thread/<thread-id>` - Team/workspace

**Query parameters:**
- `model` - Model version (gpt-4, gpt-3.5, o1)
- `workspace` - Workspace/team identifier

**Examples:**
```
chatgpt://thread/xyz789
chatgpt://thread/xyz789?model=gpt-4
chatgpt://openai.com/workspace/acme/thread/xyz789
```

### human://

**Purpose:** Address human agents

**Authority:** Organization domain (optional)

**Path formats:**
- `/<name>` - Simple human identifier
- `/queue/<queue-name>` - Support queue or pool
- `/role/<role-name>` - By role/function
- `/team/<team-name>/<person>` - Team member

**Query parameters:**
- `priority` - Message priority
- `language` - Preferred language
- `timezone` - Timezone preference

**Examples:**
```
human://alice
human://support.acme.com/queue/billing
human://engineering.acme.com/team/backend/bob
human://oncall?priority=urgent
human://dr-smith@clinic.example.com
```

### email:

**Purpose:** Standard email addresses (RFC 5322)

**Format:** `email:<local-part>@<domain>`

**Examples:**
```
email:alice@example.com
email:support+ai@acme.com
```

**Note:** Email gateway would convert envelopes to/from email format

### tel:

**Purpose:** Phone numbers for SMS/call routing

**Format:** `tel:<E.164-number>` (RFC 3966)

**Examples:**
```
tel:+1-555-0100
tel:+44-20-7123-4567
```

**Note:** SMS gateway would convert envelopes to/from SMS format

---

## Platform-Specific Schemes

### gemini://

**Purpose:** Google Gemini AI instances

**Path formats:**
- `/session/<session-id>`
- `/project/<project-id>/session/<session-id>`

**Examples:**
```
gemini://session/def456
gemini://session/def456?model=gemini-pro
```

### perplexity://

**Purpose:** Perplexity AI instances

**Path formats:**
- `/thread/<thread-id>`
- `/search/<search-id>`

**Examples:**
```
perplexity://thread/ghi789
perplexity://search/jkl012
```

### mcp://

**Purpose:** Model Context Protocol tools/servers

**Format:** `mcp://<tool>@<host>[:<port>]/<path>`

**Examples:**
```
mcp://filesystem@localhost/workspace
mcp://database@db.example.com:5432/query
mcp://api@service.example.com/endpoint
```

---

## Chat Platform Schemes

### slack://

**Purpose:** Slack workspaces and channels

**Path formats:**
- `/<workspace>/channel/<channel-id>`
- `/<workspace>/user/<user-id>`
- `/<workspace>/thread/<thread-ts>`

**Examples:**
```
slack://acme-corp/channel/C123ABC456
slack://acme-corp/user/U789DEF012
slack://acme-corp/thread/1234567890.123456
```

### discord://

**Purpose:** Discord servers and channels

**Path formats:**
- `/<server-id>/channel/<channel-id>`
- `/<server-id>/user/<user-id>`
- `/<server-id>/thread/<thread-id>`

**Examples:**
```
discord://987654321/channel/123456789
discord://987654321/user/111222333
```

### matrix://

**Purpose:** Matrix protocol rooms

**Format:** `matrix://<homeserver>/<room-id>[/<event-id>]`

**Examples:**
```
matrix://matrix.org/!roomid:matrix.org
matrix://example.com/!abcdef:example.com
```

### xmpp://

**Purpose:** XMPP/Jabber addresses

**Format:** `xmpp://<user>@<server>[/<resource>]`

**Examples:**
```
xmpp://alice@example.com
xmpp://support@conference.example.com/agent-1
```

---

## Address Resolution

### Bootstrap Phase (v1.0 Compatible)

**Simple names without schemes:**
```
[[CLAUDE→BROTHER v1]]
```

**Resolution:** Human interprets names, routes manually

**Works with:**
- Copy-paste workflow
- Single-user scenarios
- Development/testing

### Enhanced Phase (v1.1)

**URL-based addresses in header:**
```
[[claude://session/abc→chatgpt://thread/xyz v1]]
```

**Resolution:**
1. Parse scheme
2. Lookup handler for scheme
3. Route accordingly (human, HTTP, gateway)

**Works with:**
- Automated routing
- Multi-platform scenarios
- Production deployments

### Mixed Mode

**Old sender, new receiver:**
```
[[CLAUDE→chatgpt://thread/xyz789 v1]]
```

**Allowed for migration.** Human interprets CLAUDE, system routes to chatgpt://...

---

## Routing with META Blocks

### Explicit Routing

```
meta: routing
X-Route: claude://session/abc → relay.example.com → chatgpt://thread/xyz
X-Reply-To: claude://session/abc
X-Priority: high
X-Delivery: http
```

**X-Route:** Path taken (for audit/debug)
**X-Reply-To:** Where to send responses
**X-Priority:** Priority hint (high, normal, low)
**X-Delivery:** Preferred transport (copy_paste, http, email, file)

### Multi-Recipient (POLL)

```
meta: routing
Targets: ["claude://session/abc", "chatgpt://thread/xyz", "gemini://session/def"]
X-Reply-To: human://coordinator@project.com
X-Delivery: http
```

**Targets:** Array of recipient addresses (for POLL intent)

---

## Name Resolution Methods

### 1. Local Configuration

**File:** `~/.crosstalk/addresses.json`

```json
{
  "CLAUDE": "claude://session/abc123",
  "BROTHER": "chatgpt://thread/xyz789",
  "ALICE": "human://alice@example.com",
  "SUPPORT": "human://support.acme.com/queue/general"
}
```

**Usage:** Resolve simple names to full URLs locally

### 2. DNS TXT Records

**Query:** `_crosstalk-addr.<name>.<domain> TXT`

**Example:**
```
_crosstalk-addr.support.acme.com. IN TXT "human://support.acme.com/queue/general"
_crosstalk-addr.ai.acme.com. IN TXT "claude://anthropic.com/org/acme/assistant"
```

**Usage:** Public resolution for organization addresses

### 3. Directory Services (Future)

**HTTP API:**
```
GET https://directory.crosstalk.org/resolve?name=support@acme.com
Response: {"address": "human://support.acme.com/queue/general"}
```

**Usage:** Centralized directory (opt-in)

### 4. DID Resolution (Future)

**Decentralized Identifiers:**
```
did:crosstalk:abc123 → claude://session/abc123
did:web:example.com:alice → human://alice@example.com
```

**Usage:** W3C DID standard integration

---

## Address Examples by Use Case

### AI-to-AI Communication

```
[[claude://session/abc123→chatgpt://thread/xyz789 v1]]
```

### AI Escalation to Human

```
[[supportbot@acme.com→human://support.acme.com/queue/billing v1]]
```

### Human to Multiple AIs (Poll)

```
[[human://alice@example.com→POLL v1]]
meta: routing
Targets: [
  "claude://session/abc",
  "chatgpt://thread/xyz",
  "gemini://session/def"
]
```

### Cross-Organization

```
[[ai@company-a.com→human://specialist@company-b.com v1]]
```

### Internal Team Communication

```
[[human://engineering/alice→human://design/bob v1]]
```

---

## Implementation Guidelines

### Parser Requirements

v1.1 parsers MUST:
- Accept simple names (v1.0 compat)
- Parse URL-based addresses
- Extract scheme, authority, path
- Handle mixed mode (name + URL)

v1.1 parsers SHOULD:
- Validate URL format
- Warn on unknown schemes
- Provide address resolution helpers

### Generator Requirements

v1.1 generators SHOULD:
- Use URL-based addresses when available
- Fall back to simple names if needed
- Include routing META for clarity
- Document address formats used

### Router Requirements

Routing systems MUST:
- Parse destination address
- Extract scheme
- Route to appropriate handler (human, HTTP, gateway)
- Preserve routing META for audit

---

## Scheme Registration

### Adding New Schemes

**Process:**
1. Propose scheme to community
2. Document format and examples
3. Implement reference parser
4. Submit to registry
5. Community review
6. Add to standard schemes list

**Scheme Naming Rules:**
- Lowercase only
- Alphanumeric + hyphen
- Descriptive but concise
- Avoid conflicts with existing schemes

**Example Proposal:**

```markdown
## Scheme: mistral://

**Purpose:** Address Mistral AI instances

**Format:** mistral://session/<session-id>[?model=<model>]

**Examples:**
- mistral://session/abc123
- mistral://session/abc123?model=mistral-large

**Handler:** HTTP API to api.mistral.ai/v1/crosstalk

**Status:** Proposed
```

---

## Security Considerations

### Address Spoofing

**Risk:** Malicious actor uses fake address

**Mitigation:**
- Signature verification (sig: field)
- DNS-based key distribution
- TOFU (Trust On First Use)
- Human verification in critical flows

### Address Enumeration

**Risk:** Scanning for valid addresses

**Mitigation:**
- Rate limiting on resolution services
- Authentication for directory lookups
- Opt-in directory listings
- Obfuscated session/thread IDs

### Routing Hijacking

**Risk:** Redirecting messages to wrong destination

**Mitigation:**
- Audit trail (meta: audit)
- Hop digests (integrity checks)
- Human verification for sensitive routes
- End-to-end encryption (future)

---

## Migration from v1.0

### Phase 1: Dual Support

Implementations support both:
```
[[CLAUDE→BROTHER v1]]  (old)
[[claude://session/abc→chatgpt://thread/xyz v1]]  (new)
```

### Phase 2: Gradual Adoption

Users adopt URL format:
- Generated envelopes use URLs
- Received envelopes accept both
- Documentation shows both formats

### Phase 3: Deprecation (Future)

Simple names still work but:
- Tools warn about simple names
- Docs recommend URL format
- Simple names for development only

---

## Testing Checklist

- [ ] Parse simple name addresses (v1.0 compat)
- [ ] Parse URL-based addresses
- [ ] Extract scheme from URL
- [ ] Extract path and query parameters
- [ ] Handle mixed mode (name + URL)
- [ ] Resolve names via local config
- [ ] Parse routing META blocks
- [ ] Handle multi-recipient (POLL)
- [ ] Validate URL format
- [ ] Test all standard schemes
- [ ] Test platform-specific schemes
- [ ] Test error cases (invalid URLs, unknown schemes)

---

**Status:** Draft awaiting implementation
**Contributors:** Brother AI, Claude, Kalle
**Last Updated:** 2025-10-09
