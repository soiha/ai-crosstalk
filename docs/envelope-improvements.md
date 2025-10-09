# Envelope Format Improvements

Proposed enhancements to the AI Crosstalk envelope protocol based on real-world usage and Brother AI's feedback.

## Current Format

```
[[SENDER→RECEIVER v1]]
user: username
session: 2025-10-09T15Z 04f07f
context: project-name
intent: QUESTION
body: |
  Message content here
sig: none
[[END]]
```

## Proposed Enhancements

### 1. Code Fence Wrapping for Newline Preservation

**Problem:** ChatGPT's markdown renderer collapses newlines in plain text, breaking envelope parsing.

**Solution:** Wrap the entire envelope in a code fence when sending to ChatGPT:

````markdown
```
[[SENDER→RECEIVER v1]]
user: username
session: 2025-10-09T15Z 04f07f
context: project-name
intent: QUESTION
body: |
  Message content here
sig: none
[[END]]
```
````

**Implementation:**
- Add `--code-fence` flag to CLI tool
- Safari extension automatically wraps when targeting ChatGPT
- Parser strips code fence markers if present
- Backwards compatible (optional wrapping)

**Benefits:**
- Newlines always preserved
- No more space-separated regex fallbacks needed
- Copy-paste from any AI platform works reliably

### 2. Integrity Checksums

**Problem:** Long envelopes may get truncated during copy-paste, causing silent failures.

**Solution:** Add optional `hash:` field with CRC32 checksum:

```
[[SENDER→RECEIVER v1]]
user: username
session: 2025-10-09T15Z 04f07f
context: project-name
intent: QUESTION
body: |
  Message content here
sig: none
hash: 3a4b5c6d
[[END]]
```

**Checksum calculation:**
```javascript
// Checksum includes everything from [[ to sig: (excludes hash and [[END]])
const payload = envelopeText.match(/\[\[.*sig: none/s)[0];
const hash = crc32(payload).toString(16);
```

**Implementation:**
- CLI tool adds `hash:` by default, `--no-hash` to disable
- Parser validates if hash present, warns on mismatch
- Optional field for backwards compatibility

**Benefits:**
- Early detection of truncation
- Confidence in large envelope integrity
- Debugging aid for clipboard issues

### 3. Extended Intent Types

**Current intents:** QUESTION, STATUS, PATCH, NOTE

**Proposed additions:**

| Intent | Use Case | Example |
|--------|----------|---------|
| **ANSWER** | Direct response to QUESTION | Brother's responses |
| **ACK** | Acknowledgment without detailed response | "Got it, proceeding" |
| **ERROR** | Report an error or failure | "Cannot access that file" |
| **REQUEST** | Request for action/resource | "Please run the tests" |

**Implementation:**
- Update protocol spec to include new intents
- Parser accepts all intents (forwards compatible)
- Documentation updated with use cases

**Benefits:**
- Clearer semantic meaning
- Better conversation threading
- More expressive AI-to-AI dialogue

### 4. Response Type Unification

**Problem:** Different AIs use different response formats:
- Claude: `response: |` field
- Brother: `body: |` field (no intent)

**Solution:** Parser accepts both formats:

```javascript
// Option A: Claude style (preferred)
response: |
  Response content

// Option B: Brother style (legacy)
body: |
  Response content
// (no intent: field)
```

**Implementation:**
- Parser checks for `response:` first
- Falls back to `body:` if no `intent:` present
- CLI tool always generates `response:` for responses
- Safari extension handles both

**Benefits:**
- Works with any AI's natural output format
- No need to retrain AIs on format
- Backwards compatible

### 5. Metadata Extensions

**Problem:** No way to attach metadata (priority, language, model, etc.)

**Solution:** Optional `meta:` section:

```
[[SENDER→RECEIVER v1]]
user: username
session: 2025-10-09T15Z 04f07f
context: project-name
intent: QUESTION
meta: |
  priority: high
  model: gpt-4
  language: python
body: |
  Message content here
sig: none
[[END]]
```

**Implementation:**
- Parser extracts `meta:` block into key-value dict
- Optional field, ignored if not present
- Standard keys documented, custom keys allowed

**Benefits:**
- Extensible without version bump
- Rich context for AI responses
- Future-proof for new use cases

## Migration Path

### Phase 1 (Now)
- ✅ CLI parser handles both response formats
- ✅ Safari extension handles both formats
- Update docs to recommend `response:` for replies

### Phase 2 (This week)
- Add code-fence wrapping flag to CLI
- Safari extension auto-wraps for ChatGPT
- Add CRC32 checksum to CLI tool

### Phase 3 (Next week)
- Add new intent types to spec
- Update parser to validate checksums
- Add metadata support (optional)

### Phase 4 (Future)
- Protocol v2 with formalized metadata
- Compression for large payloads
- Encryption option for sensitive content

## Backwards Compatibility

All improvements maintain compatibility with v1 protocol:

- Code fences: stripped by parser if present
- Checksums: optional field, validated only if present
- New intents: parsers forward-compatible
- Response unification: accepts both formats
- Metadata: ignored by parsers that don't support it

**No breaking changes to existing tools or workflows.**

## Example Enhanced Envelope

````
```
[[CLAUDE→CHATGPT v1]]
user: kalle
session: 2025-10-09T15Z 04f07f
context: api-design
intent: QUESTION
meta: |
  priority: high
  language: javascript
body: |
  How should we structure the authentication endpoints?

  Requirements:
  - JWT-based auth
  - Refresh token rotation
  - Rate limiting per user
sig: none
hash: a7f3d1e2
[[END]]
```
````

Response:

````
```
[[CHATGPT→CLAUDE v1]]
user: brother
session: 2025-10-09T15Z 04f07f
context: api-design
intent: ANSWER
response: |
  Recommend these endpoints:

  POST /auth/login → { accessToken, refreshToken }
  POST /auth/refresh → { accessToken }
  POST /auth/logout → 204

  Use Redis for token revocation list.
  Rate limit: 5 req/min per IP on /login.
sig: none
hash: 9c4e2b1f
[[END]]
```
````

---

**Status:** Proposed improvements based on Brother AI feedback (2025-10-09).

**Next Steps:**
1. Gather community feedback
2. Implement Phase 1 enhancements
3. Update protocol specification
4. Test with multiple AI platforms
