#!/usr/bin/env node
"use strict";

const fs = require("fs");
const { spawnSync } = require("child_process");

function isoMinutesUTC() {
  const iso = new Date().toISOString();
  const minutes = iso.slice(0, 16);
  return `${minutes}Z`;
}

function randomId(len = 6) {
  return Math.random().toString(16).slice(2, 2 + len);
}

function generateSessionId() {
  return `${isoMinutesUTC()} ${randomId(6)}`;
}

function indentBlock(s) {
  return s.replace(/^/gm, "  ");
}

function createEnvelope(context, intent, body) {
  const session = generateSessionId();
  const indented = indentBlock(body.replace(/\r\n/g, "\n"));
  return `[[CLAUDE→BROTHER v1]]
user: kalle
session: ${session}
context: ${context}
intent: ${intent}
body: |
${indented}
sig: none
[[END]]`;
}

function parseEnvelope(envelopeText) {
  const sessionMatch = envelopeText.match(/^\s*session:\s*(.+)\s*$/m);
  const responseMatch = envelopeText.match(/^\s*response:\s*\|\s*\n([\s\S]*?)\n\[\[END\]\]\s*$/m);

  if (!sessionMatch || !responseMatch) {
    throw new Error("Invalid envelope format");
  }

  return {
    session: sessionMatch[1].trim(),
    response: responseMatch[1].replace(/^  /gm, "").trim(),
  };
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let input = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (input += chunk));
    process.stdin.on("end", () => resolve(input));
    process.stdin.on("error", reject);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === "send") {
    const getArg = (name) => {
      const idx = args.indexOf(name);
      return idx !== -1 ? args[idx + 1] : undefined;
    };

    const hasFlag = (name) => args.includes(name);

    const context = getArg("--context");
    const intent = getArg("--intent");
    const bodyArg = getArg("--body");
    const bodyFile = getArg("--body-file");
    const toClipboard = hasFlag("--copy");

    if (!context || !intent || (!bodyArg && !bodyFile)) {
      console.error("Usage: envelope.js send --context <context> --intent <intent> (--body <text>|--body -|--body-file <path>) [--copy]");
      process.exit(1);
    }

    let body = "";
    if (bodyArg === "-") {
      body = await readStdin();
    } else if (typeof bodyArg === "string") {
      body = bodyArg;
    } else if (bodyFile) {
      body = fs.readFileSync(bodyFile, "utf8");
    }

    if (!body.endsWith("\n")) body += "\n";

    const envelope = createEnvelope(context, intent, body);
    console.log(envelope);

    if (toClipboard && process.platform === "darwin") {
      try {
        spawnSync("pbcopy", { input: envelope, stdio: "ignore" });
      } catch (_) {}
    }
  } else if (command === "parse") {
    const input = await readStdin();
    try {
      const parsed = parseEnvelope(input);
      console.log("Session:", parsed.session);
      console.log("Response:");
      console.log(parsed.response);
    } catch (err) {
      console.error("Error:", err.message);
      process.exit(1);
    }
  } else {
    console.error("Usage: envelope.js <send|parse>");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
