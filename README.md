# Kush Kings Chess

Kush Kings Chess is the real-time multiplayer chess room for the DTF Seeds games hub. It keeps
standard chess rules and persistence while presenting the board as light side versus dark side
with original cannabis-themed pieces.

Production targets:

- Frontend: `https://chess.dtfseeds.com`
- API and Socket.io: `https://chess-api.dtfseeds.com`
- Parent hub: `https://dtfseeds.com`

## Features

- Legal move validation with `chess.js`
- Real-time create/join rooms through Socket.io
- Spectator mode and room chat
- Guest or registered player sessions
- PostgreSQL-backed games, profiles, and archives
- Replayable archived matches
- Responsive Kush Kings board and custom SVG pieces

## Development

Node.js 20 or newer and pnpm 9 are recommended.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The frontend runs at `http://localhost:3000` and the backend at
`http://localhost:3001`. Configure PostgreSQL through the `PG*` environment variables before
starting the backend.

Required release checks:

```bash
pnpm check:rebrand
pnpm --filter client lint
pnpm build:client
pnpm build:server
```

## Containers

For a local production-like stack with PostgreSQL:

```bash
docker compose up --build
```

Production uses separate client and server images through `docker-compose.production.yml`.
Follow [docs/DTFSEEDS_DEPLOYMENT.md](docs/DTFSEEDS_DEPLOYMENT.md); do not deploy this application
as a static-only site.

## Repository layout

- `client` — Next.js frontend
- `server` — Express + Socket.io backend
- `types` — shared TypeScript models
- `deploy` — Nginx and systemd production examples

## License

[MIT](LICENSE)
