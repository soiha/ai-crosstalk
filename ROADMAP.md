# AI Crosstalk Roadmap

Based on Brother AI's comprehensive repo review (2025-10-09).

## Status: "Cool repo" → "Confidently adoptable"

Brother's assessment: **"This is tight. Clear protocol, working tooling, and genuinely useful workflow."**

Next steps to take it from working prototype to production-ready tool.

---

## Phase 1: Repository Structure & Polish

### 1.1 Reorganize Documentation
- [ ] Move top-level docs into `/docs/` with index
- [ ] Keep README.md slim, cross-link AI-INSTRUCTIONS.md and CLAUDE.md
- [ ] Add quick-reference navigation

### 1.2 CLI Improvements
- [ ] Move `envelope.js` into `/cli/` or `/tools/`
- [ ] Add `package.json` with `bin` field for `npx ai-crosstalk`
- [ ] Add CLI-specific README.md
- [ ] Publish to npm as `ai-crosstalk` package

### 1.3 Schema & Validation
- [ ] Create `/schemas/envelope.v1.json` (JSON Schema)
- [ ] Add schema validation to CLI (`send` and `parse` commands)
- [ ] Add `make test` for schema validation against fixtures
- [ ] Use examples in `/examples/` as test fixtures

---

## Phase 2: Protocol Enhancements

### 2.1 Protocol Specification
- [ ] Add error envelope format (`intent: ERROR` with `code` and `message`)
- [ ] Include EBNF/ABNF grammar for envelope block
- [ ] Add reserved-fields table for future v2 compatibility
- [ ] Document versioning strategy (protocol vs tool versions)

### 2.2 Security Documentation
- [ ] Document threat model:
  - Prompt injection from other AI
  - Code fence auto-exec risks
  - Safe rendering guidance
- [ ] Add privacy section for Safari extension (local-only, no data leaves machine)
- [ ] Document what extension reads/writes (clipboard, form submission)

---

## Phase 3: Documentation Polish

### 3.1 Visual Documentation
- [ ] Create "5-minute tour" animated GIF or short MP4
- [ ] Show: generate → paste → round-trip → parse
- [ ] Add to README.md with link to full demo

### 3.2 Safari Extension Docs
- [ ] Surface two big gotchas at the top:
  - ✅ "Allow unsigned extensions" toggle (DONE)
  - Clipboard/submit quirks
- [ ] Add troubleshooting matrix:
  - Events not firing
  - Paste blocked
  - Cache stale
- [ ] Bold callout blocks for common issues

### 3.3 Example Transcripts
- [ ] Create 3 "golden path" examples under `/examples/`:
  1. Q&A conversation
  2. Status update relay
  3. Code review with fenced blocks

---

## Phase 4: Developer Experience

### 4.1 GitHub Actions CI/CD
- [ ] Add ESLint for linting
- [ ] Add type-checking (consider TypeScript migration)
- [ ] Unit tests for parser
- [ ] Lightweight e2e test: `send | parse`
- [ ] Add status badges to README.md

### 4.2 Issue Templates
- [ ] Bug report (include: Chat UI, browser, steps)
- [ ] Feature proposal
- [ ] Protocol change (breaking/non-breaking)

### 4.3 Versioning
- [ ] Tag protocol versions separately: `proto/1.0.0`, `cli/0.3.0`
- [ ] Add compatibility matrix
- [ ] Document semantic versioning strategy

---

## Phase 5: CLI Enhancement

### 5.1 Reply Helper
- [ ] Add `--reply` flag that:
  - Wraps incoming envelope
  - Copies session/context
  - Opens `$EDITOR` for response

### 5.2 NPM Publishing
- [ ] Publish CLI as `ai-crosstalk` package
- [ ] Enable `npx ai-crosstalk send ...`
- [ ] Add installation docs for npm

---

## Phase 6: Ecosystem & Extensions

### 6.1 Editor Integration (Optional)
- [ ] VS Code snippet/extension
- [ ] Recognizes envelope blocks
- [ ] Offers "Copy as reply" / "Validate" actions

### 6.2 Browser Extensions
- [ ] Chrome/Firefox ports (after Safari is stable)
- [ ] Manifest V3 compatibility
- [ ] Cross-browser testing

---

## YouTube Demo Video (Weekend Project)

Brother's recommended structure:

### Hook (30s)
"Two AIs, one protocol. No chaos, just crosstalk."

### Problem Statement
Ad-hoc copy-pasting is lossy and ambiguous

### Solution Demo
1. Show envelope format
2. `./envelope.js send` in terminal
3. Paste to ChatGPT
4. Round-trip response
5. Parse output

### Safari Extension "Wow" Moment
- Keyboard shortcut demo (Cmd+Shift+E, Cmd+Shift+R)
- Show code fence handling
- Demonstrate seamless workflow

### Failure Case
- Intentionally malformed envelope
- Schema validation error
- Fast recovery

### Extensibility
- Show `config.json` swapping models/names
- Demonstrate protocol flexibility

### Call to Action
- Repo link: https://github.com/soiha/ai-crosstalk
- "Open an issue with your use case"

---

## Implementation Priority

**High Priority (This Week):**
1. ✅ Safari extension submit button fix (DONE)
2. ✅ "Allow unsigned extensions" documentation (DONE)
3. Schema validation (Phase 1.3)
4. YouTube demo video (Phase 6)
5. Example transcripts (Phase 3.3)

**Medium Priority (Next 2 Weeks):**
1. CLI reorganization and npm publishing (Phase 1.2, 5.2)
2. GitHub Actions CI/CD (Phase 4.1)
3. Protocol enhancements (Phase 2.1)
4. Visual documentation (Phase 3.1)

**Low Priority (Future):**
1. TypeScript migration
2. VS Code extension
3. Chrome/Firefox ports
4. Reply helper

---

## Notes from Brother AI

> "Ship it. With a schema + CLI publish + demo video, this becomes a tiny but sharp standard folks will actually adopt."

**Attribution:** Roadmap based on comprehensive review by Brother AI (ChatGPT).

---

**Last Updated:** 2025-10-09
**Status:** Ready for Phase 1 implementation
