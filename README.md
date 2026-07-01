# Kush Kings Chess / THC Chess

Kush Kings Chess is the real-time multiplayer chess room for the DTF Seeds games hub. This
project preserves the open-source chess engine and room system from `dotnize/chessu` while
replacing player-facing presentation with an original cannabis-themed brand.

Production targets:

- Frontend: `https://chess.dtfseeds.com`
- API and Socket.io: `https://chess-api.dtfseeds.com`
- Parent hub: `https://dtfseeds.com`

## Features

- Legal move validation with `chess.js`
- Real-time create/join rooms through Socket.io
- Invite links, spectator mode, and room chat
- Guest or registered player sessions
- PostgreSQL-backed games, profiles, and archives
- Replayable archived matches
- Responsive Kush Kings board and original custom SVG pieces

## Project guardrails

Do not rebuild or replace the chess rules, room events, or persistence layer unless a verified bug
requires it. Preserve castling, en passant, promotion, check/checkmate/stalemate, draw, resign,
abandon, rematch, spectators, chat, and archive behavior.

Do not use copyrighted chess-site art, third-party cannabis logos, or unapproved brand assets.
New visual assets must be original or explicitly provided and approved for this project.

Internal chess and database side values remain `white` and `black`; player-facing copy uses
light side and dark side.

Additional project context is in [docs/PROJECT_BRIEF.md](docs/PROJECT_BRIEF.md) and
[docs/RESPONSIBILITIES.md](docs/RESPONSIBILITIES.md).

## Branding map

| Standard piece | Kush Kings piece |
| --- | --- |
| King | Master Grower |
| Queen | Mother Plant |
| Bishop | Breeder |
| Knight | Rolling Knight |
| Rook | Grow Tower |
| Pawn | Seedling |

| Standard copy | Player-facing copy |
| --- | --- |
| New Game | Start Match |
| Join Game | Join Session |
| Spectate | Watch the Match |
| Checkmate | Harvest Complete |
| Draw | Even Harvest |
| Resign | Tap Out |
| Rematch | Run It Back |
| Waiting for opponent | Waiting for another grower |

## Tech stack

- Next.js 14, React, TypeScript, Tailwind CSS, and daisyUI
- `react-chessboard` and `chess.js`
- Express and Socket.io
- PostgreSQL
- pnpm workspaces

## Development

Node.js 20 or newer and pnpm 9.15.9 are recommended.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The frontend runs at `http://localhost:3000` and the backend at
`http://localhost:3001`. Configure PostgreSQL before starting the backend:

```dotenv
PGHOST="localhost"
PGPORT="5432"
PGUSER="kush_kings"
PGPASSWORD="local-password"
PGDATABASE="kush_kings_chess"
```

Required release checks:

```bash
pnpm check:rebrand
pnpm --filter client lint
pnpm build:client
pnpm build:server
```

## Containers and production

For a local production-like stack with PostgreSQL:

```bash
docker compose up --build
```

Production uses separate client and server images through `docker-compose.production.yml`.
Follow [docs/DTFSEEDS_DEPLOYMENT.md](docs/DTFSEEDS_DEPLOYMENT.md); this application cannot be
deployed as a static-only site.

## Repository layout

- `client` — Next.js frontend
- `server` — Express + Socket.io backend
- `types` — shared TypeScript models
- `deploy` — Nginx and systemd production examples

## Upstream attribution and license

Original project: `dotnize/chessu`  
Original author: `dotnize`  
Original license: MIT

This fork preserves the upstream MIT license: [LICENSE](LICENSE).

## Definition of done

A release is complete only when it preserves standard chess behavior, passes the required checks,
works in two independent player sessions, supports spectators and chat, uses approved assets, and
has an explicit deployment and rollback record.
