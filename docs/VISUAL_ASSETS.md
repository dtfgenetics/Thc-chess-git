# Visual Assets

## Brand

- `client/public/kush-kings-mark.svg`
  - Current use: brand mark / future favicon / app icon
  - Status: original placeholder mark
  - Direction: crown + cannabis leaf + chess identity

## Board Theme

Defined in `client/src/kushTheme.ts`.

- Light square: parchment cream
- Dark square: deep cannabis green
- Move highlight: gold
- Legal move indicator: green glow
- Check warning: red/amber warning
- Right-click marker: green marker

## Chess Pieces

Piece assets live in `client/public/kush-pieces/`.

### Light Side

- `light-king.svg` — Master Grower / King
- `light-queen.svg` — Mother Plant / Queen
- `light-bishop.svg` — Breeder / Bishop
- `light-knight.svg` — Rolling Knight / Knight
- `light-rook.svg` — Grow Tower / Rook
- `light-pawn.svg` — Seedling / Pawn

### Dark Side

- `dark-king.svg` — Master Grower / King
- `dark-queen.svg` — Mother Plant / Queen
- `dark-bishop.svg` — Breeder / Bishop
- `dark-knight.svg` — Rolling Knight / Knight
- `dark-rook.svg` — Grow Tower / Rook
- `dark-pawn.svg` — Seedling / Pawn

## Frontend Registry

The active piece path registry is in:

- `client/src/kushTheme.ts`

Export:

- `KUSH_PIECE_ASSETS`

## Current Integration

Completed:

- Theme constants are created.
- Piece assets are created.
- Archived game board is wired to the Kush theme and piece assets.
- Manifest is rebranded to Kush Kings Chess.

Remaining:

- Wire `KUSH_PIECE_ASSETS` into the live `GamePage.tsx` board.
- Wire `KUSH_BOARD_THEME` into the live `GamePage.tsx` board colors.
- Replace placeholder SVGs with final polished art after the live game room is stable.
