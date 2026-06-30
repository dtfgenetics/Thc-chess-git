# Verify Site URL Config

After the GamePage patch is applied, verify these points:

1. Browser title says `Kush Kings Chess` instead of `chessu`.
2. During your turn, browser title says `(your turn) Kush Kings Chess`.
3. Copy invite link uses the configured frontend site URL.
4. Archive link display no longer says `ches.su`.
5. Local fallback works at `http://localhost:3000`.
6. Game rules, moves, sockets, spectators, and chat are unchanged.

Commands:

```bash
pnpm --filter client lint
pnpm build:client
```
