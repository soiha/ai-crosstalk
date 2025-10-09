# ai-crosstalk

A tiny, human-friendly **envelope protocol + CLI** for passing structured messages between LLMs (e.g., Claude ↔ ChatGPT) via copy/paste, email, or any dumb transport. Zero infra required.

> Why? Raw copy/paste loses **intent**, **threading**, and **machine-parseability**.  
> ai-crosstalk wraps messages in a minimal **envelope** with a stable header/footer and a small set of required fields.

## ✨ Features
- **Minimal spec** (v1): fixed headers/footers, required fields in a known order
- **Intents**: `QUESTION | STATUS | PATCH | NOTE`
- **Threading** with `session: <UTC timestamp + short ID>`
- **CLI**: generate envelopes and parse replies
- **Great with clipboard** (macOS `--copy`), stdin, or files

## Quickstart

Clone & use locally:
```bash
git clone https://github.com/soiha/ai-crosstalk.git
cd ai-crosstalk
chmod +x bin/envelope.js
```

Generate an envelope (one-liner):
```bash
./bin/envelope.js send --context "demo" --intent QUESTION --body "Ping?" --copy
```

Multiline from stdin (great for diffs):
```bash
cat patch.diff | ./bin/envelope.js send --context "engine/render" --intent PATCH --body -
```

Parse a Brother reply you pasted into clipboard (macOS):
```bash
pbpaste | ./bin/envelope.js parse
```

## Envelope Format

**Claude → Brother**
```
[[CLAUDE→BROTHER v1]]
user: kalle
session: 2025-10-08T15:30Z a7f3d1
context: engine/render
intent: QUESTION
body: |
  <multiline allowed>
sig: none
[[END]]
```

**Brother → Claude**
```
[[BROTHER→CLAUDE v1]]
session: 2025-10-08T15:30Z a7f3d1
response: |
  <multiline allowed>
[[END]]
```

See full details in [spec/envelope-spec.md](spec/envelope-spec.md). AI onboarding? See [AI-INSTRUCTIONS.md](AI-INSTRUCTIONS.md).

## Status
**v0.1.0** — usable; spec may evolve. Breaking changes will bump the protocol header version (`… v2`).

## Roadmap
- `--verify-sig <secret>` integrity check
- `envelope watch` (mailbox/dir tail + auto-parse)
- Language ports (Python/Rust)
- VS Code syntax highlight

## License
MIT — see [LICENSE](LICENSE).
