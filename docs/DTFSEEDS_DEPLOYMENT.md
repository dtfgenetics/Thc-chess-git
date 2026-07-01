# DTF Seeds production deployment

Kush Kings Chess is a three-service application: a Next.js frontend, an Express + Socket.io
room server, and PostgreSQL. It cannot be deployed as static files alone.

## Production endpoints

- Games hub: `https://dtfseeds.com`
- Game frontend: `https://chess.dtfseeds.com`
- API and Socket.io: `https://chess-api.dtfseeds.com`

## Access required

Deployment requires all of the following. Do not claim the game is live until each item is
available and the verification section passes.

- Hostinger hPanel or authoritative DNS access for `dtfseeds.com`
- A VPS with SSH and sudo access; shared static hosting is insufficient for Socket.io
- Permission to create the `chess` and `chess-api` DNS records
- Permission to install Docker, Docker Compose, Nginx, and Certbot
- A PostgreSQL password and a new production session secret
- Access to the DTF Seeds games hub/CMS to publish the game link or embed
- Repository read access on the production host if the repository is private

## 1. DNS

Create `A` records for `chess.dtfseeds.com` and `chess-api.dtfseeds.com` pointing to the VPS
IPv4 address. Add matching `AAAA` records only when the VPS has working public IPv6. Wait until
both hostnames resolve to the server before requesting certificates.

## 2. Host prerequisites

Install Docker Engine with the Compose plugin, Nginx, and Certbot using the VPS distribution's
supported packages. Allow inbound TCP ports 22, 80, and 443. Ports 3000, 3001, and 5432 must not
be exposed publicly; the production Compose file binds the app ports to loopback only and keeps
PostgreSQL internal.

Clone the repository to `/opt/kush-kings-chess` and check out the release commit.

## 3. Production environment

```bash
cd /opt/kush-kings-chess
cp .env.production.example .env.production
chmod 600 .env.production
openssl rand -hex 32
```

Put the generated value in `SESSION_SECRET`, replace every PostgreSQL placeholder, and keep
`.env.production` off Git. When using `docker-compose.production.yml`, `PGHOST` is overridden to
the internal service name `db`. For an external managed database, remove that override and use
the provider's host and TLS requirements.

The public values must remain:

```dotenv
NEXT_PUBLIC_APP_NAME="Kush Kings Chess"
NEXT_PUBLIC_SITE_URL="https://chess.dtfseeds.com"
NEXT_PUBLIC_API_URL="https://chess-api.dtfseeds.com"
CORS_ORIGIN="https://chess.dtfseeds.com,https://dtfseeds.com,https://www.dtfseeds.com"
SESSION_COOKIE_NAME="kush_kings_chess"
SESSION_COOKIE_DOMAIN=".dtfseeds.com"
```

`NEXT_PUBLIC_*` values are compiled into the client image. Rebuild the client after changing
them.

## 4. Build and start

```bash
docker compose --env-file .env.production -f docker-compose.production.yml build --pull
docker compose --env-file .env.production -f docker-compose.production.yml up -d
docker compose --env-file .env.production -f docker-compose.production.yml ps
curl --fail http://127.0.0.1:3001/health
```

The health response must include `"status":"ok"` and `"app":"Kush Kings Chess"`.

For boot-time management, install `deploy/systemd/kush-kings-chess.service` at
`/etc/systemd/system/kush-kings-chess.service`, then run:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now kush-kings-chess
```

## 5. HTTPS reverse proxy

After DNS resolves, request one certificate containing both names before enabling the supplied
TLS configuration:

```bash
sudo systemctl stop nginx
sudo certbot certonly --standalone \
  -d chess.dtfseeds.com \
  -d chess-api.dtfseeds.com \
  --cert-name chess.dtfseeds.com
sudo systemctl start nginx
sudo cp deploy/nginx/kush-kings-chess.conf /etc/nginx/conf.d/kush-kings-chess.conf
sudo nginx -t
sudo systemctl reload nginx
```

The API proxy preserves the `Upgrade` and `Connection` headers required by Socket.io.

## 6. Games hub integration

Add a Kush Kings Chess entry in the DTF Seeds games hub that links to
`https://chess.dtfseeds.com`. An iframe is optional; a normal link is the more robust first
release. If embedding, validate mobile sizing and the parent site's content-security policy.

## 7. Production verification

Automated endpoint checks:

```bash
curl --fail https://chess-api.dtfseeds.com/health
curl --fail --head https://chess.dtfseeds.com
docker compose --env-file .env.production -f docker-compose.production.yml logs --tail=200
```

Manual release checks require two independent browser sessions:

- Homepage identifies Kush Kings Chess and has no old upstream branding.
- Create a match and confirm its invite URL begins with `https://chess.dtfseeds.com/`.
- Join from the second session and play legal moves from both sides.
- Confirm an illegal move is rejected and check/checkmate state is correct.
- Confirm castling, en passant, promotion, draw, resign, abandon/claim, and rematch behavior.
- Open a third session as a spectator and verify watch mode and chat.
- Complete a match, open its archive, navigate moves, and copy the archive URL.
- Confirm custom pieces render on live and archived boards and dragging is not offset.
- Check desktop and mobile layouts and browser console/network errors.

## Rollback

Check out the last known-good commit, rebuild, and start the Compose project again. Do not delete
the `postgres_data` volume during rollback.
