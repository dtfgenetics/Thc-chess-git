# Production deployment status

Audit date: 2026-07-01

## Repository and CI

- PR #2 was squash-merged into `main` as commit `3de69c9`.
- Deployment branch: `deploy/dtfseeds-production`
- Client CI: frozen install, rebrand check, lint, and production build pass.
- Server CI: frozen install and TypeScript production build pass.

## Current live state

- `https://dtfseeds.com` responds successfully.
- `chess.dtfseeds.com` does not resolve in DNS.
- `chess-api.dtfseeds.com` does not resolve in DNS.
- The available Hostinger SSH account is shared PHP hosting, not a VPS.
- The account has PHP 8.2 but no Node.js, npm, pnpm, Docker, Podman, PM2, systemd,
  PostgreSQL client/server, or Nginx executable.
- No chess subdomain document roots currently exist under the account's domain directories.

The game is therefore **not deployed**. Uploading the client as static files would not provide
Next.js server rendering, Socket.io rooms, sessions, chat, spectators, or archived multiplayer
matches and must not be presented as a production release.

## Provisioning required

1. Provide Hostinger hPanel/DNS access and provision a VPS, or provide an equivalent Node-capable
   host plus managed PostgreSQL.
2. Create `A`/`AAAA` records for `chess.dtfseeds.com` and `chess-api.dtfseeds.com`.
3. Create `.env.production` from the committed example and supply real PostgreSQL credentials and
   a generated `SESSION_SECRET`; never commit those values.
4. Deploy `docker-compose.production.yml` or equivalent persistent client/server services.
5. Install the supplied Nginx configuration and issue TLS certificates for both hostnames.
6. Run the endpoint and two-browser multiplayer verification in
   `docs/DTFSEEDS_DEPLOYMENT.md`.
7. Only after the live smoke tests pass, add the playable link to the DTF Seeds games hub.

## Credentials/settings still needed

- Hostinger hPanel or authoritative DNS access
- VPS hostname/IP, SSH user, port, and deploy key authorization
- Production PostgreSQL host, database, user, password, and TLS requirements
- Permission to issue TLS certificates for both chess subdomains
- Permission to update the DTF Seeds games hub after live verification
