# Production deployment status

Audit date: 2026-09-01

## Current source release

- Player-experience and room-lifecycle hardening PR: `#11` — merged.
- Current merged `main` release SHA: `f041a93c410341094cec4e223867bbdd957e565b`.
- Exact-head CI before merge passed the optimized client build, server build, player-seat ownership, observer ownership, resignation ownership, draw-offer ownership, chat validation/rate limiting, room-selection/explicit-leave routing, deployment configuration, and shared-hosting fallback checks.
- The release preserves the server-authoritative chess engine and adds chat normalization/throttling, deterministic lobby leave routing, client throttle feedback, and improved promotion keyboard/focus behavior.
- The existing 3D release features remain intact: WebGL board, 2D fallback, promotion choice, captured-piece trays, animated validated moves, 3D archives, chat, spectators, reconnect handling, resignation, draw offers, and Play Again / New Match.

The application source is therefore **merged and build verified**.

## Production runtime state

The public DTF games hub must still be treated as serving the existing lightweight Kush Kings room shell unless the full Node.js runtime has separately passed the public verification checklist.

No production deployment of release `f041a93c410341094cec4e223867bbdd957e565b` has been verified from this repository session. The connected ChatGPT Hostinger integration exposes Horizons website creation/editing only; it does not expose hPanel Web App management, DNS administration, VPS provisioning, or SSH administration.

The full 3D release must therefore **not** be called live yet.

## Supported production paths

### Preferred: Hostinger managed Web Apps

When the Hostinger account includes Node.js Web Apps, use `docs/HOSTINGER_MANAGED_WEB_APPS.md` and deploy two applications from `main`:

- Next.js client → `chess.dtfseeds.com`
- Express + Socket.io API → `chess-api.dtfseeds.com`

Connect PostgreSQL through the Hostinger database flow and set the documented production environment variables before building the client/API.

### Fallback: Docker-capable VPS

The repository also contains the automated VPS path:

- `.github/workflows/deploy-production.yml`
- `docker-compose.production.yml`
- `deploy/caddy/Caddyfile`
- `deploy/caddy/docker-compose.caddy.yml`
- `docs/AUTOMATED_PRODUCTION_DEPLOYMENT.md`

Caddy handles public TLS and WebSocket reverse proxying. The workflow requires the documented GitHub `production` secrets and valid DNS before it can succeed.

## Remaining release steps

1. Confirm whether Hostinger managed Node.js Web Apps are available; use that path when available.
2. Otherwise provision a persistent Docker-capable VPS.
3. Configure `chess.dtfseeds.com` and `chess-api.dtfseeds.com` for the selected runtime.
4. Configure production secrets/environment variables and PostgreSQL.
5. Deploy exact release SHA `f041a93c410341094cec4e223867bbdd957e565b`.
6. Require both public HTTPS client/API health checks to pass.
7. Complete two-independent-browser multiplayer QA, a spectator/chat pass, archive/replay QA, and mobile/WebGL-fallback QA.
8. Only then cut the DTF games-hub Kush Kings route/link over to the full runtime.

## Release terminology

- **Merged:** yes.
- **Build verified:** yes.
- **Player-experience hardening:** merged.
- **Managed Web Apps deployment path:** documented.
- **VPS deployment automation:** prepared.
- **Persistent Node.js production runtime:** not verified.
- **DNS cutover:** not verified.
- **Release `f041a93c...` deployed:** not verified.
- **Full 3D multiplayer release live verified:** no.
