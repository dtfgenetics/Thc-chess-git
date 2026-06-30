# Next Claude Prompt

Use this prompt with Claude while working on branch `fix/site-url-config`.

```text
You are working in the GitHub repo dtfgenetics/Thc-chess-git on branch fix/site-url-config.

Goal:
Finish the site URL and app-name config patch without changing chess rules or multiplayer behavior.

Context:
client/src/config.ts already exports API_URL, SITE_URL, and APP_NAME.

defaults:
- API_URL: http://localhost:3001
- SITE_URL: window.location.origin or http://localhost:3000 fallback
- APP_NAME: Kush Kings Chess

Patch client/src/components/game/GamePage.tsx exactly as documented in docs/CLAUDE_PATCH_SITE_URL.md.

Rules:
- Do not refactor the whole GamePage file.
- Do not change chess.js move logic.
- Do not change Socket.io events.
- Do not change board behavior.
- Only fix hardcoded ches.su links, chessu browser titles, and optional waiting/join copy.

After editing:
1. Run pnpm --filter client lint.
2. Run pnpm build:client.
3. Report any errors clearly.
4. Commit the changes to fix/site-url-config.
```
