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
- Added original placeholder SVG chess piece pack.
- Added asset registry in `client/src/kushTheme.ts`.
- Added stored GamePage patch and apply script.

Still required before merge/release:

- Apply `scripts/apply-gamepage-patch.sh` locally or through an editor that can modify `GamePage.tsx`.
- Commit the changed `client/src/components/game/GamePage.tsx`.
- Confirm CI passes.
- Merge PR #2.

Next after merge:

- Wire `KUSH_PIECE_ASSETS` into the `react-chessboard` `customPieces` prop.
- Replace placeholder pieces with polished final art if needed.
- Deploy frontend and backend with the production env values.
