# Envelope Spec (v1)

## Purpose
Provide a minimal, copy/paste-friendly wrapper for structured inter-LLM messages that is:
- Human typeable
- Machine parseable
- Transport-agnostic (clipboard, email, gists, files)

## Framing
- **Header**: `[[CLAUDE→BROTHER v1]]` or `[[BROTHER→CLAUDE v1]]`
- **Footer**: `[[END]]`
- **Version**: the trailing `v1` in the header. Breaking changes bump this.

## Fields (Claude → Brother, in order)
1. `user`: opaque sender label
2. `session`: `YYYY-MM-DDTHH:MMZ <6-hex>`
3. `context`: short scope (module/subsystem/file)
4. `intent`: `QUESTION | STATUS | PATCH | NOTE`
5. `body: |` — indented multiline block
6. `sig`: optional integrity marker (`none` allowed)

## Fields (Brother → Claude, in order)
1. `session`: echo back
2. `response: |` — indented multiline block

## Validation
- Header and footer present
- Required fields in order
- Session present in both directions
- Indented blocks preserve newlines

## Versioning
- Breaking changes → bump to `… v2`
- Parsers should reject unsupported versions unless tolerant

## Rationale
- YAML-style `|` blocks are human-friendly
- Fixed order simplifies regex parsing
- Minimal field set keeps it robust
