# PR #2 Status

Branch: `fix/site-url-config`

Production target:

- DTF Seeds games hub
- Frontend: `https://chess.dtfseeds.com`
- Backend/API/socket room: `https://chess-api.dtfseeds.com`

Completed:

- Added `SITE_URL` and `APP_NAME` frontend config.
- Added DTF production env example.
- Added DTF deployment plan.
- Added server health endpoint.
- Added production CORS origin support.
- Added production cookie name/domain support.
- Added client and server CI checks.
- Rebranded homepage.
- Rebranded header/footer.
- Rebranded public matches panel.
- Rebranded create and join flows.
- Added Kush Kings daisyUI theme.
- Added original SVG brand mark.
- Added original cannabis-themed SVG chess piece pack.
- Added asset registry in `client/src/kushTheme.ts`.
- Patched the live `GamePage.tsx` to use configurable URLs, branded copy, Kush board colors, custom pieces, and drag-safe animations.
- Patched the archived board to use the same custom pieces and board colors.
- Kept the old GamePage patch and apply script as historical reference only.
- Added production container, Nginx, and systemd deployment examples.

Still required before merge/release:

- Confirm the required lint and build checks pass.
- Review and merge PR #2.
- Provision production DNS, TLS, PostgreSQL, and secrets.

Next after merge:

- Deploy frontend and backend with the production env values.
- Link or embed `https://chess.dtfseeds.com` from the DTF Seeds games hub.
