#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
cat <<'EOF' | "${DIR}/../bin/envelope.js" send --context "demo" --intent PATCH --body -
diff --git a/foo b/foo
-index 123..456 100644
+index 123..abc 100644
EOF
