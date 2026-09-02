# Current Next Step

The Kush Kings source repair and player-experience hardening are merged to `main` at release SHA:

`f041a93c410341094cec4e223867bbdd957e565b`

Do **not** repeat the old GamePage site-URL patch. That work is already complete.

## Next production step

Choose the first available persistent Node.js production path:

1. **Preferred when enabled on the Hostinger account:** deploy two Hostinger managed Web Apps from `main` using `docs/HOSTINGER_MANAGED_WEB_APPS.md`:
   - client → `chess.dtfseeds.com`
   - API / Socket.io → `chess-api.dtfseeds.com`
   - connect PostgreSQL and set the documented production environment variables.
2. **Fallback:** provision a Docker-capable VPS, point both chess DNS records to it, configure the GitHub `production` secrets, and run `.github/workflows/deploy-production.yml` for the exact release SHA.

Do not call the full 3D multiplayer release live until public client/API health checks pass.

## Release QA after deployment

Use two independent player sessions plus a third spectator session and verify:

- create/join/invite flow;
- alternating legal moves and server rejection of illegal/out-of-turn moves;
- promotion, castling, en passant, check/checkmate, draw, resign, disconnect claim, and Play Again;
- chat, chat throttling, spectators, reconnect/rejoin, archives, and 3D replay;
- mobile sizing and the 2D/WebGL fallback.

Only after that QA passes should the DTF games-hub Kush Kings route be cut over to the full runtime.
