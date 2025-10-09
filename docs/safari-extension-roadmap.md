# Safari Extension Improvement Roadmap

Based on collaborative feedback from Brother AI, this roadmap outlines planned improvements to the Safari extension.

## Phase 1: Core Robustness (Next 3 Commits)

### 1. Code Fence Wrapping + Checksums
**Priority:** High
**Effort:** Medium

- Wrap envelope payloads in triple-backtick code blocks to preserve newlines
- Add `hash: crc32` line for integrity checking
- Parser warns on truncation/corruption
- Backwards compatible with existing envelopes

**Benefits:**
- No more newline collapse issues in ChatGPT rendering
- Early detection of copy-paste errors
- More reliable cross-platform compatibility

### 2. On-Page HUD/Toast Component
**Priority:** High
**Effort:** Low

- Visual feedback for all actions: "Envelope pasted ✓", "Copied ✓"
- Replaces current notification system with less intrusive toast
- Auto-dismiss after 2-3 seconds
- Positioned to avoid blocking UI elements

**Benefits:**
- Better user feedback without browser notification permissions
- Less jarring than current notification system
- Consistent styling across platforms

### 3. Manifest V3 Commands API
**Priority:** Medium
**Effort:** Low

- Move keyboard shortcuts to `manifest.json` `commands` section
- Keep capture-phase listeners as fallback for dynamic contexts
- Allows user customization in browser settings

**Benefits:**
- More reliable hotkey registration
- User can remap shortcuts without code changes
- Better integration with Safari's extension system

## Phase 2: Enhanced Reliability

### 4. Clipboard Fallback Ladder
**Priority:** High
**Effort:** Medium

Current: `navigator.clipboard.*` → `prompt()` dialog

Improved:
1. Try `navigator.clipboard.*` on user gesture
2. Fall back to hidden `<textarea>` + `execCommand('copy')`
3. Final fallback: `prompt()` dialog

**Benefits:**
- Fewer manual prompts for users
- Better UX on platforms with partial clipboard support
- Graceful degradation

### 5. MutationObserver for Response Detection
**Priority:** Medium
**Effort:** Medium

- Replace polling with `MutationObserver` watching for new assistant messages
- Auto-select envelope text when response completes
- Handles ChatGPT UI reflows gracefully

**Benefits:**
- Immediate response detection (no 500ms polling delay)
- Lower CPU usage
- More reliable across ChatGPT UI updates

### 6. Resilient DOM Selectors
**Priority:** High
**Effort:** Medium

- Maintain fallback selector arrays for input/button elements
- Show toast: "Click input box & press ⌘⇧E again" if selectors fail
- Log selector misses for telemetry

**Benefits:**
- Extension survives ChatGPT UI changes longer
- Clear user guidance when selectors break
- Data for proactive selector updates

## Phase 3: Developer Experience

### 7. RPC Layer with Typed Errors
**Priority:** Low
**Effort:** Medium

- Wrap `browser.scripting.executeScript()` in retry logic (jitter + timeout)
- Typed error codes: `NO_TARGET`, `PERMISSION_DENIED`, `CLIPBOARD_BLOCKED`
- Better error messages for debugging

**Benefits:**
- More reliable message passing
- Easier troubleshooting
- Foundation for future features

### 8. Developer Console Panel
**Priority:** Low
**Effort:** Medium

- Mini debug panel showing:
  - Last action performed
  - Selector used
  - Elapsed time
  - "Dry-run" mode (no clipboard access)

**Benefits:**
- Faster debugging during development
- User-reportable debug info
- Safe testing without clipboard side effects

## Phase 4: User Customization

### 9. Options Page
**Priority:** Medium
**Effort:** Medium

Settings:
- Toggle code-fence wrapping
- Host allowlist (which sites to activate on)
- Remap hotkeys (E/R vs V/C)
- Toggle auto-copy on response

**Benefits:**
- User control over behavior
- Adapt to different workflows
- Future-proof for feature flags

### 10. Keyboard Shortcut Scoping
**Priority:** Low
**Effort:** Low

- Scope listeners to approved hosts only
- Ignore IME/Alt layers to avoid layout surprises
- Disable shortcuts when input fields are focused (except target input)

**Benefits:**
- No interference with other sites
- Better multi-language support
- Fewer unexpected activations

## Phase 5: Quality Assurance

### 11. Comprehensive Test Matrix
**Priority:** High
**Effort:** High

Test across:
- Safari 17 & 18
- Private browsing windows
- Keyboard layouts: Nordic, US, UK, German
- ChatGPT UI variants (logged in/out, different models)
- Envelope sizes: 100 chars → 20k chars

**Benefits:**
- Catch edge cases before users do
- Confidence in cross-platform support
- Regression prevention

## Quick Wins (Can implement today)

1. **Add ANSWER intent** to protocol (Brother already uses it) ✅ (CLI parser fixed)
2. **Improve error messages** - more specific failure reasons
3. **Add version info** to extension manifest for debugging

## Nice-to-Haves (Future)

- Envelope history viewer (last 10 exchanges)
- Batch envelope exchange (multiple questions at once)
- Auto-update DOM selectors via remote config JSON
- Native macOS menubar app for full clipboard monitoring
- Chrome/Firefox ports

## Implementation Order (Recommended)

**Sprint 1 (This week):**
1. Code-fence + CRC32 ✓
2. HUD/toast component ✓
3. MV3 commands API ✓

**Sprint 2 (Next week):**
4. Clipboard fallback ladder
5. MutationObserver
6. Resilient selectors

**Sprint 3 (Following week):**
7. Options page
8. Test matrix
9. RPC layer

---

**Note:** All improvements maintain backwards compatibility with existing envelope format and CLI tools.
