# Safety and Consent Framework v1.1

**Status:** Draft
**Version:** 1.1
**Purpose:** Safety, privacy, and consent mechanisms for AI Crosstalk Protocol

---

## Overview

Human-mediated communication involves sensitive data, personal information, and high-stakes decisions. This framework provides:

1. **Consent tracking** - Explicit, auditable consent mechanisms
2. **Privacy controls** - PII handling and redaction
3. **Safety policies** - Content warnings and use restrictions
4. **Audit trails** - Transparent logging for compliance
5. **Trust mechanisms** - Signature and verification

**Key Principle:** Human-readable first. All safety mechanisms must be understandable to non-technical humans.

---

## Consent Framework

### Consent Types

**explicit_yes**
- User explicitly granted permission
- Must include timestamp and scope
- Recommended for sensitive data

**explicit_no**
- User explicitly denied permission
- Processing must stop immediately
- Must be honored across all systems

**implicit**
- Implied consent (e.g., by using service)
- Lower assurance level
- Not suitable for sensitive data

**transferred_with_approval**
- Consent transferred to another agent
- Requires original consent + transfer approval
- Used in HANDOFF scenarios

### Consent META Block

```
meta: privacy
Consent: explicit_yes_2025-10-09T16:00Z
Scope: general
Expires: 2025-10-10T16:00Z
Jurisdiction: GDPR
Consent-ID: user-842-consent-2025-10-09
```

**Required Fields:**
- `Consent` - Type and timestamp
- `Scope` - What the consent covers

**Optional Fields:**
- `Expires` - Expiration timestamp
- `Jurisdiction` - Legal framework (GDPR, CCPA, HIPAA)
- `Consent-ID` - Unique identifier for audit trail

### Consent Scopes

**general**
- Standard processing, no special data
- Default scope
- Minimal restrictions

**pii**
- Personally Identifiable Information
- Names, addresses, emails, phone numbers
- Must track and allow deletion

**medical / phi**
- Protected Health Information
- HIPAA compliance required (US)
- Strict audit and access controls

**financial**
- Financial data, payment information
- PCI DSS compliance may apply
- Higher security requirements

**biometric**
- Fingerprints, facial recognition, voice
- Highest sensitivity
- Explicit consent mandatory

**location**
- GPS coordinates, addresses
- Privacy concerns
- Real-time tracking restrictions

**custom:<domain>**
- Organization-specific scopes
- Prefix with `custom:`
- Document in organization policy

### Consent Lifecycle

**1. Grant Consent**
```
[[HUMAN→AI v1]]
intent: REQUEST
meta: privacy
Consent: explicit_yes_2025-10-09T16:00Z
Scope: medical
Expires: 2025-10-10T16:00Z
Jurisdiction: HIPAA
Consent-ID: patient-842-consent-2025-10-09
body: |
  Please analyze my medical records for diagnosis suggestions.
```

**2. Transfer Consent**
```
[[AI→SPECIALIST-AI v1]]
intent: HANDOFF
meta: privacy
Consent: transferred_with_approval
Original-Consent-ID: patient-842-consent-2025-10-09
Scope: medical
Jurisdiction: HIPAA
body: |
  Transferring case to specialist for cardiology consultation.
  Original consent transferred with patient approval.
```

**3. Revoke Consent**
```
[[HUMAN→AI v1]]
intent: REVOKE
meta: revocation
Type: consent
Consent-ID: patient-842-consent-2025-10-09
Reason: patient-request
Effective: immediate
body: |
  Patient requests immediate revocation of data processing consent.

  Required actions:
  - Stop all processing
  - Delete or anonymize PHI
  - Confirm completion within 48 hours
sig: ed25519:pkid=patient-842;sig=AbC123...
```

**4. Confirm Revocation**
```
[[AI→HUMAN v1]]
intent: RESPOND
meta: revocation
Consent-ID: patient-842-consent-2025-10-09
Status: completed
Completed-At: 2025-10-09T18:30Z
Actions-Taken: deleted-phi,anonymized-logs,purged-cache
body: |
  Consent revocation completed.

  Actions taken:
  - All PHI deleted from active storage
  - Audit logs anonymized (patient ID removed)
  - Cache purged
  - Backups will be purged in next cycle (within 7 days)
```

---

## PII Handling

### PII Status

**none**
- No personal information present
- Safe for general processing
- No special handling required

**present**
- PII is included in message
- Handle according to consent scope
- Apply appropriate security

**redacted**
- PII was present but removed
- Placeholders used (e.g., [NAME], [EMAIL])
- Original data not recoverable from envelope

**hashed**
- PII replaced with cryptographic hash
- Can verify but not reverse
- Useful for identity without disclosure

### Redaction Example

**Before Redaction:**
```
body: |
  Customer John Smith (john.smith@example.com, phone: 555-0100)
  reports issue with order #12345.
```

**After Redaction:**
```
meta: privacy
PII: redacted
Redacted-Fields: customer-name,email,phone
body: |
  Customer [NAME] ([EMAIL], phone: [PHONE])
  reports issue with order #12345.
```

### Redaction Macros

Systems SHOULD provide automated redaction:

**email addresses:** `\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b` → `[EMAIL]`
**phone numbers:** Various formats → `[PHONE]`
**credit cards:** PCI patterns → `[CARD-XXXX-1234]` (last 4 digits only)
**SSN/national IDs:** Country-specific patterns → `[SSN]`, `[NIN]`
**names:** NER (Named Entity Recognition) → `[NAME]`

---

## Safety Policies

### Content Warnings

```
meta: safety
Content-Warnings: medical-imagery,graphic-description
Allowed-Use: medical-professional-only
Age-Restriction: 18+
```

**Standard Warning Types:**
- `medical-imagery` - Medical photos, X-rays, etc
- `graphic-description` - Detailed injury/trauma descriptions
- `violent-content` - Violence depictions
- `sensitive-topics` - Death, self-harm, abuse
- `adult-content` - Age-restricted material
- `legal-sensitive` - Legal proceedings, evidence
- `financial-sensitive` - Financial distress, fraud

### Use Restrictions

```
meta: safety
Allowed-Use: medical-professional-only,educational
Prohibited-Use: commercial-marketing,automated-decision
Jurisdiction: GDPR,HIPAA
```

**Common Restrictions:**
- `medical-professional-only` - Requires professional credentials
- `educational` - Educational purposes allowed
- `research-only` - Research use only
- `non-commercial` - No commercial use
- `no-automated-decision` - Human must make final decision
- `no-third-party` - Cannot share with third parties
- `internal-only` - Organization internal use only

### Safety Escalation

If unsafe content detected, use ERROR or ESCALATE:

```
[[AI→HUMAN v1]]
intent: ESCALATE
meta: routing
X-Routing-To: human://safety-team@example.com
X-Priority: urgent
meta: safety
Concern: self-harm-indication
Confidence: high
body: |
  User message contains potential self-harm indicators.

  Indicators detected:
  - [REDACTED specific phrases]
  - Tone analysis: distressed

  Immediate human review recommended.
  Consider wellness check protocols.
```

---

## Audit Trail

### Audit META Block

```
meta: audit
Received-At: 2025-10-09T16:00:00Z
Received-By: relay.example.com
Processed-At: 2025-10-09T16:00:01Z
Processed-By: ai-engine-v2
Hop-Digest: sha256:abc123def456...
Chain: [origin → relay → destination]
```

**Purpose:**
- Track message path
- Verify integrity
- Compliance logging
- Incident investigation

**Standard Fields:**
- `Received-At` - When message received (ISO 8601)
- `Received-By` - Who/what received it
- `Processed-At` - When processing completed
- `Processed-By` - Processing entity
- `Hop-Digest` - Hash of message at this hop
- `Chain` - Path taken through system

### Hop Chain Example

**Message 1 (Origin):**
```
meta: audit
Received-At: 2025-10-09T16:00:00Z
Received-By: claude://session/abc123
Hop-Digest: sha256:abc123...
```

**Message 2 (After relay):**
```
meta: audit
Received-At: 2025-10-09T16:00:01Z
Received-By: relay.example.com
Previous-Hop: claude://session/abc123
Hop-Digest: sha256:def456...
Chain: claude://session/abc123 → relay.example.com
```

**Message 3 (Final destination):**
```
meta: audit
Received-At: 2025-10-09T16:00:02Z
Received-By: chatgpt://thread/xyz789
Previous-Hop: relay.example.com
Hop-Digest: sha256:ghi789...
Chain: claude://session/abc123 → relay.example.com → chatgpt://thread/xyz789
```

---

## Trust and Signatures

### When Signatures Required

**MUST sign:**
- REVOKE intents (security-critical)
- Consent modifications
- Sensitive data (medical, financial)
- Cross-organization transfers

**SHOULD sign:**
- High-value transactions
- Legal documents
- Audit-sensitive communications
- Identity-critical messages

**MAY omit signature:**
- Low-stakes conversations
- Internal organization messages
- Bootstrap/testing scenarios
- Public announcements (BROADCAST)

### Signature Format

```
sig: <algorithm>:pkid=<key-identifier>;sig=<base64-signature>
```

**Supported Algorithms:**
- `ed25519` - EdDSA (recommended)
- `secp256r1` - ECDSA P-256
- `rsa2048` - RSA 2048-bit (legacy support)

**Key Identifier:**
- Email-style: `alice@example.com`
- Path-style: `alice@keys/2025-10-09`
- DNS-based: `_crosstalk.example.com`
- DID: `did:key:z6Mk...` (future)

**Examples:**
```
sig: ed25519:pkid=alice@example.com;sig=AbC123DeF456GhI789...
sig: secp256r1:pkid=bob@keys/2025;sig=XyZ789...
sig: none
```

### Signature Verification

**TOFU (Trust On First Use):**
1. First message from `alice@example.com` → store public key
2. Subsequent messages → verify against stored key
3. Key mismatch → WARNING, human verification required

**DNS-Based:**
1. Extract key identifier: `alice@example.com`
2. Query DNS: `_crosstalk-key.example.com TXT`
3. Verify signature against published key
4. Cache key with TTL

**Example DNS Record:**
```
_crosstalk-key.example.com. 3600 IN TXT "ed25519:pk=AbC123DeF456..."
```

### Signature Example (Full Envelope)

```
[[HUMAN→AI v1]]
user: dr-smith
session: 2025-10-09T16Z abc123
thread: 01J9J3D3M6A4M3WQX8G1ZQ0S7K
message: 01J9J3DBC4N7P2Q3R5S7T9U1V2
context: patient-diagnosis
intent: REVOKE

meta: revocation
Type: consent
Consent-ID: patient-842-consent-2025-10-09
Reason: patient-request
Effective: immediate

meta: privacy
PII: present
Scope: medical
Jurisdiction: HIPAA

body: |
  Patient Jane Doe requests immediate revocation of consent
  for AI-assisted diagnosis. Stop all processing immediately.

sig: ed25519:pkid=dr-smith@clinic.example.com;sig=j8fK2mP9nQ3rT5vW7xY1zA4bC6dE8fG0hI2jK4lM6nO8pQ0rS2tU4vW6xY8zA0bC2d
[[END]]
```

---

## Jurisdiction-Specific Requirements

### GDPR (European Union)

**Requirements:**
- Explicit consent for processing
- Right to erasure (REVOKE must work)
- Right to data portability
- Audit trail required
- Data minimization principle

**META block:**
```
meta: privacy
Jurisdiction: GDPR
Consent: explicit_yes_2025-10-09T16:00Z
Scope: pii
Expires: 2025-10-10T16:00Z
DPO-Contact: dpo@example.com
```

### CCPA (California)

**Requirements:**
- Opt-out rights
- Disclosure of data sale
- Right to deletion
- Non-discrimination

**META block:**
```
meta: privacy
Jurisdiction: CCPA
Consent: opt-in_2025-10-09T16:00Z
Scope: pii
Sale-Prohibited: true
```

### HIPAA (US Healthcare)

**Requirements:**
- PHI protection
- Minimum necessary standard
- Audit controls
- Business associate agreements

**META block:**
```
meta: privacy
Jurisdiction: HIPAA
Consent: explicit_yes_2025-10-09T16:00Z
Scope: phi
Covered-Entity: clinic.example.com
BAA-Ref: BAA-2025-001
```

---

## Implementation Checklist

### Minimal Safety Implementation

- [ ] Parse `meta: privacy` block
- [ ] Respect `Consent: explicit_no` (stop processing)
- [ ] Handle `PII: redacted` indicator
- [ ] Log consent status in audit trail

### Full Safety Implementation

- [ ] Consent tracking database
- [ ] Automated PII redaction
- [ ] Signature generation and verification
- [ ] Audit trail with hop digests
- [ ] Content warning filters
- [ ] Jurisdiction-specific handlers (GDPR, CCPA, HIPAA)
- [ ] REVOKE intent processing
- [ ] Safety escalation workflows

---

## Testing Scenarios

### Test 1: Explicit Consent
```
Given: User provides explicit_yes consent with medical scope
When: AI processes medical data
Then: Processing proceeds, audit trail records consent ID
```

### Test 2: Consent Revocation
```
Given: Active consent with ID patient-842
When: REVOKE intent received with matching consent ID
Then: Processing stops, data deleted/anonymized, confirmation sent
```

### Test 3: PII Redaction
```
Given: Message contains email and phone number
When: PII redaction applied
Then: Output shows [EMAIL] and [PHONE] placeholders
```

### Test 4: Signature Verification (TOFU)
```
Given: First message from alice@example.com with signature
When: Public key stored
Then: Second message signature verified against stored key
```

### Test 5: Jurisdiction Handling
```
Given: Message marked Jurisdiction: GDPR
When: Processing begins
Then: GDPR-specific handlers invoked (explicit consent, audit, etc)
```

---

**Status:** Draft awaiting implementation
**Contributors:** Brother AI, Claude, Kalle
**Last Updated:** 2025-10-09
