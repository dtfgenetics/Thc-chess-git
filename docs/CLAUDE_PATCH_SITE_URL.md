# Claude Patch — Fix hardcoded site URL and app title

Branch: `fix/site-url-config`

## Goal

Finish wiring the new config values from `client/src/config.ts` into the live game page.

## Current completed change

`client/src/config.ts` now exports:

```ts
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Kush Kings Chess";
```

## Required file to patch

`client/src/components/game/GamePage.tsx`

## Exact edits

1. Change the config import:

```ts
import { API_URL } from "@/config";
```

to:

```ts
import { API_URL, APP_NAME, SITE_URL } from "@/config";
```

2. Replace browser title logic:

```ts
document.title = "(your turn) chessu";
```

with:

```ts
document.title = `(your turn) ${APP_NAME}`;
```

and replace:

```ts
document.title = "chessu";
```

with:

```ts
document.title = APP_NAME;
```

3. Add helper functions near `copyInvite()`:

```ts
function getGamePath() {
  return lobby.endReason ? `archive/${lobby.id}` : initialLobby.code;
}

function getGameUrl() {
  return `${SITE_URL.replace(/\/$/, "")}/${getGamePath()}`;
}

function getDisplayGameUrl() {
  return getGameUrl().replace(/^https?:\/\//, "");
}
```

4. Replace this in `copyInvite()`:

```ts
const text = `https://ches.su/${lobby.endReason ? `archive/${lobby.id}` : initialLobby.code}`;
```

with:

```ts
const text = getGameUrl();
```

5. Replace displayed invite text:

```tsx
ches.su/{lobby.endReason ? `archive/${lobby.id}` : initialLobby.code}
```

with:

```tsx
{getDisplayGameUrl()}
```

6. Replace archived display text:

```tsx
ches.su/archive/{lobby.id}
```

with:

```tsx
{getDisplayGameUrl()}
```

## Optional small UI wording polish

Change:

```tsx
Waiting for opponent.
```

to:

```tsx
Waiting for another grower.
```

Change:

```tsx
Play as {lobby.white?.id ? "black" : "white"}
```

to:

```tsx
Join as {lobby.white?.id ? "dark side" : "light side"}
```

## Verification

Run:

```bash
pnpm --filter client lint
pnpm build:client
```

Then test:

1. Start a match locally.
2. Copy invite link.
3. Confirm it uses `NEXT_PUBLIC_SITE_URL` or local origin.
4. Confirm browser title says `Kush Kings Chess`, not `chessu`.
5. Confirm archive display no longer says `ches.su`.
