# Site URL Configuration

This project needs separate values for the backend API URL, public frontend URL, and public game name.

## Frontend variables

Use these values when running or deploying the client:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Kush Kings Chess
```

## Why this matters

The upstream project uses the original `ches.su` domain in user-facing game links. THC Chess needs configurable public links so invite/archive URLs point to the correct DTF/THC deployment target instead of the upstream app.

## Next code step

Wire `SITE_URL` and `APP_NAME` from `client/src/config.ts` into `client/src/components/game/GamePage.tsx`:

- Import `APP_NAME` and `SITE_URL` from `@/config`.
- Replace `document.title = "chessu"` with `document.title = APP_NAME`.
- Replace `document.title = "(your turn) chessu"` with a branded title.
- Replace copied invite URL construction with `SITE_URL`.
- Replace displayed `ches.su/...` text with the configured public site URL.

The direct full-file edit was blocked by the connector because `GamePage.tsx` is a large React component. Claude or a local editor should apply the small patch directly on the `fix/site-url-config` branch.
