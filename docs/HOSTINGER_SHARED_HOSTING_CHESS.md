# Hostinger shared hosting build for Kush Kings Chess

Branch: `php-shared-hosting-build`

Goal: run Kush Kings Chess on the existing `dtfseeds.com` Hostinger shared hosting account without VPS, Node hosting, Socket.io hosting, PostgreSQL, Render, Railway, Supabase, Neon, or another paid service.

## Production target

Upload folder:

```text
public_html/games/kush-kings-chess/
```

Public URL:

```text
https://dtfseeds.com/games/kush-kings-chess/play.php
```

## Current working fallback

This branch now includes a PHP-first fallback page at:

```text
public-hostinger/kush-kings-chess/play.php
```

It supports:

- create a room
- open a room by code
- join the dark side
- render the board from the stored FEN
- enter manual moves like `e2` to `e4`
- save moves to MySQL
- update stored FEN and move text

This is not the final polished drag-and-drop UI. It is the proof that the game can run on the existing PHP/MySQL hosting path.

## Hostinger setup steps

1. Open Hostinger hPanel.
2. Create a MySQL or MariaDB database.
3. Create a database user.
4. Import:

```text
public-hostinger/kush-kings-chess/database/schema.sql
```

5. Upload the contents of:

```text
public-hostinger/kush-kings-chess/
```

into:

```text
public_html/games/kush-kings-chess/
```

6. Copy:

```text
api/config.example.php
```

to:

```text
api/config.php
```

7. Fill in the Hostinger database values in `api/config.php` inside hPanel/File Manager.
8. Open:

```text
https://dtfseeds.com/games/kush-kings-chess/play.php
```

9. Create a match.
10. Copy/open the room URL on another device or browser.
11. Join the dark side.
12. Test manual move entry.

## Important security rules

- Do not commit `api/config.php` with real database values.
- Keep real database values only inside Hostinger File Manager.
- Use prepared SQL statements for all database writes.
- Sanitize player names and message text.

## Remaining work before public launch

- Add the polished frontend JavaScript drag-and-drop board.
- Add fuller chess legality validation with browser chess.js or server-side validation.
- Add better chat polling/rendering.
- Add archive/replay UI.
- Add the DTF Seeds games-hub card.
- Upload to Hostinger and test on the live domain.
