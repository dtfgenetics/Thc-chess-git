# Kush Kings Chess / THC Chess

Cannabis-themed online chess for the **THC – Teaching Healthy Cultivation** games ecosystem.

This repo is a fork/reskin of the open-source `dotnize/chessu` chess app. The goal is to preserve the working online chess engine and multiplayer foundation while replacing the default look, copy, and assets with an original cannabis-themed brand.

## Current goal

Build a playable browser-based chess game that can be hosted as part of the THC / DTF games hub.

The finished game should support:

- Real-time online chess matches
- Invite links so players can join a match
- Spectators/watch mode
- Chat during games
- Optional user accounts if we keep the upstream account system
- Mobile-friendly play
- Cannabis-themed board, pieces, UI copy, and landing page

## What we are not doing

We are **not** rebuilding chess rules from scratch.

Do not rewrite or replace the core chess system unless a bug forces it. The existing stack already uses `chess.js` for rules, `react-chessboard` for the board UI, Socket.io for live play, and Express/PostgreSQL for the backend.

Do not use copyrighted art, chess.com assets, Lichess art, cannabis brand logos, Monopoly-style assets, or third-party artwork. All new cannabis art must be original, placeholder SVGs, or user-provided approved assets.

## Upstream attribution

Original project: `dotnize/chessu`  
Original author: `dotnize`  
Original license: MIT

This project must preserve the upstream MIT license attribution while adding THC/Kush Kings branding on top.

## Tech stack

- Next.js 14
- React
- TypeScript
- Tailwind CSS + daisyUI
- react-chessboard
- chess.js
- Express.js
- Socket.io
- PostgreSQL
- pnpm workspaces

## Monorepo structure

- `client/` — Next.js frontend
- `server/` — Express backend
- `types/` — shared types used by client and server

## Working title

Primary game title: **Kush Kings Chess**  
Simple menu title: **THC Chess**

## Cannabis reskin map

| Standard piece | THC/Kush Kings version |
| --- | --- |
| King | Master Grower |
| Queen | Mother Plant / Terp Queen |
| Bishop | Breeder |
| Knight | Rolling Knight |
| Rook | Grow Tower / Dispensary Tower |
| Pawn | Seedling / Clone |

## UI copy direction

| Original wording | Branded wording |
| --- | --- |
| New Game | Start Match |
| Join Game | Join Session |
| Spectate | Watch the Match |
| Checkmate | Harvest Complete |
| Draw | Even Harvest |
| Resign | Tap Out |
| Rematch | Run It Back |
| Waiting for opponent | Waiting for another grower |
| Play as white/black | Join as light/dark side |

## Visual direction

- Light board squares: parchment / cream
- Dark board squares: deep cannabis green
- Highlights: gold
- Legal move indicators: soft green glow
- Check warning: amber/red glow
- General UI: clean, readable, mature, game-ready
- Avoid sloppy weed-leaf overload; make it look like a real polished board game/digital product

## Responsibility map

- **User / DTFlow artist:** approves naming, visual direction, final cannabis assets, and deployment target.
- **ChatGPT:** project architect, repo reviewer, branch/task planner, QA checklist owner, code review helper, documentation editor.
- **Claude:** implementation partner for branch-by-branch code edits and larger refactors.
- **GitHub:** source of truth for files, branches, pull requests, issues, and release history.

## First implementation phases

1. Verify fork/source health.
2. Audit repo structure.
3. Fix hardcoded upstream URLs and branding references.
4. Add THC/Kush Kings theme variables.
5. Reskin board colors and highlights.
6. Add original placeholder cannabis piece assets.
7. Rebrand visible UI copy.
8. Test local two-player multiplayer.
9. Prepare deployment instructions.

## Local development

Node.js 20 or newer is recommended.

Install dependencies:

```bash
pnpm install
```

Run frontend and backend together:

```bash
pnpm dev
```

Run separately:

```bash
pnpm dev:client
pnpm dev:server
```

Expected local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

## Required server environment

Create `server/.env` with PostgreSQL settings:

```env
PGHOST=db.example.com
PGUSER=exampleuser
PGPASSWORD=examplepassword
PGDATABASE=chessu
```

## Build checks

```bash
pnpm lint
pnpm build:client
pnpm build:server
```

## Definition of done

A change is not complete until:

1. It preserves all standard chess rules.
2. It does not break multiplayer room creation/joining.
3. It does not break spectators or chat.
4. It does not add unapproved third-party art.
5. It keeps MIT attribution intact.
6. It runs locally.
7. It has clear notes for the next person working on the repo.
