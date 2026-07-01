# Kush Kings Chess VPS runbook

This runbook targets a clean Ubuntu 22.04 or 24.04 VPS. Run it only after both DTF Seeds DNS
records point to the VPS. Shared PHP hosting cannot run this stack.

## DNS records

Create these records in the authoritative DNS zone for `dtfseeds.com`:

| Type | Name | Value | TTL |
| --- | --- | --- | --- |
| `A` | `chess` | `<VPS public IPv4>` | `300` |
| `A` | `chess-api` | `<VPS public IPv4>` | `300` |

Add matching `AAAA` records only when the VPS has working public IPv6. Remove conflicting `A`,
`AAAA`, or `CNAME` records first. Verify before requesting TLS:

```bash
dig +short chess.dtfseeds.com A
dig +short chess-api.dtfseeds.com A
```

Both commands must return the VPS address.

## Install host packages

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg git nginx certbot

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

. /etc/os-release
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
```

Allow inbound TCP ports 22, 80, and 443 in the VPS firewall/provider firewall. Do not expose
ports 3000, 3001, or 5432 publicly.

## Clone the deployment branch

```bash
sudo install -d -o "$USER" -g "$USER" /opt/kush-kings-chess
git clone https://github.com/dtfgenetics/Thc-chess-git.git /opt/kush-kings-chess
cd /opt/kush-kings-chess
git checkout deploy/dtfseeds-production
git pull --ff-only origin deploy/dtfseeds-production
```

After the deployment PR is merged, production may instead pin the reviewed merge commit from
`main`.

## Create the production environment

```bash
cd /opt/kush-kings-chess
cp .env.production.example .env.production
chmod 600 .env.production
openssl rand -hex 48
```

Edit `.env.production`. Put the generated value in `SESSION_SECRET`, replace every PostgreSQL
placeholder, and keep these public settings unchanged:

```dotenv
APP_NAME="Kush Kings Chess"
NODE_ENV="production"
NEXT_PUBLIC_APP_NAME="Kush Kings Chess"
NEXT_PUBLIC_SITE_URL="https://chess.dtfseeds.com"
NEXT_PUBLIC_API_URL="https://chess-api.dtfseeds.com"
PORT="3001"
CORS_ORIGIN="https://chess.dtfseeds.com,https://dtfseeds.com,https://www.dtfseeds.com"
SESSION_COOKIE_NAME="kush_kings_chess"
SESSION_COOKIE_DOMAIN=".dtfseeds.com"
PGHOST="db"
PGPORT="5432"
PGDATABASE="kush_kings_chess"
```

Before starting services:

```bash
if grep -q '<.*>' .env.production; then
  echo "Replace every production placeholder before deployment." >&2
  exit 1
fi
```

## Build and start the stack

```bash
cd /opt/kush-kings-chess
sudo docker compose --env-file .env.production -f docker-compose.production.yml build --pull
sudo docker compose --env-file .env.production -f docker-compose.production.yml up -d
sudo docker compose --env-file .env.production -f docker-compose.production.yml ps
curl --fail --silent --show-error http://127.0.0.1:3001/health
```

All three services must be healthy and `/health` must report `Kush Kings Chess`.

## Issue TLS and enable Nginx

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

Verify the public endpoints:

```bash
curl --fail --head https://chess.dtfseeds.com
curl --fail https://chess-api.dtfseeds.com/health
```

## Enable boot-time recovery

```bash
sudo cp deploy/systemd/kush-kings-chess.service /etc/systemd/system/kush-kings-chess.service
sudo systemctl daemon-reload
sudo systemctl enable --now kush-kings-chess
```

## Update and rollback

Record the deployed commit before every update:

```bash
cd /opt/kush-kings-chess
git rev-parse HEAD
sudo docker compose --env-file .env.production -f docker-compose.production.yml ps
```

Update only after CI and review pass:

```bash
git fetch origin
git checkout <reviewed-branch-or-commit>
sudo docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
```

Rollback without deleting the PostgreSQL volume:

```bash
git checkout <previous-known-good-commit>
sudo docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
curl --fail https://chess-api.dtfseeds.com/health
```

Never run `docker compose down --volumes` during a deployment or rollback.
