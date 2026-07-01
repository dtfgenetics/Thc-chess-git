# Project Brief — Kush Kings Chess / THC Chess

## One-sentence concept

A polished cannabis-themed online chess game where standard chess becomes a THC-branded battle between growers, plants, breeders, towers, and seedlings.

## Product goal

Create a playable web game that can live inside the THC / DTF games hub and support online matches through invite links.

The game should be familiar enough that chess players instantly understand it, but branded enough that it feels like a THC original product.

## Target player experience

A player should be able to:

1. Open the game on desktop or mobile.
2. Start a match.
3. Share a link with another player.
4. Play normal chess in real time.
5. Watch as a spectator if not playing.
6. Use chat if enabled.
7. See a THC/Kush Kings themed board, pieces, and interface.

## Tone

- Clever
- Clean
- Cannabis-themed
- Mature
- Game-ready
- Easy to understand

Avoid cheap-looking weed graphics or confusing chess-rule changes.

## Naming direction

Primary: **Kush Kings Chess**
Secondary/menu label: **THC Chess**

Possible subtitles:

- Strategy on a Higher Level
- Grow Your Gambit
- Checkmate the Garden
- The High Board Strategy Game

## Reskin strategy

We will reskin in layers:

1. Documentation and project ownership
2. Configurable site URL and app name
3. Board colors and highlight styles
4. UI copy
5. Placeholder cannabis SVG pieces
6. Branded landing/menu screen
7. Final artwork pass
8. Deployment polish

## Piece theme

| Chess piece | Cannabis concept | Visual idea |
| --- | --- | --- |
| King | Master Grower | Crowned grower silhouette or crown over plant |
| Queen | Mother Plant / Terp Queen | Elegant mother plant with crown/halo |
| Bishop | Breeder | Seed/helix/robe-inspired breeder icon |
| Knight | Rolling Knight | Horse/knight with rolled scroll/joint motif, original design only |
| Rook | Grow Tower / Dispensary Tower | Tower, tent, or dispensary-style structure |
| Pawn | Seedling / Clone | Small sprout/clone cup icon |

## First required fixes

1. Replace hardcoded `ches.su` public links with `NEXT_PUBLIC_SITE_URL`.
2. Replace browser title `chessu` with `Kush Kings Chess` or configurable app name.
3. Replace board colors with THC theme colors.
4. Add a clear asset folder for custom pieces.
5. Document final-art drop locations.

## Deployment direction

Likely deployment options:

- Subdomain such as `chess.dtfseeds.com`
- Route inside games hub if infrastructure supports Node/Socket.io hosting
- Separate frontend and backend hosts if needed

Important: this app has both frontend and backend/socket services. It is not just a static WordPress page.

## Success criteria for v1

V1 is successful when:

- Two players can play online using an invite link.
- The board and interface are visibly THC/Kush Kings themed.
- The default upstream branding is removed from user-facing UI.
- Standard chess works normally.
- Mobile play is usable.
- Deployment requirements are documented.
