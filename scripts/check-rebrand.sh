#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Checking Kush Kings Chess rebrand..."

if grep -R "https://ches.su" client server --exclude-dir=node_modules --exclude-dir=.next; then
  echo "Found hardcoded upstream domain. Replace with SITE_URL."
  exit 1
fi

if grep -R "document.title = \"chessu\"" client --exclude-dir=node_modules --exclude-dir=.next; then
  echo "Found hardcoded upstream browser title. Replace with APP_NAME."
  exit 1
fi

if grep -R "chessuDark\|chessuLight" client --exclude-dir=node_modules --exclude-dir=.next; then
  echo "Found upstream theme names. Replace with kushKingsDark/kushKingsLight."
  exit 1
fi

echo "Rebrand check passed."
