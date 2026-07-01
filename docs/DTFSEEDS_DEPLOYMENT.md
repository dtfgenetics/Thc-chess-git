# DTFSeeds Deployment Plan

## Goal

Kush Kings Chess lives in the DTF Seeds games hub and uses a live server room for multiplayer games.

Primary site:

- `https://dtfseeds.com`

Recommended production URLs:

- Frontend game app: `https://chess.dtfseeds.com`
- Backend game room API: `https://chess-api.dtfseeds.com`

The DTF Seeds website can link to or embed the frontend game app from the games hub.

## Architecture

This project has two deployable services:

1. `client` — Next.js frontend
2. `server` — Express + Socket.io backend

It also requires:

3. PostgreSQL database for users, sessions, and game records

## Required environment

Use `.env.production.example` as the production template.

Important values:

- `NEXT_PUBLIC_SITE_URL` must point to the public game frontend.
- `NEXT_PUBLIC_API_URL` must point to the backend API/socket server.
- `CORS_ORIGIN` must include the frontend game URL and DTF Seeds website URLs.
- `SESSION_COOKIE_DOMAIN` should be `.dtfseeds.com` when frontend and backend use DTF subdomains.
- `SESSION_SECRET` must be a long private random value.

## Build commands

Install:

```bash
pnpm install --frozen-lockfile
```

Build client:

```bash
pnpm build:client
```

Build server:

```bash
pnpm build:server
```

## Start commands

Frontend:

```bash
pnpm start:client
```

Backend:

```bash
pnpm start:server
```

## Production verification

Before launch:

- `/health` on the backend returns OK.
- Frontend loads from the DTF game URL.
- User can create a match.
- Invite link uses the DTF game URL.
- A second browser/device can join the same game room.
- Spectator mode works.
- Chat works.
- Refreshing page keeps session active.
- Checkmate, draw, resign, archive, and rematch still work.

## Current priority

Finish applying the saved GamePage patch:

```bash
bash scripts/apply-gamepage-patch.sh
```

Then commit and push the modified `client/src/components/game/GamePage.tsx` file.
