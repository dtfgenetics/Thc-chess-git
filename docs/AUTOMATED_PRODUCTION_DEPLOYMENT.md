# Automated production deployment

The source release is deployed through `.github/workflows/deploy-production.yml` after a Node-capable VPS is provisioned and the two chess DNS records point to it.

## Required GitHub production secrets

Create these repository or `production` environment secrets:

- `KUSH_VPS_HOST` — VPS hostname or IPv4 address.
- `KUSH_VPS_USER` — SSH deploy user.
- `KUSH_VPS_PORT` — optional SSH port; defaults to `22` when empty.
- `KUSH_VPS_SSH_KEY` — private SSH key authorized for the deploy user.
- `KUSH_PG_PASSWORD` — production PostgreSQL password used by the internal Compose database.
- `KUSH_SESSION_SECRET` — random session secret of at least 32 characters.

Never commit these values.

## VPS prerequisites

The deploy user needs:

- Git.
- Docker Engine with the Docker Compose plugin.
- Permission to run Docker directly or through passwordless `sudo docker`.
- Inbound TCP ports 80 and 443 and UDP 443 open to the internet.
- Inbound SSH on the configured port.

No host-level Nginx or Certbot installation is required for the automated path. The Caddy Compose overlay in `deploy/caddy/` handles HTTPS certificates, HTTP/2/3, WebSocket proxying, and automatic renewal.

## DNS

Before the first deployment, point these records at the VPS public IP:

- `chess.dtfseeds.com`
- `chess-api.dtfseeds.com`

Caddy cannot issue trusted certificates until the hostnames resolve publicly to the VPS and ports 80/443 are reachable.

## Deploy

In GitHub Actions, run **Deploy Kush Kings production**. Leave `release_sha` empty to deploy the current `main`, or supply the exact 40-character SHA of a commit already contained in `main`.

The workflow:

1. validates the requested release and production secrets;
2. connects by SSH using strict host-key tracking;
3. writes `.env.production` without committing it;
4. clones or updates the repository under `~/apps/kush-kings-chess`;
5. checks out the exact release SHA;
6. builds the client, server, and PostgreSQL Compose services;
7. starts Caddy for public TLS routing;
8. verifies local client/API health;
9. verifies `https://chess.dtfseeds.com` and `https://chess-api.dtfseeds.com/health` publicly.

A workflow run is not a successful deployment unless the final public HTTPS checks pass.

## Games hub cutover

After the deployment succeeds, change the DTF games-hub Kush Kings link to `https://chess.dtfseeds.com` (or route `/games/kush-kings-chess/` to that application), then perform two-browser multiplayer QA before calling the release live.

## Rollback

Run the same workflow with the full SHA of the previous known-good commit from `main`. The PostgreSQL named volume is preserved by the Compose deployment and must not be deleted during rollback.
