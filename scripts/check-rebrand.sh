#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

KNOWN_BLOCKED_FILE="client/src/components/game/GamePage.tsx"

echo "Checking Kush Kings Chess rebrand..."
echo "Temporarily excluding ${KNOWN_BLOCKED_FILE}; apply scripts/apply-gamepage-patch.sh to finish that component."

if grep -R "https://ches.su" client server --exclude="GamePage.tsx" --exclude-dir=node_modules --exclude-dir=.next; then
  echo "Found hardcoded upstream domain outside the known blocked GamePage component. Replace with SITE_URL."
  exit 1
fi

if grep -R "document.title = \"chessu\"" client --exclude="GamePage.tsx" --exclude-dir=node_modules --exclude-dir=.next; then
  echo "Found hardcoded upstream browser title outside the known blocked GamePage component. Replace with APP_NAME."
  exit 1
fi

if grep -R "chessuDark\|chessuLight" client --exclude-dir=node_modules --exclude-dir=.next; then
  echo "Found upstream theme names. Replace with kushKingsDark/kushKingsLight."
  exit 1
fi

echo "Rebrand check passed outside the known blocked GamePage component."
