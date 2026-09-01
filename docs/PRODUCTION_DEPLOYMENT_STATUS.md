# Production deployment status

Audit date: 2026-09-01

## Source release

- 3D multiplayer release PR: `#8` — merged.
- Merged `main` release SHA: `d83e540cbe5b93e29a88abb4a0072ba679996716`.
- Exact-head CI before merge passed the optimized client build, server build, player-seat ownership, observer ownership, resignation ownership, draw-offer ownership, and legacy fallback checks.
- The source release includes the default 3D WebGL board, 2D fallback, promotion choice, captured-piece trays, animated validated moves, 3D archives, chat, spectators, reconnect handling, resignation, draw offers, and Play Again / New Match.

The application source is therefore **merged and build verified**.

## Production runtime state

The public DTF games hub still points visitors to the existing lightweight Kush Kings room shell rather than the merged 3D Next.js/Socket.io runtime.

The last verified Hostinger environment available to this project is shared PHP hosting, not a VPS. That environment does not provide the persistent Node.js, Docker, Socket.io, or PostgreSQL runtime required by the full application. The ChatGPT Hostinger connector available during the 2026-09-01 release pass exposes Horizons website creation/editing only; it does not expose hPanel DNS, VPS provisioning, or SSH administration.

The 3D release must therefore not be called live yet.

## Deployment automation prepared

The repository now contains an automated production path:

- `.github/workflows/deploy-production.yml`
- `docker-compose.production.yml`
- `deploy/caddy/Caddyfile`
- `deploy/caddy/docker-compose.caddy.yml`
- `docs/AUTOMATED_PRODUCTION_DEPLOYMENT.md`

The automated path removes the previous host-level Nginx/Certbot requirement. A Docker-capable VPS plus DNS is sufficient; Caddy handles public TLS and WebSocket reverse proxying.

## External provisioning still required

1. Provision a VPS or equivalent persistent Docker-capable Linux host.
2. Point `chess.dtfseeds.com` and `chess-api.dtfseeds.com` to that host.
3. Add the required GitHub `production` secrets listed in `AUTOMATED_PRODUCTION_DEPLOYMENT.md`.
4. Run **Deploy Kush Kings production** for the exact release SHA.
5. Require both public HTTPS health checks to pass.
6. Cut the DTF games-hub route/link over to `https://chess.dtfseeds.com`.
7. Complete two-independent-browser multiplayer QA and mobile/WebGL-fallback QA.

## Release terminology

- **Merged:** yes.
- **Build verified:** yes.
- **Deployment automation:** prepared.
- **VPS provisioned:** not verified.
- **DNS cutover:** not verified.
- **Deployed:** no.
- **Live verified:** no.
