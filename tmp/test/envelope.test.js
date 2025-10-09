import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test('spec example parses', () => {
  const txt = readFileSync(resolve(__dirname, '../examples/brother-reply.txt'), 'utf8');
  const session = /^\s*session:\s*(.+)\s*$/m.exec(txt)?.[1]?.trim();
  const bodyMatch = /^\s*response:\s*\|\s*\n([\s\S]*?)\n\[\[END\]\]/m.exec(txt);
  const body = bodyMatch ? bodyMatch[1].replace(/^  /gm, '').trim() : null;

  assert.ok(session.includes('T15:30Z'));
  assert.equal(body, 'Pong. Bridge operational.');
});
