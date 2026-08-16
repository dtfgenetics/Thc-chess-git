# Kush Kings Chess / THC Chess — Source of Truth

`dtfgenetics/Thc-chess-git` is the canonical code and machine-readable production repository for Kush Kings Chess / THC Chess.

Google Drive `04 Games/THC Chess` is canonical for approved human-readable rules, original art masters, printable/reference assets, playtest evidence, release records, and archived proofs.

## Production mapping

- Frontend: `https://chess.dtfseeds.com/`
- API / Socket.IO: `https://chess-api.dtfseeds.com/`
- Default branch: `main`
- Client/server/database architecture must remain intact unless a verified defect requires a change.

## Locked behavior

Preserve legal chess behavior including castling, en passant, promotion, check/checkmate/stalemate, draw, resign, abandon, rematch, spectators, chat, and archived games. Internal side values stay `white` and `black`; player-facing presentation may use the approved branded language.

## Release

A release requires the repository rebrand check, client lint/build, server build, two-player smoke test, spectator/chat test, approved original assets, deployment record, live frontend/API verification, and rollback record.
