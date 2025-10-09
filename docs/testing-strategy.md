# AI Crosstalk Testing Strategy

Comprehensive testing approach for Safari extension and protocol implementation.

## Test Matrix

### Browser & OS Combinations

| Browser | Version | macOS Version | Priority |
|---------|---------|--------------|----------|
| Safari | 18.x | Sonoma 14.x | **High** |
| Safari | 17.x | Ventura 13.x | **High** |
| Safari | 17.x | Monterey 12.x | Medium |
| Safari | 16.x | Big Sur 11.x | Low |

### Keyboard Layouts

Test keyboard shortcuts (Cmd+Shift+E, Cmd+Shift+R) across:

- ✅ **US QWERTY** (primary)
- **Nordic** (Swedish, Norwegian, Danish)
- **UK QWERTY**
- **German QWERTZ**
- **French AZERTY**
- **Dvorak**
- **Colemak**

**Reason:** Key codes may differ across layouts, especially for E/R keys.

### Browser Modes

- ✅ **Normal browsing** (primary)
- **Private browsing** (stricter security policies)
- **With content blockers** (may interfere with extension)
- **With other extensions** (compatibility testing)

### ChatGPT UI Variants

- ✅ **Logged in** (primary)
- **Logged out** (free tier)
- **ChatGPT Plus** (different UI features)
- **Different models** (GPT-4, GPT-3.5, custom)
- **Mobile view** (narrow viewport)
- **With sidebar collapsed/expanded**

### Envelope Sizes

Test parsing and clipboard handling with:

| Size | Characters | Lines | Test Case |
|------|------------|-------|-----------|
| Tiny | 50-100 | 1-2 | "Quick question" |
| Small | 500-1k | 10-20 | Short code snippet |
| Medium | 2k-5k | 50-100 | Function implementation |
| Large | 10k-15k | 200-300 | Full file content |
| XL | 20k+ | 500+ | Multiple files |

**Edge cases:**
- Envelopes with unicode emojis (🚀, ✓, etc.)
- Code with special characters (backticks, pipes, arrows)
- Multi-language text (English + Japanese + emoji)

## Functional Test Cases

### 1. Envelope Generation (CLI)

**Test:** `./envelope.js send --context test --intent QUESTION --body "Hello"`

✅ **Pass Criteria:**
- Valid envelope structure
- Session ID format: `YYYY-MM-DDTHHMZ xxxxxx`
- Copied to clipboard (macOS)
- No extra whitespace

**Edge Cases:**
- Empty body
- Body with newlines
- Body from stdin (`--body -`)
- Very long context names
- Special characters in fields

### 2. Envelope Parsing (CLI)

**Test:** Echo envelope | `./envelope.js parse`

✅ **Pass Criteria:**
- Extracts all fields correctly
- Handles both `response:` and `body:` formats
- Strips indentation properly
- Validates session format

**Edge Cases:**
- Envelope with code fence wrapping
- Envelope with extra whitespace
- Malformed session ID
- Missing required fields
- Both `response:` and `body:` present

### 3. Safari Extension - Paste Workflow

**Test:** Copy envelope → Press Cmd+Shift+E on ChatGPT

✅ **Pass Criteria:**
- Prompt dialog appears (if clipboard blocked)
- Envelope pasted into input field
- React state updated (button enabled)
- Submit triggered automatically
- Notification: "Envelope sent!"

**Edge Cases:**
- Clipboard empty
- Non-envelope text in clipboard
- Input field not found
- Submit button disabled
- ChatGPT rate-limited

### 4. Safari Extension - Copy Workflow

**Test:** ChatGPT response → Press Cmd+Shift+R

✅ **Pass Criteria:**
- Envelope detected in response
- Parsed successfully
- Copied to clipboard (or prompt shown)
- Notification: "Envelope copied!"

**Edge Cases:**
- No envelope in response
- Multiple envelopes (should get last)
- Malformed envelope
- Clipboard write blocked
- Response still streaming

### 5. End-to-End Round Trip

**Test:** Claude → ChatGPT → Claude (full cycle)

✅ **Pass Criteria:**
- Envelope generated in Claude
- Pasted successfully in ChatGPT
- ChatGPT responds with envelope
- Response copied and parsed
- Session ID matches

**Timing:**
- Paste → Submit: < 1s
- Response detection: < 2s after completion
- Total cycle time: depends on AI response speed

## Regression Tests

### After Safari Updates

Safari 17.x → 18.x introduced:
- ✅ No breaking changes detected

**Test checklist:**
- [ ] Keyboard shortcuts still work
- [ ] Clipboard access still requires prompts
- [ ] Extension registration still works
- [ ] DOM selectors still valid

### After ChatGPT UI Updates

ChatGPT changes UI frequently. After updates:

**Test checklist:**
- [ ] Input field selector still works
- [ ] Submit button selector still works
- [ ] Message detection still works
- [ ] Envelope extraction still works

**Mitigation:** Maintain fallback selector arrays.

## Performance Tests

### Clipboard Operations

**Test:** Measure time from shortcut press to action complete

✅ **Targets:**
- Paste envelope: < 500ms
- Copy response: < 200ms

**Measure:**
```javascript
console.time('paste-envelope');
// ... paste operation
console.timeEnd('paste-envelope');
```

### Response Detection

**Test:** Time from ChatGPT completion to envelope selection

✅ **Current:** 500ms polling interval
✅ **Target (with MutationObserver):** < 100ms

### Memory Usage

**Test:** Monitor extension memory over 100 envelope exchanges

✅ **Target:** < 10MB total, no leaks

**Tool:** Safari Web Inspector → Memory → Take Snapshot

## Security Tests

### Clipboard Isolation

**Test:** Ensure clipboard only accessed on user gesture

✅ **Verify:**
- No automatic clipboard reads
- Prompt shown when clipboard API blocked
- No clipboard writes without user action

### Cross-Origin Isolation

**Test:** Extension only activates on approved domains

✅ **Verify:**
- No activation on random websites
- Host permissions respected
- Content scripts isolated

### Code Injection Safety

**Test:** Ensure no XSS via envelope content

✅ **Verify:**
- Envelope content treated as text, not HTML
- No `innerHTML` usage
- Proper escaping in notifications

## Automated Testing

### Unit Tests (Future)

```bash
npm test
```

**Coverage:**
- Envelope parser (all formats)
- Session ID generator
- Clipboard fallbacks
- DOM selector matching

### Integration Tests (Future)

**Playwright/Puppeteer:**
- Launch Safari with extension
- Navigate to ChatGPT
- Simulate keyboard shortcuts
- Verify clipboard operations
- Check notifications

### CI/CD (Future)

**GitHub Actions:**
- Run tests on every commit
- Test against Safari 17 & 18
- Lint JavaScript
- Build extension bundle
- Generate coverage report

## Test Data

### Sample Envelopes

**Valid:**
```
[[CLAUDE→CHATGPT v1]]
user: test
session: 2025-10-09T15Z 04f07f
context: unit-test
intent: QUESTION
body: |
  Sample question
sig: none
[[END]]
```

**Invalid (missing session):**
```
[[CLAUDE→CHATGPT v1]]
user: test
context: unit-test
intent: QUESTION
body: |
  Sample question
[[END]]
```

**Edge case (Brother format):**
```
[[BROTHER→CLAUDE v1]]
user: brother
session: 2025-10-09T15Z 04f07f
context: test
body: |
  Response without intent
sig: none
[[END]]
```

## Bug Tracking

### Known Issues

| Issue | Severity | Status | Workaround |
|-------|----------|--------|------------|
| Safari aggressive JS caching | Medium | **Open** | Clean build + quit Safari |
| ChatGPT collapses newlines | High | **Fixed** | Space-separated regex |
| Clipboard blocked in Safari | Low | **By design** | Prompt fallback |

### Reporting Template

```markdown
**Browser:** Safari 18.0 / macOS 14.5
**Extension Version:** 0.1.0
**Reproduction:**
1. Step one
2. Step two
3. Expected vs Actual

**Console Logs:**
[Paste relevant logs]

**Screenshots:**
[If applicable]
```

## Testing Schedule

**Daily (during development):**
- ✅ Manual smoke test (paste + copy)
- ✅ Check console for errors

**Weekly:**
- Test on Safari 17 & 18
- Verify ChatGPT UI compatibility
- Check clipboard fallbacks

**Before Release:**
- Full test matrix (all browsers/layouts)
- Performance benchmarks
- Security audit
- Documentation review

---

**Last Updated:** 2025-10-09
**Test Coverage:** ~60% (manual), 0% (automated)
**Target:** 90%+ coverage with automated tests
