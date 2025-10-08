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
  const sessionMatch = envelopeText.match(/session:\s*(.+)/);
  const responseMatch = envelopeText.match(/response:\s*\|\n([\s\S]*?)(?=\n\[\[END\]\])/);

  if (!sessionMatch || !responseMatch) {
    throw new Error('Invalid envelope format');
  }

  return {
    from: headerMatch ? headerMatch[1] : 'unknown',
    to: headerMatch ? headerMatch[2] : 'unknown',
    version: headerMatch ? headerMatch[3] : 'unknown',
    session: sessionMatch[1].trim(),
    response: responseMatch[1].replace(/^  /gm, '').trim()
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
