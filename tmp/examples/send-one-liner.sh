#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
"${DIR}/../bin/envelope.js" send --context "demo" --intent QUESTION --body "Ping?" --copy
