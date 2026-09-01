# Hostinger managed Web Apps deployment

This is the preferred low-operations production path when the Hostinger account has Business Web Hosting or a Cloud plan with Node.js Web Apps enabled. The existing Docker/VPS deployment remains supported as a fallback.

Kush Kings stays server-authoritative: Next.js renders the client, Express + Socket.io owns rooms and legal move validation, and PostgreSQL stores accounts, sessions, and archived games.

## Required public endpoints

- Client: `https://chess.dtfseeds.com`
- API / Socket.io: `https://chess-api.dtfseeds.com`
- API health: `https://chess-api.dtfseeds.com/health`

Deploy two Hostinger Web Apps from the same public GitHub repository:

`https://github.com/dtfgenetics/Thc-chess-git`

Use branch `main` for both apps.

## App 1 — Kush Kings client

Use the repository root so the pnpm workspace and shared `types` package remain available.

- Framework: `Other` or the detected Node.js/Next.js option that allows custom package scripts.
- Root directory: repository root (`.`).
- Node.js: 20.x or later supported version.
- Install: Hostinger package-manager install using the committed `pnpm-lock.yaml`.
- Build script: `pnpm build:client`.
- Start script: `pnpm start:client`.
- Expected Next.js output: `client/.next`.
- Domain: `chess.dtfseeds.com`.

Client environment variables:

```env
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=Kush Kings Chess
NEXT_PUBLIC_SITE_URL=https://chess.dtfseeds.com
NEXT_PUBLIC_API_URL=https://chess-api.dtfseeds.com
```

`NEXT_PUBLIC_*` variables must be present before the production build because Next.js embeds them in the browser bundle.

## App 2 — Kush Kings API

Use the same repository root so the server can resolve the workspace `@chessu/types` package.

- Framework: `Other` or Express.js with custom package scripts.
- Root directory: repository root (`.`).
- Node.js: 20.x or later supported version.
- Build script: `pnpm build:server`.
- Start script: `pnpm start:server`.
- Runtime port: `3000`.
- Domain: `chess-api.dtfseeds.com`.

API environment variables:

```env
APP_NAME=Kush Kings Chess
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://chess.dtfseeds.com,https://dtfseeds.com,https://www.dtfseeds.com
SESSION_COOKIE_NAME=kush_kings_chess
SESSION_COOKIE_DOMAIN=.dtfseeds.com
SESSION_SECRET=<generate a long random production secret>
DATABASE_URL=<Supabase PostgreSQL connection string with SSL required>
```

Never commit `SESSION_SECRET` or `DATABASE_URL`.

## PostgreSQL through Hostinger's database wizard

The server accepts a standard `DATABASE_URL` in addition to the original `PGHOST`/`PGPORT`/`PGUSER`/`PGPASSWORD`/`PGDATABASE` contract.

In the API Web App dashboard:

1. Open **Database → Connect**.
2. Select **Supabase**.
3. Connect an existing PostgreSQL project or create a new database through the Hostinger flow.
4. Ensure the resulting PostgreSQL connection string is available to the app as `DATABASE_URL`. If the wizard uses provider-specific variable names instead, copy the PostgreSQL connection string into `DATABASE_URL` manually in the Web App environment-variable settings.
5. The connection string should require TLS/SSL, for example with `sslmode=require`.
6. Redeploy/restart the API app after changing environment variables.

The API initializes the required `user`, `game`, and session tables at runtime; no manual SQL import is required for a clean database.

## First-release verification

Do not cut over the DTF games hub until all checks pass:

1. `GET https://chess-api.dtfseeds.com/health` returns JSON with `"status":"ok"`.
2. `https://chess.dtfseeds.com` renders the new Kush Kings client and defaults to the 3D board once a room is entered.
3. Guest creation/login persists a secure cookie scoped to `.dtfseeds.com`.
4. Browser A creates a room and copies the invite URL.
5. Browser B, using a separate private/incognito session, joins the room.
6. Both players can make alternating legal moves and illegal/out-of-turn moves are rejected by the server.
7. Chat, spectators, reconnect, promotion, draw offer/accept/decline, resignation, disconnect claim, and Play Again are exercised.
8. Archived game link loads and 3D replay navigation works.
9. Repeat the core create/join/move flow on a phone-size viewport and verify 2D fallback remains usable when WebGL is unavailable.
10. Only after those checks should `/games/kush-kings-chess/` be redirected or linked to `https://chess.dtfseeds.com`.

## Rollback

Hostinger GitHub deployments can redeploy an earlier known-good commit/branch state. Keep the current lightweight public route in place until the managed Web Apps pass the full verification list. If the new runtime fails after cutover, restore the prior route while the managed app is repaired; do not switch legal move authority to the legacy PHP `make-move.php` implementation.
