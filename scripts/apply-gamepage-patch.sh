#!/usr/bin/env bash
set -euo pipefail

PATCH_FILE="patches/0001-site-url-config-gamepage-patch.patch"
GAME_PAGE="client/src/components/game/GamePage.tsx"

if [[ ! -f "$PATCH_FILE" ]]; then
  echo "Missing patch file: $PATCH_FILE"
  exit 1
fi

if ! grep -q "ches.su\|chessu" "$GAME_PAGE"; then
  echo "GamePage patch already appears to be applied."
  exit 0
fi

git apply "$PATCH_FILE"

pnpm --filter client lint
pnpm build:client

echo "GamePage patch applied and verified. Commit the changed GamePage.tsx file."
