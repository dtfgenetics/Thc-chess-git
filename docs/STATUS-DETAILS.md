# Status Details

## Current active repo

`dtfgenetics/Thc-chess-git`

## Completed so far

- Verified the repo contains the upstream chess app files.
- Confirmed root package still preserves the upstream MIT license metadata.
- Created the documentation PR for project direction and responsibilities.
- Created `fix/site-url-config` for deployment-safe app/site config.
- Added configurable exports to `client/src/config.ts`:
  - `API_URL`
  - `SITE_URL`
  - `APP_NAME`

## Important next edit

Apply the patch in `docs/CLAUDE_PATCH_SITE_URL.md` to `client/src/components/game/GamePage.tsx`.

The patch is intentionally written as exact small edits so Claude or a local editor can apply it safely without rewriting the game logic.
