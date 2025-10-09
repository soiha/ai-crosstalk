# Canonicalization + Signing Appendix (v1.1-rc1)

## A. Canonical form (signable portion)
- Scope: headers + body, excluding `sig:` lines.
- Normalize line endings to LF, enforce NFC.
- Header order fixed: direction, user, session, context, intent, body.
- Body: "body: |" line, 2-space indented, preserve tabs/trailing spaces.

## B. Signing process
- JWS Compact Serialization (detached payload).
- alg: EdDSA (Ed25519).
- Protected header JSON (minified, sorted).
- signing_input = b64url(protected) + "." + b64url(payload).
- Signature: Ed25519(signing_input).
- Output: detached JWS in `sig:` line.

## C. Test vectors
See files in ./vectors/ for payloads and signatures.

## D. Conformance checklist
- NFC normalize UTF-8.
- LF line endings.
- Header order strict.
- Two-space body indent.
- Detached JWS EdDSA signatures.
