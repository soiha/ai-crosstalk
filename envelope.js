#!/usr/bin/env node

/**
 * Envelope communication helper for AI Crosstalk protocol
 * Usage:
 *   ./envelope.js send --context "project-name" --intent QUESTION --body "Your message"
 *   echo "multiline message" | ./envelope.js send --context "project" --intent QUESTION --body -
 *   ./envelope.js parse < response.txt
 */

import chalk from 'chalk';
import { spawn } from 'child_process';
import { platform } from 'os';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadConfig() {
  const configPath = join(__dirname, 'config.json');
  const defaultConfigPath = join(__dirname, 'config.default.json');

  try {
    if (existsSync(configPath)) {
      return JSON.parse(readFileSync(configPath, 'utf8'));
    } else {
      console.error(chalk.yellow('⚠ No config.json found, using defaults. Copy config.example.json to config.json to customize.'));
      return JSON.parse(readFileSync(defaultConfigPath, 'utf8'));
    }
  } catch (error) {
    console.error(chalk.red('Error loading config:'), error.message);
    process.exit(1);
  }
}

const config = loadConfig();

function generateSessionId() {
  const timestamp = new Date().toISOString().slice(0, 16).replace('T', 'T').slice(0, -3) + 'Z';
  const randomId = Math.random().toString(16).slice(2, 8);
  return `${timestamp} ${randomId}`;
}

function createEnvelope(context, intent, body) {
  const session = generateSessionId();

  return `[[${config.sender}→${config.receiver} v${config.version}]]
user: ${config.user}
session: ${session}
context: ${context}
intent: ${intent}
body: |
  ${body.split('\n').map(line => '  ' + line).join('\n').trim()}
sig: none
[[END]]`;
}

function parseEnvelope(envelopeText) {
  const headerMatch = envelopeText.match(/\[\[(.+?)→(.+?)\s+v(\d+)\]\]/);
  const sessionMatch = envelopeText.match(/session:\s*([^\s]+(?:\s+[^\s]+)*?)(?=\s+(?:context|intent|body|response|sig|\[\[END\]\]))/);
  const intentMatch = envelopeText.match(/intent:\s*(QUESTION|STATUS|PATCH|NOTE|ANSWER)/);

  // Try both response: and body: formats (handles different AI response styles)
  const responseMatch = envelopeText.match(/response:\s*\|\s*([^]+?)(?=\s+\[\[END\]\])/);
  const bodyMatch = envelopeText.match(/body:\s*\|\s*([^]+?)(?=\s+sig:)/);

  if (!headerMatch || !sessionMatch) {
    throw new Error('Invalid envelope format: missing header or session');
  }

  // Determine response content
  // - response: field (Claude's response style)
  // - body: field without intent (Brother's response style without intent field)
  // - body: field with intent (request or Brother's ANSWER style)
  let responseContent;
  if (responseMatch) {
    responseContent = responseMatch[1].trim();
  } else if (bodyMatch) {
    // Body field present - could be request or response
    responseContent = bodyMatch[1].trim();
  } else {
    throw new Error('Invalid envelope format: missing response or body content');
  }

  return {
    from: headerMatch[1],
    to: headerMatch[2],
    version: headerMatch[3],
    session: sessionMatch[1].trim(),
    response: responseContent.replace(/^  /gm, '').trim()
  };
}

function copyToClipboard(text) {
  if (platform() !== 'darwin') {
    return; // Only auto-copy on macOS
  }

  const pbcopy = spawn('pbcopy');
  pbcopy.stdin.write(text);
  pbcopy.stdin.end();
}

async function readStdin() {
  return new Promise((resolve) => {
    let input = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => {
      input += chunk;
    });
    process.stdin.on('end', () => {
      resolve(input.trim());
    });
  });
}

// CLI handling
const args = process.argv.slice(2);
const command = args[0];

if (command === 'send') {
  const contextIndex = args.indexOf('--context');
  const intentIndex = args.indexOf('--intent');
  const bodyIndex = args.indexOf('--body');

  if (contextIndex === -1 || intentIndex === -1 || bodyIndex === -1) {
    console.error('Usage: envelope.js send --context <context> --intent <intent> --body <body|->');
    process.exit(1);
  }

  const context = args[contextIndex + 1];
  const intent = args[intentIndex + 1];
  const bodyArg = args[bodyIndex + 1];

  if (bodyArg === '-') {
    // Read from stdin
    readStdin().then(body => {
      const envelope = createEnvelope(context, intent, body);
      console.log(envelope);
      copyToClipboard(envelope);
      if (platform() === 'darwin') {
        console.error(chalk.green('✓ Copied to clipboard'));
      }
    });
  } else {
    const envelope = createEnvelope(context, intent, bodyArg);
    console.log(envelope);
    copyToClipboard(envelope);
    if (platform() === 'darwin') {
      console.error(chalk.green('✓ Copied to clipboard'));
    }
  }

} else if (command === 'parse') {
  let input = '';
  process.stdin.setEncoding('utf8');

  process.stdin.on('data', chunk => {
    input += chunk;
  });

  process.stdin.on('end', () => {
    try {
      const parsed = parseEnvelope(input);
      console.log(chalk.cyan(`From: ${parsed.from} → ${parsed.to}`), chalk.gray(`(v${parsed.version})`));
      console.log(chalk.green('Session:'), parsed.session);
      console.log(chalk.bold('Response:'));
      console.log(parsed.response);
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

} else {
  console.error('Usage: envelope.js <send|parse>');
  process.exit(1);
}
