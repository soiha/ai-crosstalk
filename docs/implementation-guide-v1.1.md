# Implementation Guide v1.1

**Status:** Draft
**Audience:** Developers building AI Crosstalk tools
**Version:** 1.1

---

## Overview

This guide helps you build compliant parsers, generators, relays, and tools for the AI Crosstalk Protocol v1.1.

**What you'll build:**
- **Parser** - Read and validate envelopes
- **Generator** - Create well-formed envelopes
- **Validator** - Check envelope correctness
- **Relay** - Route envelopes between systems
- **Gateway** - Bridge to other protocols (HTTP, email, SMS)

---

## Quick Start: Parse Your First Envelope

### Example Envelope

```
[[CLAUDE→BROTHER v1]]
user: kalle
session: 2025-10-09T16Z abc123
context: hello-world
intent: REQUEST
body: |
  Hello, Brother!
sig: none
[[END]]
```

### Minimal Parser (Pseudocode)

```python
def parse_envelope(text):
    lines = text.split('\n')

    # Parse header line
    header_match = re.match(r'\[\[(.+?)→(.+?)\s+v(\d+)\]\]', lines[0])
    if not header_match:
        raise ValueError("Invalid header")

    sender = header_match.group(1)
    receiver = header_match.group(2)
    version = header_match.group(3)

    # Parse fields
    fields = {}
    i = 1
    while i < len(lines) and not lines[i].startswith('body:'):
        if ':' in lines[i]:
            key, value = lines[i].split(':', 1)
            fields[key.strip()] = value.strip()
        i += 1

    # Parse body (multiline, starts with "body: |")
    body_lines = []
    if i < len(lines) and lines[i].startswith('body: |'):
        i += 1
        while i < len(lines) and not lines[i].startswith('sig:'):
            body_lines.append(lines[i])
            i += 1

    body = '\n'.join(body_lines).strip()

    # Parse signature
    sig_match = re.search(r'sig:\s*(.+)', '\n'.join(lines[i:]))
    sig = sig_match.group(1) if sig_match else 'none'

    return {
        'sender': sender,
        'receiver': receiver,
        'version': version,
        'user': fields.get('user'),
        'session': fields.get('session'),
        'context': fields.get('context'),
        'intent': fields.get('intent'),
        'body': body,
        'sig': sig
    }
```

---

## Parser Implementation

### Required Features

**v1.0 Compatibility:**
- [ ] Parse header: `[[SENDER→RECEIVER v1]]`
- [ ] Parse fields: `key: value`
- [ ] Parse multiline body: `body: |\n  content`
- [ ] Parse signature: `sig: value`
- [ ] Parse footer: `[[END]]`

**v1.1 Extensions:**
- [ ] Parse threading headers (thread, parent, message)
- [ ] Parse META blocks
- [ ] Parse URL-based addresses
- [ ] Map legacy intents to new intents
- [ ] Preserve unknown fields (forward compat)

### META Block Parsing

```python
def parse_meta_blocks(lines):
    meta_blocks = {}
    current_namespace = None

    for line in lines:
        if line.startswith('meta:'):
            # Start new META block
            current_namespace = line.split(':', 1)[1].strip()
            meta_blocks[current_namespace] = {}
        elif current_namespace and ':' in line:
            # Add key-value to current META block
            key, value = line.split(':', 1)
            meta_blocks[current_namespace][key.strip()] = value.strip()
        elif not line.strip():
            # Empty line ends META block
            current_namespace = None

    return meta_blocks
```

### Example META Block Result

```python
{
    'routing': {
        'X-Route': 'claude://abc → chatgpt://xyz',
        'X-Priority': 'high'
    },
    'privacy': {
        'PII': 'redacted',
        'Consent': 'explicit_yes_2025-10-09T16:00Z'
    }
}
```

### Address Parsing

```python
def parse_address(addr_string):
    # Handle simple names (v1.0 compat)
    if '://' not in addr_string:
        return {
            'type': 'simple_name',
            'name': addr_string
        }

    # Parse URL
    parsed = urlparse(addr_string)
    return {
        'type': 'url',
        'scheme': parsed.scheme,
        'authority': parsed.netloc,
        'path': parsed.path,
        'query': parse_qs(parsed.query),
        'fragment': parsed.fragment
    }
```

---

## Generator Implementation

### Minimal Generator

```python
def generate_envelope(sender, receiver, user, session, context, intent, body):
    envelope = f"""[[{sender}→{receiver} v1]]
user: {user}
session: {session}
context: {context}
intent: {intent}
body: |
  {indent_body(body, 2)}
sig: none
[[END]]"""
    return envelope

def indent_body(body, spaces):
    lines = body.split('\n')
    indent = ' ' * spaces
    return '\n'.join(indent + line for line in lines)
```

### Full v1.1 Generator

```python
def generate_envelope_v1_1(
    sender, receiver,
    user, session,
    context, intent, body,
    thread=None, parent=None, message=None,
    meta_blocks=None,
    sig='none'
):
    lines = [f"[[{sender}→{receiver} v1]]"]
    lines.append(f"user: {user}")
    lines.append(f"session: {session}")

    # Threading headers (optional)
    if thread:
        lines.append(f"thread: {thread}")
    if parent:
        lines.append(f"parent: {parent}")
    if message:
        lines.append(f"message: {message}")

    lines.append(f"context: {context}")
    lines.append(f"intent: {intent}")

    # META blocks (optional)
    if meta_blocks:
        for namespace, fields in meta_blocks.items():
            lines.append(f"\nmeta: {namespace}")
            for key, value in fields.items():
                lines.append(f"{key}: {value}")

    # Body
    lines.append("\nbody: |")
    for line in body.split('\n'):
        lines.append(f"  {line}")

    # Signature
    lines.append(f"sig: {sig}")
    lines.append("[[END]]")

    return '\n'.join(lines)
```

### ID Generation (Thread/Parent/Message)

```python
import ulid
import uuid

def generate_ulid():
    """Generate ULID (sortable, time-based, 26 chars)"""
    return str(ulid.ULID())

def generate_uuid7():
    """Generate UUIDv7 (sortable, time-based, 36 chars)"""
    return str(uuid.uuid7())

# Example usage
thread_id = generate_ulid()  # 01J9J3D3M6A4M3WQX8G1ZQ0S7K
message_id = generate_uuid7()  # 018c8e5a-3b2f-7890-abcd-ef1234567890
```

---

## Validator Implementation

### Validation Rules

```python
def validate_envelope(envelope):
    errors = []

    # Required fields
    required = ['sender', 'receiver', 'version', 'user', 'session', 'context', 'intent', 'body']
    for field in required:
        if field not in envelope or not envelope[field]:
            errors.append(f"Missing required field: {field}")

    # Version check
    if envelope.get('version') != '1':
        errors.append(f"Unsupported version: {envelope.get('version')}")

    # Intent validation
    valid_intents = ['REQUEST', 'RESPOND', 'ESCALATE', 'HANDOFF', 'POLL',
                     'ACK', 'NACK', 'ERROR', 'BROADCAST', 'REVOKE', 'CLOSE',
                     'QUESTION', 'ANSWER', 'STATUS', 'PATCH', 'NOTE']  # Include legacy
    if envelope.get('intent') not in valid_intents:
        errors.append(f"Invalid intent: {envelope.get('intent')}")

    # Session format (basic check)
    if envelope.get('session') and not re.match(r'\d{4}-\d{2}-\d{2}T\d{2}Z\s+\w+', envelope['session']):
        errors.append(f"Invalid session format: {envelope.get('session')}")

    # Threading: if parent exists, thread should exist
    if envelope.get('parent') and not envelope.get('thread'):
        errors.append("parent specified without thread")

    return errors
```

### META Block Validation

```python
def validate_meta_blocks(meta_blocks):
    errors = []
    warnings = []

    # Validate known namespaces
    known_namespaces = ['routing', 'privacy', 'attachments', 'error', 'audit', 'safety']

    for namespace, fields in meta_blocks.items():
        if namespace not in known_namespaces:
            warnings.append(f"Unknown META namespace: {namespace} (will be ignored)")

        # Namespace-specific validation
        if namespace == 'privacy':
            if 'Consent' in fields:
                # Validate consent format
                if not re.match(r'(explicit_yes|explicit_no|implicit)(_\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z)?', fields['Consent']):
                    errors.append(f"Invalid consent format: {fields['Consent']}")

        if namespace == 'error':
            if 'Code' not in fields:
                errors.append("error META block missing Code field")
            elif not fields['Code'].startswith('E-'):
                errors.append(f"Error code should start with E-: {fields['Code']}")

    return errors, warnings
```

---

## Relay Implementation

### Simple HTTP Relay

```python
from flask import Flask, request, Response

app = Flask(__name__)

@app.route('/crosstalk/receive', methods=['POST'])
def receive_envelope():
    # Read envelope from request body
    envelope_text = request.get_data(as_text=True)

    try:
        # Parse envelope
        envelope = parse_envelope(envelope_text)

        # Validate
        errors = validate_envelope(envelope)
        if errors:
            return create_error_envelope(
                envelope, 'E-FORMAT', 'Validation failed: ' + ', '.join(errors)
            ), 400

        # Route to destination
        response_envelope = route_envelope(envelope)

        # Return response
        return Response(response_envelope, mimetype='text/plain')

    except Exception as e:
        return create_error_envelope(
            None, 'E-ROUTE', f'Relay error: {str(e)}'
        ), 500

def route_envelope(envelope):
    # Extract destination
    receiver_addr = parse_address(envelope['receiver'])

    # Route based on scheme
    if receiver_addr['type'] == 'url':
        if receiver_addr['scheme'] == 'chatgpt':
            return route_to_chatgpt(envelope)
        elif receiver_addr['scheme'] == 'claude':
            return route_to_claude(envelope)
        elif receiver_addr['scheme'] == 'human':
            return route_to_human(envelope)

    # Fallback: return error
    return create_error_envelope(envelope, 'E-ROUTE', 'Unknown destination')
```

### Audit Trail Addition

```python
def add_audit_trail(envelope_text, relay_id):
    """Add audit META block to envelope"""
    envelope = parse_envelope(envelope_text)

    # Add audit info
    if 'audit' not in envelope.get('meta_blocks', {}):
        envelope['meta_blocks']['audit'] = {}

    audit = envelope['meta_blocks']['audit']
    audit['Received-At'] = datetime.utcnow().isoformat() + 'Z'
    audit['Received-By'] = relay_id

    # Calculate hop digest
    import hashlib
    digest = hashlib.sha256(envelope_text.encode()).hexdigest()
    audit['Hop-Digest'] = f"sha256:{digest}"

    # Regenerate envelope with audit
    return generate_envelope_v1_1(**envelope)
```

---

## Gateway Implementation

### Email Gateway

```python
import smtplib
from email.mime.text import MIMEText

def envelope_to_email(envelope):
    """Convert envelope to email"""
    msg = MIMEText(generate_envelope_v1_1(**envelope), 'plain', 'utf-8')

    msg['Subject'] = f"[AI Crosstalk] {envelope['context']} - {envelope['intent']}"
    msg['From'] = address_to_email(envelope['sender'])
    msg['To'] = address_to_email(envelope['receiver'])

    # Add envelope message ID as email message ID
    if envelope.get('message'):
        msg['Message-ID'] = f"<{envelope['message']}@crosstalk>"

    # Add parent as In-Reply-To
    if envelope.get('parent'):
        msg['In-Reply-To'] = f"<{envelope['parent']}@crosstalk>"

    return msg

def email_to_envelope(email_msg):
    """Convert email to envelope"""
    # Extract body (envelope content)
    body = email_msg.get_payload(decode=True).decode('utf-8')

    # Parse envelope from body
    envelope = parse_envelope(body)

    # Add email-specific META
    envelope['meta_blocks']['email'] = {
        'Message-ID': email_msg['Message-ID'],
        'In-Reply-To': email_msg.get('In-Reply-To', ''),
        'Date': email_msg['Date']
    }

    return envelope
```

### SMS Gateway

```python
def envelope_to_sms(envelope):
    """Convert envelope to SMS (truncated)"""
    # SMS is limited, send summary + link
    summary = f"[{envelope['intent']}] {envelope['context'][:30]}..."
    body_preview = envelope['body'][:100] + ('...' if len(envelope['body']) > 100 else '')

    # Store full envelope, generate short link
    envelope_id = store_envelope(envelope)
    short_link = f"https://crosstalk.example.com/e/{envelope_id}"

    sms_text = f"{summary}\n{body_preview}\nFull: {short_link}"
    return sms_text

def sms_to_envelope(phone_number, sms_text):
    """Convert SMS to envelope"""
    return generate_envelope_v1_1(
        sender=f"tel:{phone_number}",
        receiver="human://sms-gateway",
        user="sms-user",
        session=generate_session_id(),
        context="sms-message",
        intent="REQUEST",
        body=sms_text,
        meta_blocks={
            'sms': {
                'From': phone_number,
                'Received-At': datetime.utcnow().isoformat() + 'Z'
            }
        }
    )
```

---

## Testing Your Implementation

### Test Fixtures

Create test files in `tests/fixtures/`:

**tests/fixtures/valid-v1.0-basic.txt:**
```
[[CLAUDE→BROTHER v1]]
user: kalle
session: 2025-10-09T16Z abc123
context: test
intent: QUESTION
body: |
  Test message
sig: none
[[END]]
```

**tests/fixtures/valid-v1.1-with-meta.txt:**
```
[[claude://session/abc→chatgpt://thread/xyz v1]]
user: kalle
session: 2025-10-09T16Z abc123
thread: 01J9J3D3M6A4M3WQX8G1ZQ0S7K
message: 01J9J3DBC4N7P2Q3R5S7T9U1V2
context: test
intent: REQUEST

meta: routing
X-Priority: high

body: |
  Test with META
sig: none
[[END]]
```

### Unit Tests

```python
import unittest

class TestEnvelopeParser(unittest.TestCase):
    def test_parse_basic_v1_0(self):
        with open('tests/fixtures/valid-v1.0-basic.txt') as f:
            envelope = parse_envelope(f.read())

        self.assertEqual(envelope['sender'], 'CLAUDE')
        self.assertEqual(envelope['receiver'], 'BROTHER')
        self.assertEqual(envelope['intent'], 'QUESTION')
        self.assertEqual(envelope['body'].strip(), 'Test message')

    def test_parse_v1_1_with_meta(self):
        with open('tests/fixtures/valid-v1.1-with-meta.txt') as f:
            envelope = parse_envelope(f.read())

        self.assertEqual(envelope['thread'], '01J9J3D3M6A4M3WQX8G1ZQ0S7K')
        self.assertEqual(envelope['intent'], 'REQUEST')
        self.assertIn('routing', envelope['meta_blocks'])
        self.assertEqual(envelope['meta_blocks']['routing']['X-Priority'], 'high')

    def test_invalid_envelope_missing_header(self):
        with self.assertRaises(ValueError):
            parse_envelope("invalid envelope text")

    def test_legacy_intent_mapping(self):
        envelope = parse_envelope("""
[[CLAUDE→BROTHER v1]]
user: kalle
session: 2025-10-09T16Z abc123
context: test
intent: QUESTION
body: |
  Old style
sig: none
[[END]]""")

        # Should map QUESTION → REQUEST
        mapped_intent = map_legacy_intent(envelope['intent'])
        self.assertEqual(mapped_intent, 'REQUEST')
```

### Integration Tests

```python
def test_full_round_trip():
    # Generate envelope
    envelope1 = generate_envelope_v1_1(
        sender="claude://session/abc",
        receiver="chatgpt://thread/xyz",
        user="testuser",
        session=generate_session_id(),
        context="integration-test",
        intent="REQUEST",
        body="Hello, integration test!",
        thread=generate_ulid(),
        message=generate_ulid()
    )

    # Parse it back
    parsed = parse_envelope(envelope1)

    # Validate
    errors = validate_envelope(parsed)
    assert len(errors) == 0, f"Validation errors: {errors}"

    # Generate response
    envelope2 = generate_envelope_v1_1(
        sender=parsed['receiver'],
        receiver=parsed['sender'],
        user="testuser2",
        session=parsed['session'],
        context=parsed['context'],
        intent="RESPOND",
        body="Hello back!",
        thread=parsed['thread'],
        parent=parsed['message'],
        message=generate_ulid()
    )

    # Parse response
    response = parse_envelope(envelope2)

    # Verify threading
    assert response['thread'] == parsed['thread']
    assert response['parent'] == parsed['message']
```

---

## Performance Considerations

### Parser Optimization

**Streaming Parser:**
- Don't load entire envelope into memory
- Parse line-by-line for large envelopes
- Stop parsing body after size limit

**Caching:**
- Cache parsed envelopes by hash
- Cache address resolution results
- Cache signature verification results

### Generator Optimization

**Template-based Generation:**
```python
ENVELOPE_TEMPLATE = """[[{sender}→{receiver} v1]]
user: {user}
session: {session}
context: {context}
intent: {intent}
body: |
{body}
sig: {sig}
[[END]]"""

def fast_generate(sender, receiver, user, session, context, intent, body, sig='none'):
    return ENVELOPE_TEMPLATE.format(
        sender=sender,
        receiver=receiver,
        user=user,
        session=session,
        context=context,
        intent=intent,
        body='\n'.join('  ' + line for line in body.split('\n')),
        sig=sig
    )
```

---

## Security Implementation

### Signature Generation

```python
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
import base64

def sign_envelope(envelope_text, private_key, key_id):
    """Sign envelope with Ed25519"""
    # Hash the envelope (everything except sig line)
    envelope_without_sig = re.sub(r'sig:.*', 'sig: ', envelope_text)
    message = envelope_without_sig.encode('utf-8')

    # Sign
    signature = private_key.sign(message)
    sig_b64 = base64.b64encode(signature).decode('ascii')

    # Format signature
    sig_value = f"ed25519:pkid={key_id};sig={sig_b64}"

    # Replace sig: line
    return re.sub(r'sig:.*', f'sig: {sig_value}', envelope_text)
```

### Signature Verification

```python
def verify_envelope(envelope_text, public_key):
    """Verify envelope signature"""
    # Parse signature
    sig_match = re.search(r'sig:\s*ed25519:pkid=(.+?);sig=(.+)', envelope_text)
    if not sig_match:
        return False, "No signature found"

    key_id = sig_match.group(1)
    sig_b64 = sig_match.group(2)
    signature = base64.b64decode(sig_b64)

    # Get envelope without signature
    envelope_without_sig = re.sub(r'sig:.*', 'sig: ', envelope_text)
    message = envelope_without_sig.encode('utf-8')

    # Verify
    try:
        public_key.verify(signature, message)
        return True, "Signature valid"
    except Exception as e:
        return False, f"Signature invalid: {str(e)}"
```

---

## Library Implementations

### Python

```bash
pip install ai-crosstalk
```

```python
from ai_crosstalk import Envelope, parse_envelope, generate_envelope

# Parse
envelope = parse_envelope(envelope_text)

# Generate
envelope = Envelope(
    sender="claude://session/abc",
    receiver="chatgpt://thread/xyz",
    user="alice",
    context="test",
    intent="REQUEST",
    body="Hello!"
)
print(envelope.to_string())
```

### JavaScript/Node.js

```bash
npm install ai-crosstalk
```

```javascript
const { parseEnvelope, generateEnvelope } = require('ai-crosstalk');

// Parse
const envelope = parseEnvelope(envelopeText);

// Generate
const envelope = generateEnvelope({
  sender: 'claude://session/abc',
  receiver: 'chatgpt://thread/xyz',
  user: 'alice',
  context: 'test',
  intent: 'REQUEST',
  body: 'Hello!'
});
console.log(envelope);
```

---

## Next Steps

1. **Implement minimal parser** - Start with v1.0 compatibility
2. **Add v1.1 features** - Threading, META blocks, URL addresses
3. **Write tests** - Use provided fixtures and test patterns
4. **Build tools** - CLI, web UI, browser extension
5. **Contribute** - Share your implementation with the community

---

**Status:** Draft guide for implementers
**Contributors:** Claude, Brother AI, Kalle
**Last Updated:** 2025-10-09
